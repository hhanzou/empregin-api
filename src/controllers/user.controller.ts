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
import { Prisma, Role } from "@prisma/client";
import { throwError } from "@utils/index";

interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role?: string;
  companyId?: number;
}

interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  companyId?: number;
}

@Route("users")
@Tags("Users")
@Security("bearerAuth")
export class UserController extends Controller {
  /**
   * Retorna todos os usuários
   * @summary Listar usuários
   */
  @Security("bearerAuth")
  @Get()
  public async getAll(): Promise<any[]> {
    return prisma.user.findMany({
      where: { deletedAt: null },
      include: { applications: false },
    });
  }

  /**
   * Retorna um usuário pelo id
   * @summary Obter usuário
   */
  @Security("bearerAuth")
  @Get("{id}")
  public async getById(
    @Path() id: number,
    @Request() req: RequestWithUser
  ): Promise<any> {
    const user = req.user;

    if (!user) {
      throwError(403, "Não autenticado");
    }

    const shouldShowApplications = user.role == Role.ADMIN || user.userId == id;

    const result = await prisma.user.findUnique({
      where: { id },
      include: { applications: shouldShowApplications },
    });

    if (!result || result.deletedAt) throwError(404, "Usuário não encontrado.");

    return result;
  }

  /**
   * Cria um novo usuário (podendo ser de qualquer role ["USER", "COMPANY_HR", "COMPANY_ADMIN", "ADMIN"])
   * @summary Criar usuário
   */
  @Security("bearerAuth")
  @Post()
  public async createUser(
    @Request() req: RequestWithUser,
    @Body() body: CreateUserDto
  ): Promise<any> {
    const user = req.user;

    if (!user) {
      throwError(403, "Não autenticado");
    }

    const { role: targetRole, companyId: targetCompanyId } = body;

    const validRoles = ["USER", "COMPANY_HR", "COMPANY_ADMIN", "ADMIN"];
    if (!targetRole || !validRoles.includes(targetRole)) {
      throwError(400, "Role inválida");
    }

    if (user.role === Role.COMPANY_ADMIN) {
      if (targetRole !== "COMPANY_HR" && targetRole !== "COMPANY_ADMIN")
        throwError(
          403,
          "COMPANY_ADMIN só pode criar usuários com role COMPANY_HR ou COMPANY_ADMIN"
        );

      if (!targetCompanyId || targetCompanyId !== user.companyId)
        throwError(
          403,
          "COMPANY_ADMIN só pode criar usuários da sua própria empresa"
        );
    } else {
      throwError(403, "Você não tem permissão para criar usuários");
    }

    const newUser = await prisma.user.create({
      data: body as Prisma.UserCreateInput,
    });

    this.setStatus(201);
  }

  /**
   * Atualizar informações de um usuário
   * @summary Atualizar usuário
   */
  @Security("bearerAuth")
  @Patch("{id}")
  public async update(
    @Path() id: number,
    @Body() body: UpdateUserDto,
    @Request() req: RequestWithUser
  ): Promise<any> {
    const user = req.user;

    if (!user) {
      throwError(403, "Não autenticado");
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });

    if (!targetUser) {
      throwError(404, "Usuário não encontrado");
    }

    const isSelf = user.userId === id;
    const isSameCompany = user.companyId === targetUser.companyId;

    const isCompanyAdmin = user.role === Role.COMPANY_ADMIN;
    const isCompanyHR = user.role === Role.COMPANY_HR;
    const isBasicUser = user.role === Role.USER;

    if (!isSelf) {
      if (isBasicUser || isCompanyHR) {
        throwError(403, "Acesso negado");
      }

      if (isCompanyAdmin && !isSameCompany) {
        throwError(403, "Você só pode editar usuários da sua empresa");
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: body as Prisma.UserUpdateInput,
    });

    this.setStatus(204);
  }

  /**
   * Excluí um usuário
   * @summary Excluir usuário
   */
  @Security("bearerAuth")
  @Delete("{id}")
  public async delete(
    @Path() id: number,
    @Request() req: RequestWithUser
  ): Promise<void> {
    const user = req.user;

    if (!user) {
      throwError(403, "Não autenticado");
    }

    if (user.userId === id) {
      throwError(403, "Você não pode deletar a si mesmo");
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });

    if (!targetUser || targetUser.deletedAt) {
      throwError(404, "Usuário não encontrado ou já removido");
    }

    const isSameCompany = user.companyId === targetUser.companyId;

    if (user.role === Role.USER || user.role === Role.COMPANY_HR) {
      throwError(403, "Acesso negado");
    }

    if (user.role === Role.COMPANY_ADMIN && !isSameCompany) {
      throwError(403, "Você só pode deletar usuários da sua empresa");
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.setStatus(204);
  }
}
