import {
  Controller,
  Route,
  Tags,
  Get,
  Post,
  Patch,
  Delete,
  Path,
  Body,
  Request,
  Security,
} from "tsoa";
import { prisma } from "@lib/prisma";
import { Request as ExpressRequest } from "express";

export type CreateJobDto = {
  title: string;
  description: string;
  companyId: number;
};

export type UpdateJobDto = {
  title?: string;
  description?: string;
  status?: "OPEN" | "CLOSED";
};

@Route("jobs")
@Tags("Job")
export class JobController extends Controller {
  @Security("bearerAuth")
  @Get()
  public async getAll(): Promise<any[]> {
    return prisma.job.findMany({
      where: { deletedAt: null },
      include: { company: true, applications: true },
    });
  }

  @Security("bearerAuth")
  @Get("{id}")
  public async getById(@Path() id: number): Promise<any> {
    const job = await prisma.job.findUnique({
      where: { id },
      include: { company: true, applications: true },
    });

    if (!job || job.deletedAt) {
      this.setStatus(404);
      throw new Error("Vaga não encontrada");
    }

    return job;
  }

  @Security("bearerAuth")
  @Post()
  public async create(
    @Body() body: CreateJobDto,
    @Request() req: ExpressRequest
  ): Promise<any> {
    const user = req.user;

    if (!user || !["ADMIN", "COMPANY_ADMIN"].includes(user.role)) {
      this.setStatus(403);
      throw new Error("Acesso negado");
    }

    if (user.role === "COMPANY_ADMIN" && user.companyId !== body.companyId) {
      this.setStatus(403);
      throw new Error("Você só pode criar vagas da sua própria empresa");
    }

    return prisma.job.create({
      data: body,
    });
  }

  @Security("bearerAuth")
  @Patch("{id}")
  public async update(
    @Path() id: number,
    @Body() body: UpdateJobDto,
    @Request() req: ExpressRequest
  ): Promise<any> {
    const user = req.user;

    if (!user || !["ADMIN", "COMPANY_ADMIN"].includes(user.role)) {
      this.setStatus(403);
      throw new Error("Acesso negado");
    }

    const job = await prisma.job.findUnique({ where: { id } });

    if (!job || job.deletedAt) {
      this.setStatus(404);
      throw new Error("Vaga não encontrada");
    }

    if (user.role === "COMPANY_ADMIN" && user.companyId !== job.companyId) {
      this.setStatus(403);
      throw new Error("Você só pode editar vagas da sua própria empresa");
    }

    return prisma.job.update({
      where: { id },
      data: body,
    });
  }

  @Security("bearerAuth")
  @Delete("{id}")
  public async delete(
    @Path() id: number,
    @Request() req: ExpressRequest
  ): Promise<void> {
    const user = req.user;

    if (!user || !["ADMIN", "COMPANY_ADMIN"].includes(user.role)) {
      this.setStatus(403);
      throw new Error("Acesso negado");
    }

    const job = await prisma.job.findUnique({ where: { id } });

    if (!job || job.deletedAt) {
      this.setStatus(404);
      throw new Error("Vaga não encontrada ou já excluída");
    }

    if (user.role === "COMPANY_ADMIN" && user.companyId !== job.companyId) {
      this.setStatus(403);
      throw new Error("Você só pode remover vagas da sua própria empresa");
    }

    await prisma.job.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.setStatus(204);
  }
}
