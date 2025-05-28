import {
  Body,
  Controller,
  Get,
  Patch,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";

import { RequestWithUser } from "@customTypes/RequestWithUser";
import { prisma } from "@lib/prisma";
import { JobStatus, Role } from "@prisma/client";
import { hasRole, throwError } from "@utils/index";

export type CreateJobDto = {
  title: string;
  description: string;
  companyId: number;
};

@Route("jobs")
@Tags("Job")
export class JobController extends Controller {
  /**
   * Retorna todas as vagas ativas
   * @summary Listar vagas
   */
  @Security("bearerAuth")
  @Get()
  public async getAll(): Promise<any[]> {
    return prisma.job.findMany({
      where: { deletedAt: null, status: JobStatus.OPEN },
      include: { company: true, applications: false },
    });
  }

  /**
   * Obter vaga pelo id
   * @summary Obter vaga
   */
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

    const { applications, ...safeResponse } = job;

    return {
      ...safeResponse,
      applicationsNum: applications.length,
    };
  }

  /**
   * Retorna vagas abertas da empresa
   * @summary Listar vagas abertas da empresa
   */
  @Security("bearerAuth")
  @Get("company/{id}")
  public async getCompanyOpenedJobs(
    @Path() id: number,
    @Request() req: RequestWithUser
  ): Promise<any> {
    const user = req.user;

    if (
      !user ||
      !hasRole(user, [Role.ADMIN, Role.COMPANY_ADMIN, Role.COMPANY_HR])
    )
      throwError(403, "Acesso negado");

    if (
      hasRole(user, [Role.COMPANY_ADMIN, Role.COMPANY_HR]) &&
      user.companyId !== id
    )
      throwError(403, "Acesso negado");

    const jobs = await prisma.job.findMany({
      where: { companyId: id, status: JobStatus.OPEN },
      include: { company: true, applications: true },
    });

    return jobs;
  }

  /**
   * Cria uma vaga nova para uma empresa
   * @summary Criar vaga
   */
  @Security("bearerAuth")
  @Post()
  public async create(
    @Body() body: CreateJobDto,
    @Request() req: RequestWithUser
  ): Promise<any> {
    const user = req.user;

    if (!user || !hasRole(user, [Role.ADMIN, Role.COMPANY_ADMIN]))
      throwError(403, "Acesso negado");

    if (user.role === Role.COMPANY_ADMIN && user.companyId !== body.companyId)
      throwError(403, "Você só pode criar vagas da sua própria empresa");

    await prisma.job.create({
      data: body,
    });

    this.setStatus(201);
  }

  /**
   * Fecha uma vaga de uma empresa
   * @summary Fechar vaga
   */
  @Security("bearerAuth")
  @Patch("{id}/close")
  public async closeJob(
    @Path() id: number,
    @Request() req: RequestWithUser
  ): Promise<void> {
    const user = req.user;

    if (!user || !hasRole(user, [Role.ADMIN, Role.COMPANY_ADMIN]))
      throwError(403, "Acesso negado");

    const job = await prisma.job.findUnique({ where: { id } });

    if (!job || job.deletedAt) {
      throwError(404, "Vaga não encontrada");
    }

    if (user.role === "COMPANY_ADMIN" && user.companyId !== job.companyId) {
      throwError(403, "Você só pode fechar vagas da sua própria empresa");
    }

    await prisma.job.update({
      where: { id },
      data: { status: JobStatus.CLOSED },
    });

    this.setStatus(204);
  }
}
