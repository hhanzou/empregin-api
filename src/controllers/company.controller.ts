import {
  Body,
  Controller,
  Delete,
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
import { Role } from "@prisma/client";
import { hasRole, throwError } from "@utils/index";

export type CreateCompanyDto = {
  name: string;
  cnpj: string;
};

export type UpdateCompanyDto = {
  name?: string;
  cnpj?: string;
};

// TODO: Adicionar validações
// TODO: modularizar endpoints para deixar o codigo mais limpo

@Route("companies")
@Tags("Company")
export class CompanyController extends Controller {
  /**
   * Retorna todas as empresas
   * @summary Listar empresas
   */
  @Security("bearerAuth")
  @Get()
  public async getAll(@Request() req: RequestWithUser): Promise<any[]> {
    const user = req.user;

    if (!user) {
      throwError(401, "Não autenticado");
    }

    return await prisma.company.findMany({
      where: { deletedAt: null },
      include: { users: false, jobs: false },
    });
  }

  /**
   * Retorna uma empresa pelo ID
   * @summary Obter empresa
   */
  @Security("bearerAuth")
  @Get("{id}")
  public async getById(@Path() id: number): Promise<any> {
    const company = await prisma.company.findUnique({
      where: { id },
      include: { users: true, jobs: true },
    });

    if (!company || company.deletedAt) {
      throwError(404, "Empresa não encontrada.");
    }

    return company;
  }

  /**
   * Cria uma nova empresa
   * @summary Criar empresa
   */
  @Security("bearerAuth")
  @Post()
  public async create(
    @Body() body: CreateCompanyDto,
    @Request() req: RequestWithUser
  ): Promise<any> {
    const user = req.user;

    if (!user || !hasRole(user, [Role.ADMIN, Role.COMPANY_ADMIN]))
      throwError(403, "Acesso negado");

    const isAdmin = user.role === Role.ADMIN;
    const isCompanyAdmin = user.role === Role.COMPANY_ADMIN;

    if (isCompanyAdmin && user.companyId)
      throwError(
        403,
        "Você já está vinculado a uma empresa e não pode criar outra"
      );

    const company = await prisma.company.create({
      data: body,
    });

    if (isCompanyAdmin) {
      await prisma.user.update({
        where: { id: user.userId },
        data: { companyId: company.id },
      });
    }

    return company;
  }

  /**
   * Atualiza uma empresa pelo id
   * @summary Atualizar empresa
   */
  @Security("bearerAuth")
  @Patch("{id}")
  public async update(
    @Path() id: number,
    @Body() body: UpdateCompanyDto,
    @Request() req: RequestWithUser
  ): Promise<any> {
    const user = req.user;

    if (!user || !hasRole(user, [Role.ADMIN, Role.COMPANY_ADMIN]))
      throwError(403, "Acesso negado");

    const company = await prisma.company.findFirst({
      where: { id, deletedAt: null },
    });

    if (!company) throwError(404, "Empresa não encontrada");

    const isAdmin = user.role === Role.ADMIN;
    const isCompanyAdmin =
      user.role === Role.COMPANY_ADMIN && user.companyId === id;

    if (!isAdmin && !isCompanyAdmin)
      throwError(403, "Você não tem permissão para editar esta empresa");

    const updated = await prisma.company.update({
      where: { id },
      data: body,
    });

    return updated;
  }

  /**
   * Deleta uma empresa
   * @summary Excluir empresa
   */
  @Security("bearerAuth")
  @Delete("{id}")
  public async delete(
    @Path() id: number,
    @Request() req: RequestWithUser
  ): Promise<void> {
    const user = req.user;

    if (!user) throwError(401, "Não autenticado");

    const company = await prisma.company.findFirst({
      where: { id, deletedAt: null },
    });

    if (!company) throwError(404, "Empresa não encontrada ou já excluída");

    const isAdmin = user.role === "ADMIN";
    const isCompanyAdmin =
      user.role === "COMPANY_ADMIN" && user.companyId === id;

    if (!isAdmin && !isCompanyAdmin)
      throwError(403, "Você não tem permissão para excluir esta empresa");

    await prisma.company.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.setStatus(204);
  }

  /**
   * Adiciona usuário a uma empresa
   * @summary Adicionar usuário a empresa
   */
  @Security("bearerAuth")
  @Patch("{companyId}/add-user/{userId}")
  public async addUserToCompany(
    @Path() companyId: number,
    @Path() userId: number,
    @Request() req: RequestWithUser
  ) {
    const user = req.user;

    if (!user || !hasRole(user, [Role.ADMIN, Role.COMPANY_ADMIN]))
      throwError(403, "Acesso negado");

    if (user.role === Role.COMPANY_ADMIN && user.companyId !== companyId)
      throwError(403, "Você só pode gerenciar usuários da sua empresa");

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });

    if (
      !targetUser ||
      !["COMPANY_ADMIN", "COMPANY_HR"].includes(targetUser.role)
    )
      throwError(400, "Só é permitido associar COMPANY_ADMIN ou COMPANY_HR");

    await prisma.user.update({
      where: { id: userId },
      data: { companyId },
    });

    this.setStatus(204);
  }

  /**
   * Remove usuário a uma empresa
   * @summary Remover usuário a empresa
   */
  @Security("bearerAuth")
  @Patch("{companyId}/remove-user/{userId}")
  public async removeUserFromCompany(
    @Path() companyId: number,
    @Path() userId: number,
    @Request() req: RequestWithUser
  ) {
    const requester = req.user;

    if (!requester || !["ADMIN", "COMPANY_ADMIN"].includes(requester.role))
      throwError(403, "Acesso negado");

    if (requester.role === "COMPANY_ADMIN" && requester.companyId !== companyId)
      throwError(403, "Você só pode remover usuários da sua empresa");

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });

    if (
      !targetUser ||
      !["COMPANY_ADMIN", "COMPANY_HR"].includes(targetUser.role)
    )
      throwError(400, "Só é permitido remover COMPANY_ADMIN ou COMPANY_HR");

    await prisma.user.update({
      where: { id: userId },
      data: { companyId: null },
    });

    this.setStatus(204);
  }
}
