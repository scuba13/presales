import { Router } from 'express';
import { ProposalController } from '../controllers/ProposalController';
import { upload } from '../config/multer';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const proposalController = new ProposalController();

/**
 * @swagger
 * /api/proposals/ai-providers:
 *   get:
 *     tags: [Proposals]
 *     summary: Lista provedores de IA disponíveis
 *     description: Retorna lista de IAs disponíveis para geração de propostas
 *     security: []
 *     responses:
 *       200:
 *         description: Lista de provedores
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
 *                     providers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           id:
 *                             type: string
 */
router.get('/ai-providers', proposalController.getAIProviders.bind(proposalController));

/**
 * @swagger
 * /api/proposals/generate:
 *   post:
 *     tags: [Proposals]
 *     summary: Gera proposta completa com IA
 *     description: Upload de documentos, análise com IA, cálculo de custos e geração de Excel
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [clientName, projectName, aiProvider]
 *             properties:
 *               clientName:
 *                 type: string
 *                 example: Acme Corp
 *               projectName:
 *                 type: string
 *                 example: Sistema de CRM
 *               description:
 *                 type: string
 *                 example: Descrição do projeto
 *               aiProvider:
 *                 type: string
 *                 enum: [claude, openai]
 *                 default: claude
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Arquivos (PDF, DOC, TXT, MD) - máximo 10
 *     responses:
 *       201:
 *         description: Proposta gerada com sucesso
 *       400:
 *         description: Dados inválidos ou erro na geração
 */
router.post(
  '/generate',
  authMiddleware,
  upload.array('files', 10),
  proposalController.generate.bind(proposalController)
);

/**
 * @swagger
 * /api/proposals:
 *   get:
 *     tags: [Proposals]
 *     summary: Lista todas as propostas
 *     parameters:
 *       - in: query
 *         name: clientName
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending, approved, rejected]
 *     responses:
 *       200:
 *         description: Lista de propostas
 */
router.get('/', authMiddleware, proposalController.list.bind(proposalController));

/**
 * @swagger
 * /api/proposals/{id}:
 *   put:
 *     tags: [Proposals]
 *     summary: Atualiza proposta em revisão
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               durationMonths:
 *                 type: number
 *               totalCost:
 *                 type: number
 *               totalPrice:
 *                 type: number
 *               description:
 *                 type: string
 *               claudeAnalysis:
 *                 type: object
 *     responses:
 *       200:
 *         description: Proposta atualizada
 *       400:
 *         description: Proposta já aprovada não pode ser editada
 */
router.put('/:id', authMiddleware, proposalController.update.bind(proposalController));

/**
 * @swagger
 * /api/proposals/{id}/resources:
 *   put:
 *     tags: [Proposals]
 *     summary: Atualiza alocações de recursos (horas por semana)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resources:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     resourceId:
 *                       type: string
 *                     hoursPerWeek:
 *                       type: array
 *                       items:
 *                         type: number
 *     responses:
 *       200:
 *         description: Recursos atualizados
 */
router.put('/:id/resources', authMiddleware, proposalController.updateResources.bind(proposalController));

/**
 * @swagger
 * /api/proposals/{id}/approve:
 *   post:
 *     tags: [Proposals]
 *     summary: Aprova proposta e gera Excel
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
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating de 1-5 estrelas
 *               notes:
 *                 type: string
 *                 description: Feedback sobre a previsão da IA
 *     responses:
 *       200:
 *         description: Proposta aprovada e Excel gerado
 */
router.post('/:id/approve', authMiddleware, proposalController.approve.bind(proposalController));

/**
 * @swagger
 * /api/proposals/{id}:
 *   get:
 *     tags: [Proposals]
 *     summary: Busca proposta por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Dados da proposta
 *       404:
 *         description: Proposta não encontrada
 *   delete:
 *     tags: [Proposals]
 *     summary: Deleta proposta
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Proposta deletada
 */
router.get('/:id', authMiddleware, proposalController.getById.bind(proposalController));
router.delete('/:id', authMiddleware, proposalController.delete.bind(proposalController));

/**
 * @swagger
 * /api/proposals/{id}/download:
 *   get:
 *     tags: [Proposals]
 *     summary: Download do Excel da proposta
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Arquivo Excel
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Proposta ou arquivo não encontrado
 */
router.get('/:id/download', authMiddleware, proposalController.download.bind(proposalController));

export default router;
