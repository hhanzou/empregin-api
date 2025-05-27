import { RequestWithUser } from "@customTypes/RequestWithUser";
import { verifyToken } from "@lib/jwt";
import { AuthenticatedUser } from "interfaces/auth";

export async function expressAuthentication(
  request: RequestWithUser,
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

    request.user = decoded;

    return decoded;
  } catch (err) {
    throw new Error("Token inválido ou expirado");
  }
}
