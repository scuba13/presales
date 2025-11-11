import { Router } from 'express';
import { ParameterController } from '../controllers/ParameterController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const parameterController = new ParameterController();

/**
 * @swagger
 * /api/parameters:
 *   get:
 *     tags: [Parameters]
 *     summary: Lista todos os parâmetros
 *     description: Retorna tax, SG&A e margin com valores e percentuais
 *     responses:
 *       200:
 *         description: Lista de parâmetros
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     parameters:
 *                       type: object
 *                     raw:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Parameter'
 *   post:
 *     tags: [Parameters]
 *     summary: Cria novo parâmetro
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, value, type]
 *             properties:
 *               name:
 *                 type: string
 *                 example: margin
 *               value:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 example: 0.25
 *                 description: Valor decimal entre 0 e 1
 *               type:
 *                 type: string
 *                 example: percentage
 *     responses:
 *       201:
 *         description: Parâmetro criado
 *       400:
 *         description: Parâmetro já existe ou dados inválidos
 */
router.get('/', authMiddleware, parameterController.list.bind(parameterController));
router.post('/', authMiddleware, parameterController.create.bind(parameterController));

/**
 * @swagger
 * /api/parameters/{name}:
 *   get:
 *     tags: [Parameters]
 *     summary: Busca parâmetro por nome
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *           enum: [tax, sga, margin]
 *         description: Nome do parâmetro
 *     responses:
 *       200:
 *         description: Dados do parâmetro
 *       404:
 *         description: Parâmetro não encontrado
 *   put:
 *     tags: [Parameters]
 *     summary: Atualiza valor de um parâmetro
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *           enum: [tax, sga, margin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [value]
 *             properties:
 *               value:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 example: 0.30
 *                 description: Valor decimal entre 0 e 1 (ex 0.30 = 30%)
 *     responses:
 *       200:
 *         description: Parâmetro atualizado
 *       400:
 *         description: Valor inválido
 *       404:
 *         description: Parâmetro não encontrado
 */
router.get('/:name', authMiddleware, parameterController.getByName.bind(parameterController));
router.put('/:name', authMiddleware, parameterController.update.bind(parameterController));

export default router;
