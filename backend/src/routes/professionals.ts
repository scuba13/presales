import { Router } from 'express';
import { ProfessionalController } from '../controllers/ProfessionalController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const professionalController = new ProfessionalController();

/**
 * @swagger
 * /api/professionals:
 *   get:
 *     tags: [Professionals]
 *     summary: Lista todos os profissionais
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filtrar por cargo
 *       - in: query
 *         name: seniority
 *         schema:
 *           type: string
 *           enum: [Junior, Pleno, Senior]
 *         description: Filtrar por senioridade
 *     responses:
 *       200:
 *         description: Lista de profissionais
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
 *                     professionals:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Professional'
 *                     total:
 *                       type: number
 *   post:
 *     tags: [Professionals]
 *     summary: Cria novo profissional
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, role, hourlyCost, seniority]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Backend Developer
 *               role:
 *                 type: string
 *                 example: Backend Dev
 *               hourlyCost:
 *                 type: number
 *                 example: 98.21
 *               seniority:
 *                 type: string
 *                 enum: [Junior, Pleno, Senior]
 *                 example: Pleno
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Node.js", "TypeScript", "PostgreSQL"]
 *     responses:
 *       201:
 *         description: Profissional criado
 *       400:
 *         description: Dados inválidos
 */
router.get('/', authMiddleware, professionalController.list.bind(professionalController));
router.post('/', authMiddleware, professionalController.create.bind(professionalController));

/**
 * @swagger
 * /api/professionals/{id}:
 *   get:
 *     tags: [Professionals]
 *     summary: Busca profissional por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Dados do profissional
 *       404:
 *         description: Profissional não encontrado
 *   put:
 *     tags: [Professionals]
 *     summary: Atualiza profissional
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *               hourlyCost:
 *                 type: number
 *               seniority:
 *                 type: string
 *                 enum: [Junior, Pleno, Senior]
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Profissional atualizado
 *       404:
 *         description: Profissional não encontrado
 *   delete:
 *     tags: [Professionals]
 *     summary: Deleta profissional
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Profissional deletado
 *       404:
 *         description: Profissional não encontrado
 */
router.get('/:id', authMiddleware, professionalController.getById.bind(professionalController));
router.put('/:id', authMiddleware, professionalController.update.bind(professionalController));
router.delete('/:id', authMiddleware, professionalController.delete.bind(professionalController));

export default router;
