import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import fs from 'fs/promises';

export class DocumentController {
  /**
   * Upload de múltiplos documentos
   * POST /api/documents/upload
   */
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      // Multer já processou os arquivos e estão em req.files
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Nenhum arquivo foi enviado',
        });
      }

      logger.info(`Recebidos ${files.length} arquivo(s) para upload`);

      // Processar informações dos arquivos
      const uploadedFiles = files.map((file) => ({
        id: file.filename,
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date().toISOString(),
      }));

      return res.status(200).json({
        status: 'success',
        message: `${files.length} arquivo(s) enviado(s) com sucesso`,
        data: {
          files: uploadedFiles,
          count: files.length,
        },
      });
    } catch (error) {
      logger.error('Erro ao fazer upload de arquivos:', error);
      next(error);
    }
  }

  /**
   * Deletar arquivo
   * DELETE /api/documents/:filename
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { filename } = req.params;
      const filePath = `uploads/${filename}`;

      // Verificar se arquivo existe
      try {
        await fs.access(filePath);
      } catch {
        return res.status(404).json({
          status: 'error',
          message: 'Arquivo não encontrado',
        });
      }

      // Deletar arquivo
      await fs.unlink(filePath);
      logger.info(`Arquivo deletado: ${filename}`);

      return res.status(200).json({
        status: 'success',
        message: 'Arquivo deletado com sucesso',
      });
    } catch (error) {
      logger.error('Erro ao deletar arquivo:', error);
      next(error);
    }
  }

  /**
   * Listar arquivos uploadados
   * GET /api/documents
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const files = await fs.readdir('uploads/');

      const fileDetails = await Promise.all(
        files.map(async (filename) => {
          const stats = await fs.stat(`uploads/${filename}`);
          return {
            filename,
            size: stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
          };
        })
      );

      return res.status(200).json({
        status: 'success',
        data: {
          files: fileDetails,
          count: fileDetails.length,
        },
      });
    } catch (error) {
      logger.error('Erro ao listar arquivos:', error);
      next(error);
    }
  }
}
