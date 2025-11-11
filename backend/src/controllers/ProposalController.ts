import { Request, Response, NextFunction } from 'express';
import { ProposalService } from '../services/ProposalService';
import { AIServiceFactory } from '../services/AIServiceFactory';
import { logger } from '../config/logger';
import { ValidationError } from '../middleware/errorHandler';
import fs from 'fs/promises';

export class ProposalController {
  private proposalService: ProposalService;

  constructor() {
    this.proposalService = new ProposalService();
  }

  /**
   * POST /api/proposals/generate
   * Gera proposta completa a partir de documentos
   */
  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientName, projectName, description, aiProvider, aiModel, selectedProfessionals } = req.body;
      const files = req.files as Express.Multer.File[];

      // Validações
      if (!clientName || !projectName) {
        throw new ValidationError('clientName e projectName são obrigatórios');
      }

      if (!files || files.length === 0) {
        throw new ValidationError('Pelo menos um arquivo deve ser enviado');
      }

      // Validar profissionais selecionados
      if (!selectedProfessionals || selectedProfessionals.length === 0) {
        throw new ValidationError('Selecione pelo menos um profissional');
      }

      // Parse selectedProfessionals se vier como string
      const professionalIds = typeof selectedProfessionals === 'string'
        ? JSON.parse(selectedProfessionals)
        : selectedProfessionals;

      // Validar aiProvider se fornecido
      if (aiProvider && !AIServiceFactory.isValidProvider(aiProvider)) {
        throw new ValidationError(
          `aiProvider inválido. Use: ${AIServiceFactory.getAvailableProviders().join(', ')}`
        );
      }

      const selectedAI = aiProvider || 'claude';
      const selectedModel = aiModel;
      logger.info(`🎯 Gerando proposta para cliente: ${clientName} usando ${selectedAI.toUpperCase()}${selectedModel ? ` (${selectedModel})` : ''}`);
      logger.info(`👥 Profissionais selecionados: ${professionalIds.length}`);

      // Preparar arquivos para análise
      const fileData = files.map((file) => ({
        path: file.path,
        mimetype: file.mimetype,
      }));

      // Gerar proposta
      const proposal = await this.proposalService.generateProposal({
        clientName,
        projectName,
        description,
        files: fileData,
        aiProvider: selectedAI,
        aiModel: selectedModel,
        selectedProfessionals: professionalIds,
      });

      return res.status(201).json({
        status: 'success',
        message: 'Proposta gerada com sucesso',
        data: {
          id: proposal.id,
          clientName: proposal.clientName,
          projectName: proposal.projectName,
          totalCost: proposal.totalCost,
          totalPrice: proposal.totalPrice,
          duration: proposal.durationMonths,
          complexity: proposal.complexity,
          aiProvider: selectedAI,
          excelDownloadUrl: `/api/proposals/${proposal.id}/download`,
          createdAt: proposal.createdAt,
        },
      });
    } catch (error) {
      logger.error('Erro ao gerar proposta:', error);
      next(error);
    }
  }

  /**
   * GET /api/proposals
   * Lista propostas com filtros opcionais
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, clientName, limit, offset } = req.query;

      const result = await this.proposalService.listProposals({
        status: status as string,
        clientName: clientName as string,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
      });

      return res.status(200).json({
        status: 'success',
        data: {
          proposals: result.proposals,
          total: result.total,
          limit: limit ? parseInt(limit as string) : 50,
          offset: offset ? parseInt(offset as string) : 0,
        },
      });
    } catch (error) {
      logger.error('Erro ao listar propostas:', error);
      next(error);
    }
  }

  /**
   * GET /api/proposals/:id
   * Busca proposta por ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const proposal = await this.proposalService.getProposalById(id);

      if (!proposal) {
        return res.status(404).json({
          status: 'error',
          message: 'Proposta não encontrada',
        });
      }

      return res.status(200).json({
        status: 'success',
        data: proposal,
      });
    } catch (error) {
      logger.error('Erro ao buscar proposta:', error);
      next(error);
    }
  }

  /**
   * GET /api/proposals/:id/download
   * Download do Excel da proposta
   */
  async download(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const proposal = await this.proposalService.getProposalById(id);

      if (!proposal) {
        return res.status(404).json({
          status: 'error',
          message: 'Proposta não encontrada',
        });
      }

      if (!proposal.excelFilePath) {
        return res.status(404).json({
          status: 'error',
          message: 'Arquivo Excel não encontrado',
        });
      }

      // Verificar se arquivo existe
      try {
        await fs.access(proposal.excelFilePath);
      } catch {
        return res.status(404).json({
          status: 'error',
          message: 'Arquivo Excel não existe no servidor',
        });
      }

      // Enviar arquivo
      return res.download(proposal.excelFilePath);
    } catch (error) {
      logger.error('Erro ao fazer download da proposta:', error);
      next(error);
    }
  }

  /**
   * PUT /api/proposals/:id
   * Atualiza proposta em revisão
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const proposal = await this.proposalService.updateProposal(id, updates);

      return res.status(200).json({
        status: 'success',
        message: 'Proposta atualizada com sucesso',
        data: proposal,
      });
    } catch (error) {
      logger.error('Erro ao atualizar proposta:', error);
      next(error);
    }
  }

  /**
   * PUT /api/proposals/:id/resources
   * Atualiza alocações de recursos (horas por semana)
   */
  async updateResources(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { resources } = req.body;

      await this.proposalService.updateProposalResources(id, resources);

      return res.status(200).json({
        status: 'success',
        message: 'Recursos atualizados com sucesso',
      });
    } catch (error) {
      logger.error('Erro ao atualizar recursos:', error);
      next(error);
    }
  }

  /**
   * POST /api/proposals/:id/approve
   * Aprova proposta e gera Excel
   */
  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { rating, notes } = req.body;

      const proposal = await this.proposalService.approveProposal(id, {
        rating,
        notes,
      });

      return res.status(200).json({
        status: 'success',
        message: 'Proposta aprovada e Excel gerado com sucesso',
        data: {
          id: proposal.id,
          status: proposal.status,
          excelDownloadUrl: `/api/proposals/${proposal.id}/download`,
          wasModified: proposal.wasModified,
          accuracyRating: proposal.accuracyRating,
        },
      });
    } catch (error) {
      logger.error('Erro ao aprovar proposta:', error);
      next(error);
    }
  }

  /**
   * DELETE /api/proposals/:id
   * Deleta proposta
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const deleted = await this.proposalService.deleteProposal(id);

      if (!deleted) {
        return res.status(404).json({
          status: 'error',
          message: 'Proposta não encontrada',
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Proposta deletada com sucesso',
      });
    } catch (error) {
      logger.error('Erro ao deletar proposta:', error);
      next(error);
    }
  }

  /**
   * GET /api/proposals/ai-providers
   * Lista provedores de IA disponíveis
   */
  async getAIProviders(req: Request, res: Response, next: NextFunction) {
    try {
      const providers = AIServiceFactory.getAvailableProviders();
      const providersInfo = providers.map((provider) => ({
        id: provider,
        ...AIServiceFactory.getProviderInfo(provider),
      }));

      return res.status(200).json({
        status: 'success',
        data: {
          providers: providersInfo,
          default: 'claude',
        },
      });
    } catch (error) {
      logger.error('Erro ao listar provedores de IA:', error);
      next(error);
    }
  }
}
