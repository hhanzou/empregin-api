import dotenv from "dotenv";
import express from "express";
import swaggerUi from "swagger-ui-express";

import { httpLogger } from "@lib/pino-http";
import { errorHandler } from "@middlewares/errorHandler";
import { RegisterRoutes } from "@routes/routes";

import * as swaggerDocument from "./docs/swagger.json";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(httpLogger);

RegisterRoutes(app);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(
    `🚀 Server running on http://localhost:${PORT} - Swagger: http://localhost:${PORT}/docs`
  )
);
