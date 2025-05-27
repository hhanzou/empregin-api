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
  Security,
  Request,
} from "tsoa";
import { prisma } from "@lib/prisma";
import { AuthenticatedUser } from "interfaces/auth";

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
  @Get()
  public async getAll(): Promise<any[]> {
    return prisma.company.findMany({
      where: { deletedAt: null },
      include: { users: false, jobs: false },
    });
  }

  @Get("{id}")
  public async getById(@Path() id: number): Promise<any> {
    const company = await prisma.company.findUnique({
      where: { id },
      include: { users: true, jobs: true },
    });

    if (!company || company.deletedAt) {
      this.setStatus(404);
      throw new Error("Empresa não encontrada");
    }

    return company;
  }

  @Security("bearerAuth")
  @Post()
  public async create(
    @Body() body: CreateCompanyDto,
    @Request() req: Request
  ): Promise<any> {
    const user = (req as Request & { user?: AuthenticatedUser }).user;

    if (!user) {
      this.setStatus(401);
      throw new Error("Não autenticado");
    }

    const isAdmin = user.role === "ADMIN";
    const isCompanyAdmin = user.role === "COMPANY_ADMIN";

    if (!isAdmin && !isCompanyAdmin) {
      this.setStatus(403);
      throw new Error("Você não tem permissão para criar empresas");
    }

    if (isCompanyAdmin && user.companyId) {
      this.setStatus(403);
      throw new Error(
        "Você já está vinculado a uma empresa e não pode criar outra"
      );
    }

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

  @Security("bearerAuth")
  @Patch("{id}")
  public async update(
    @Path() id: number,
    @Body() body: UpdateCompanyDto,
    @Request() req: Request
  ): Promise<any> {
    const user = (req as Request & { user?: AuthenticatedUser }).user;

    if (!user) {
      this.setStatus(401);
      throw new Error("Não autenticado");
    }

    const company = await prisma.company.findFirst({
      where: { id, deletedAt: null },
    });

    if (!company) {
      this.setStatus(404);
      throw new Error("Empresa não encontrada ou já excluída");
    }

    const isAdmin = user.role === "ADMIN";
    const isCompanyAdmin =
      user.role === "COMPANY_ADMIN" && user.companyId === id;

    if (!isAdmin && !isCompanyAdmin) {
      this.setStatus(403);
      throw new Error("Você não tem permissão para editar esta empresa");
    }

    const updated = await prisma.company.update({
      where: { id },
      data: body,
    });

    return updated;
  }

  @Security("bearerAuth")
  @Delete("{id}")
  public async delete(
    @Path() id: number,
    @Request() req: Request
  ): Promise<void> {
    const user = (req as Request & { user?: AuthenticatedUser }).user;

    if (!user) {
      this.setStatus(401);
      throw new Error("Não autenticado");
    }

    const company = await prisma.company.findFirst({
      where: { id, deletedAt: null },
    });

    if (!company) {
      this.setStatus(404);
      throw new Error("Empresa não encontrada ou já excluída");
    }

    const isAdmin = user.role === "ADMIN";
    const isCompanyAdmin =
      user.role === "COMPANY_ADMIN" && user.companyId === id;

    if (!isAdmin && !isCompanyAdmin) {
      this.setStatus(403);
      throw new Error("Você não tem permissão para excluir esta empresa");
    }

    await prisma.company.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.setStatus(204); // No Content
  }

  @Security("bearerAuth")
  @Patch("{companyId}/add-user/{userId}")
  public async addUserToCompany(
    @Path() companyId: number,
    @Path() userId: number,
    @Request() req: Request
  ): Promise<string> {
    const requester = (req as Request & { user?: AuthenticatedUser }).user;

    if (!requester || !["ADMIN", "COMPANY_ADMIN"].includes(requester.role)) {
      this.setStatus(403);
      throw new Error("Acesso negado");
    }

    if (
      requester.role === "COMPANY_ADMIN" &&
      requester.companyId !== companyId
    ) {
      this.setStatus(403);
      throw new Error("Você só pode gerenciar usuários da sua empresa");
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });

    if (
      !targetUser ||
      !["COMPANY_ADMIN", "COMPANY_HR"].includes(targetUser.role)
    ) {
      this.setStatus(400);
      throw new Error("Só é permitido associar COMPANY_ADMIN ou COMPANY_HR");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { companyId },
    });

    return "Usuário associado à empresa com sucesso";
  }

  @Security("bearerAuth")
  @Patch("{companyId}/remove-user/{userId}")
  public async removeUserFromCompany(
    @Path() companyId: number,
    @Path() userId: number,
    @Request() req: Request
  ): Promise<string> {
    const requester = (req as Request & { user?: AuthenticatedUser }).user;

    if (!requester || !["ADMIN", "COMPANY_ADMIN"].includes(requester.role)) {
      this.setStatus(403);
      throw new Error("Acesso negado");
    }

    if (
      requester.role === "COMPANY_ADMIN" &&
      requester.companyId !== companyId
    ) {
      this.setStatus(403);
      throw new Error("Você só pode remover usuários da sua empresa");
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });

    if (
      !targetUser ||
      !["COMPANY_ADMIN", "COMPANY_HR"].includes(targetUser.role)
    ) {
      this.setStatus(400);
      throw new Error("Só é permitido remover COMPANY_ADMIN ou COMPANY_HR");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { companyId: null },
    });

    return "Usuário removido da empresa com sucesso";
  }
}
