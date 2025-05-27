import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";

import { RequestWithUser } from "@customTypes/RequestWithUser";
import { prisma } from "@lib/prisma";
import { Role } from "@prisma/client";
import { hasRole, throwError } from "@utils/index";

export type CreateApplicationDto = {
  jobId: number;
  userId: number;
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

    if (!user || !hasRole(user, [Role.ADMIN, Role.USER])) {
      throwError(this, 403, "Acesso negado");
    }

    if (userId == null) {
      throwError(this, 400, "Parâmetro 'userId' é obrigatório");
    }

    if (!hasRole(user, [Role.ADMIN]) && userId !== user.userId) {
      throwError(this, 403, "Você só pode visualizar suas próprias inscrições");
    }

    return prisma.application.findMany({
      where: {
        userId,
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

    if (!user || !hasRole(user, [Role.ADMIN, Role.USER]))
      throwError(this, 403, "Acesso negado");

    const isAdmin = user.role === "ADMIN";
    const targetUserId = body.userId ?? user.userId;

    if (!isAdmin && targetUserId !== user.userId)
      throwError(this, 403, "Você não pode aplicar em nome de outro usuário");

    const job = await prisma.job.findFirst({
      where: {
        id: body.jobId,
        deletedAt: null,
        status: "OPEN",
      },
    });

    if (!job) throwError(this, 400, "Vaga não disponível");

    const existing = await prisma.application.findFirst({
      where: {
        userId: targetUserId,
        jobId: body.jobId,
        deletedAt: null,
      },
    });

    if (existing)
      throwError(this, 409, "Já existe uma inscrição para essa vaga");

    return prisma.application.create({
      data: {
        userId: targetUserId,
        jobId: body.jobId,
      },
    });
  }
}
