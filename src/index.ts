import dotenv from 'dotenv';
import express from 'express';

import { swaggerDocs, swaggerUiSetup } from '@lib/swagger';

import authRoutes from '@routes/auth.routes';
import userRoutes from '@routes/user.routes';


dotenv.config();

const app = express();
app.use(express.json());

// Swagger
app.use('/api-docs', swaggerDocs, swaggerUiSetup);

app.use('/users', userRoutes);
app.use('/auth', authRoutes);


app.listen(3000, () => console.log('Server running on http://localhost:3000 - http://localhost:3000/api-docs'));
