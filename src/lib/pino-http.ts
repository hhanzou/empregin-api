import pinoHttp from "pino-http";
import { logger } from "./logger";
import { IncomingMessage } from "http";
import { AuthenticatedUser } from "interfaces/auth";

interface CustomRequest extends IncomingMessage {
  user?: AuthenticatedUser;
}

export function isAuthenticatedRequest(req: any): req is CustomRequest {
  return "user" in req && typeof req.user === "object";
}

export const httpLogger = pinoHttp({
  logger,
  customProps: (req) => {
    if (isAuthenticatedRequest(req)) {
      return {
        userId: req.user?.userId,
        role: req.user?.role,
        companyId: req.user?.companyId,
      };
    }

    return {};
  },
});
