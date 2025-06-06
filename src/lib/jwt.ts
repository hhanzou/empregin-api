import { AuthenticatedUser } from "interfaces/auth";
import jwt, { SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export function generateToken(
  payload: string | object | Buffer,
  expiresIn: SignOptions["expiresIn"] = "1h"
): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string): AuthenticatedUser {
  return jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
}
