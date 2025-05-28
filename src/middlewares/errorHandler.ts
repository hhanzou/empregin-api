import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const status = err.status ?? 500;

  const errorMessage = err instanceof Error ? err.message : "Erro inesperado";
  const errorStack =
    process.env.NODE_ENV === "production"
      ? undefined
      : err instanceof Error
      ? err.stack
      : undefined;

  res.status(status).json({
    success: false,
    message: errorMessage,
    stack: errorStack,
  });
}
