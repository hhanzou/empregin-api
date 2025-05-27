import { Controller, Route, Tags, Post, Body } from "tsoa";

import { login as loginService } from "@services/auth.service";

import { register as registerService } from "@services/auth.service";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  role?: string;
  companyId?: number;
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
  @Post("login")
  public async login(@Body() body: LoginInput): Promise<LoginResponse> {
    if (!body.email || !body.password) {
      this.setStatus(400);
      throw new Error("Email e senha são obrigatórios");
    }

    try {
      const result = await loginService(body.email, body.password);
      return result;
    } catch (err) {
      this.setStatus(401);
      throw new Error("Credenciais inválidas");
    }
  }

  @Post("register")
  public async register(
    @Body() body: RegisterInput
  ): Promise<RegisterResponse> {
    const { name, email, password } = body;

    if (!name || !email || !password) {
      this.setStatus(400);
      throw new Error("Nome, email e senha são obrigatórios");
    }

    const result = await registerService({
      name,
      email,
      password,
      role: "USER",
    });

    return result;
  }
}
