import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  const errorMessage = err instanceof Error ? err.message : "Erro inesperado";
  const errorStack =
    process.env.NODE_ENV === "production"
      ? undefined
      : err instanceof Error
      ? err.stack
      : undefined;

  res.status(statusCode).json({
    success: false,
    message: errorMessage,
    stack: errorStack,
  });
}
