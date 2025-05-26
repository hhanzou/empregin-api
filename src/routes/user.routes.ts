import { Router } from 'express';
import * as UserController from '@controllers/user.controller';

const router = Router();

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Lista todos os usuários
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/', UserController.listUsers);
router.post('/', UserController.createUser);
router.delete('/:id', UserController.softDeleteUser);

export default router;
