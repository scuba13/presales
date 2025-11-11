import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware, authorize } from '../middleware/auth';

const router = Router();
const userController = new UserController();

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Lista todos os usuários (apenas admin)
 *     description: Retorna lista completa de usuários do sistema. Requer permissão de administrador.
 *     responses:
 *       200:
 *         description: Lista de usuários
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     total:
 *                       type: number
 *                       example: 10
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Acesso negado (não é admin)
 */
router.get('/', authMiddleware, authorize('admin'), userController.list.bind(userController));

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Busca usuário por ID (apenas admin)
 *     description: Retorna dados de um usuário específico. Requer permissão de administrador.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Dados do usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: Usuário não encontrado
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Acesso negado (não é admin)
 *   put:
 *     tags: [Users]
 *     summary: Atualiza usuário (apenas admin)
 *     description: Atualiza dados de um usuário. Requer permissão de administrador.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: João Silva
 *               email:
 *                 type: string
 *                 format: email
 *                 example: joao@example.com
 *               role:
 *                 type: string
 *                 enum: [admin, user]
 *                 example: user
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Usuário atualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Usuário atualizado com sucesso
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Usuário não encontrado
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Acesso negado (não é admin)
 *   delete:
 *     tags: [Users]
 *     summary: Deleta usuário (apenas admin)
 *     description: Remove um usuário do sistema. Requer permissão de administrador.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário deletado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Usuário deletado com sucesso
 *       404:
 *         description: Usuário não encontrado
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Acesso negado (não é admin)
 */
router.get('/:id', authMiddleware, authorize('admin'), userController.getById.bind(userController));
router.put('/:id', authMiddleware, authorize('admin'), userController.update.bind(userController));
router.delete('/:id', authMiddleware, authorize('admin'), userController.delete.bind(userController));

export default router;
