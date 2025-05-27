import {
  Controller,
  Route,
  Tags,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Path,
  Security,
  Query,
  Request,
} from "tsoa";
import { prisma } from "@lib/prisma";
import { Prisma } from "@prisma/client";

// TODO: Implementar validações de entrada

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
  @Get()
  public async getAll(): Promise<any[]> {
    return prisma.user.findMany({
      where: { deletedAt: null },
    });
  }

  @Get("{id}")
  public async getOne(@Path() id: number): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user || user.deletedAt) {
      throw new Error("Usuário não encontrado");
    }
    return user;
  }

  @Post()
  public async createUser(
    @Request() req: any,
    @Body() body: CreateUserDto
  ): Promise<any> {
    const requester = req.user;

    if (!requester) {
      this.setStatus(401);
      throw new Error("Não autenticado");
    }

    const { role: requesterRole, companyId: requesterCompanyId } = requester;
    const { role: targetRole, companyId: targetCompanyId } = body;

    const validRoles = ["USER", "COMPANY_HR", "COMPANY_ADMIN", "ADMIN"];
    if (!targetRole || !validRoles.includes(targetRole)) {
      this.setStatus(400);
      throw new Error("Role inválida");
    }

    if (requesterRole === "ADMIN") {
    } else if (requesterRole === "COMPANY_ADMIN") {
      // COMPANY_ADMIN só pode criar COMPANY_HR da mesma empresa
      if (targetRole !== "COMPANY_HR") {
        this.setStatus(403);
        throw new Error(
          "COMPANY_ADMIN só pode criar usuários com role COMPANY_HR"
        );
      }

      if (!targetCompanyId || targetCompanyId !== requesterCompanyId) {
        this.setStatus(403);
        throw new Error(
          "COMPANY_ADMIN só pode criar usuários da sua própria empresa"
        );
      }
    } else {
      // Qualquer outro tipo não tem permissão
      this.setStatus(403);
      throw new Error("Você não tem permissão para criar usuários");
    }

    const user = await prisma.user.create({
      data: body as Prisma.UserCreateInput,
    });

    const { password, ...safeUser } = user;
    return safeUser;
  }

  @Patch("{id}")
  public async update(
    @Path() id: number,
    @Body() body: UpdateUserDto
  ): Promise<any> {
    const user = await prisma.user.update({
      where: { id },
      data: body as Prisma.UserUpdateInput,
    });
    const { password, ...safeUser } = user;
    return safeUser;
  }

  @Delete("{id}")
  public async delete(@Path() id: number): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
