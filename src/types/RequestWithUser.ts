// types/RequestWithUser.ts
import { Request } from "express";
import { AuthenticatedUser } from "interfaces/auth";

export type RequestWithUser = Request & { user?: AuthenticatedUser };
