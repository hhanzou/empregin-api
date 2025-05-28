import { Role } from "@prisma/client";
import { Controller } from "tsoa";

export function hasRole(user: { role: Role }, roles: Role[]) {
  return roles.includes(user.role);
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function throwError(status: number, message: string): never {
  throw new HttpError(status, message);
}
