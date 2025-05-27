import dotenv from "dotenv";
import express from "express";
import swaggerUi from "swagger-ui-express";
import * as swaggerDocument from "./docs/swagger.json";

import { RegisterRoutes } from "@routes/routes";
import { errorHandler } from "@middlewares/errorHandler";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

RegisterRoutes(app);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(
    `🚀 Server running on http://localhost:${PORT} - Swagger: http://localhost:${PORT}/docs`
  )
);
