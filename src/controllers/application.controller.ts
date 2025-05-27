import { RequestWithUser } from "@customTypes/RequestWithUser";
import { prisma } from "@lib/prisma";
import { getUserFromRequest } from "@utils/index";
import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Query,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";

export type CreateApplicationDto = {
  jobId: number;
  userId?: number;
};

@Route("applications")
@Tags("Application")
export class ApplicationController extends Controller {
  @Security("bearerAuth")
  @Get()
  public async getApplications(
    @Query() userId: number,
    @Request() req: RequestWithUser
  ): Promise<any[]> {
    const user = req.user;

    if (!user) {
      this.setStatus(401);
      throw new Error("Não autenticado");
    }

    const isAdmin = user.role === "ADMIN";

    // USER só pode consultar suas próprias inscrições
    if (!isAdmin && userId && userId !== user.userId) {
      this.setStatus(403);
      throw new Error("Você só pode visualizar suas próprias inscrições");
    }

    const filterUserId = userId ?? user.userId;

    return prisma.application.findMany({
      where: {
        userId: filterUserId,
        deletedAt: null,
      },
      include: {
        job: { include: { company: true } },
      },
    });
  }

  @Security("bearerAuth")
  @Post()
  public async applyToJob(
    @Body() body: CreateApplicationDto,
    @Request() req: RequestWithUser
  ): Promise<any> {
    const user = req.user;

    if (!user) {
      this.setStatus(401);
      throw new Error("Não autenticado");
    }

    const isAdmin = user.role === "ADMIN";
    const targetUserId = body.userId ?? user.userId;

    if (!isAdmin && targetUserId !== user.userId) {
      this.setStatus(403);
      throw new Error("Você não pode aplicar em nome de outro usuário");
    }

    const job = await prisma.job.findFirst({
      where: {
        id: body.jobId,
        deletedAt: null,
        status: "OPEN",
      },
    });

    if (!job) {
      this.setStatus(400);
      throw new Error("Vaga não disponível");
    }

    const existing = await prisma.application.findFirst({
      where: {
        userId: targetUserId,
        jobId: body.jobId,
        deletedAt: null,
      },
    });

    if (existing) {
      this.setStatus(409);
      throw new Error("Já existe uma inscrição para essa vaga");
    }

    return prisma.application.create({
      data: {
        userId: targetUserId,
        jobId: body.jobId,
      },
    });
  }

  @Security("bearerAuth")
  @Delete("{id}")
  public async cancelApplication(
    @Path() id: number,
    @Request() req: RequestWithUser
  ): Promise<void> {
    const user = req.user;

    if (!user) {
      this.setStatus(401);
      throw new Error("Não autenticado");
    }

    const application = await prisma.application.findUnique({ where: { id } });

    if (!application || application.deletedAt) {
      this.setStatus(404);
      throw new Error("Inscrição não encontrada");
    }

    const isAdmin = user.role === "ADMIN";

    if (!isAdmin && application.userId !== user.userId) {
      this.setStatus(403);
      throw new Error("Você só pode cancelar suas próprias inscrições");
    }

    await prisma.application.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.setStatus(204);
  }
}
