import { Request } from "express";
import { verifyToken } from "@lib/jwt"; // ajuste conforme o seu caminho
import { AuthenticatedUser } from "interfaces/auth";

/**
 * Esta função será chamada automaticamente pelo TSOA
 * sempre que um endpoint tiver `@Security('bearerAuth')`.
 */
export async function expressAuthentication(
  request: Request,
  securityName: string,
  scopes?: string[]
): Promise<AuthenticatedUser> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Token não fornecido ou inválido");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);
    return decoded;
  } catch (err) {
    throw new Error("Token inválido ou expirado");
  }
}
