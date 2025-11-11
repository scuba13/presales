import { Router } from 'express';
import { DocumentController } from '../controllers/DocumentController';
import { upload } from '../config/multer';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const documentController = new DocumentController();

/**
 * @swagger
 * /api/documents/upload:
 *   post:
 *     tags: [Documents]
 *     summary: Upload de múltiplos documentos
 *     description: Faz upload de até 10 arquivos (PDF, DOC, TXT, MD)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Máximo 10 arquivos
 *     responses:
 *       200:
 *         description: Arquivos enviados com sucesso
 *       400:
 *         description: Erro no upload
 */
router.post(
  '/upload',
  authMiddleware,
  upload.array('files', 10),
  documentController.upload.bind(documentController)
);

/**
 * @swagger
 * /api/documents:
 *   get:
 *     tags: [Documents]
 *     summary: Lista arquivos uploadados
 *     responses:
 *       200:
 *         description: Lista de arquivos
 */
router.get('/', authMiddleware, documentController.list.bind(documentController));

/**
 * @swagger
 * /api/documents/{filename}:
 *   delete:
 *     tags: [Documents]
 *     summary: Deleta arquivo
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Arquivo deletado
 *       404:
 *         description: Arquivo não encontrado
 */
router.delete('/:filename', authMiddleware, documentController.delete.bind(documentController));

export default router;
