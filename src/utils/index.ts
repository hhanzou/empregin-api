import { AuthenticatedUser } from "interfaces/auth";

export const getUserFromRequest = (
  req: Request
): AuthenticatedUser | undefined =>
  (req as Request & { user?: AuthenticatedUser }).user;
