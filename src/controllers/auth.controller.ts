import { Body, Controller, Post, Route, Tags } from "tsoa";

import { login as loginService } from "@services/auth.service";

import { register as registerService } from "@services/auth.service";
import { throwError } from "@utils/index";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

type RegisterResponse = {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    companyId?: number | null;
  };
};

type LoginInput = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    companyId?: number | null;
  };
};

@Route("auth")
@Tags("Auth")
export class AuthController extends Controller {
  /**
   * Faz o login do usuário
   * @summary Login
   */
  @Post("login")
  public async login(@Body() body: LoginInput): Promise<LoginResponse> {
    if (!body.email || !body.password) {
      throwError(400, "Email e senha são obrigatórios");
    }

    try {
      const result = await loginService(body.email, body.password);
      return result;
    } catch (err) {
      throwError(400, "Credenciais inválidas");
    }
  }

  /**
   * Registra um novo usuário padrão
   * @summary Registrar
   */
  @Post("register")
  public async register(
    @Body() body: RegisterInput
  ): Promise<RegisterResponse> {
    const { name, email, password } = body;

    if (!name || !email || !password) {
      throwError(400, "Nome, email e senha são obrigatórios");
    }

    const result = await registerService({
      name,
      email,
      password,
    });

    return result;
  }
}
