import { Role } from "@prisma/client";
import { Controller } from "tsoa";

export function hasRole(user: { role: Role }, roles: Role[]) {
  return roles.includes(user.role);
}

export function throwError(
  controller: Controller,
  status: number,
  message = "Erro inesperado"
): never {
  controller.setStatus(status);
  throw new Error(message);
}
