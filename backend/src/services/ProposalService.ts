import { AppDataSource } from '../config/database';
import { Proposal } from '../entities/Proposal';
import { ProposalResource } from '../entities/ProposalResource';
import { Professional } from '../entities/Professional';
import { Parameter } from '../entities/Parameter';
import { AIServiceFactory, AIProvider } from './AIServiceFactory';
import { ExcelService } from './ExcelService';
import { LearningService } from './LearningService';
import { calculateFullCostAndPrice, calculateTotalHours } from '../utils/calculations';
import { logger } from '../config/logger';

interface GenerateProposalInput {
  clientName: string;
  projectName: string;
  description?: string;
  files: { path: string; mimetype: string }[];
  aiProvider?: AIProvider; // 'claude' ou 'openai'
  aiModel?: string; // Modelo específico da IA
}

export class ProposalService {
  private excelService: ExcelService;

  constructor() {
    this.excelService = new ExcelService();
  }

  /**
   * Gera proposta completa: Análise → Cálculo → Excel → Salvar DB
   */
  async generateProposal(input: GenerateProposalInput): Promise<Proposal> {
    try {
      // Definir provedor de IA (padrão: claude)
      const aiProvider = input.aiProvider || 'claude';
      const aiModel = input.aiModel;
      logger.info(`🚀 Iniciando geração de proposta completa com ${aiProvider.toUpperCase()}${aiModel ? ` (${aiModel})` : ''}`);

      // 1. Obter serviço de IA apropriado
      const aiService = AIServiceFactory.getService(aiProvider, aiModel);
      const providerInfo = AIServiceFactory.getProviderInfo(aiProvider);
      const modelName = aiModel || providerInfo.model;
      logger.info(`📄 Analisando documentos com ${providerInfo.name} (${modelName})...`);

      const analysis = await aiService.analyzeComplete(input.files);

      // 2. Buscar profissionais e parâmetros do banco
      const professionalRepo = AppDataSource.getRepository(Professional);
      const parameterRepo = AppDataSource.getRepository(Parameter);

      const professionals = await professionalRepo.find();
      const parameters = await parameterRepo.find();

      // Converter parâmetros para objeto (forçar conversão para number)
      const params = {
        tax: Number(parameters.find((p) => p.name === 'tax')?.value) || 0.21,
        sga: Number(parameters.find((p) => p.name === 'sga')?.value) || 0.10,
        margin: Number(parameters.find((p) => p.name === 'margin')?.value) || 0.25,
      };

      logger.info(`📊 Parâmetros: tax=${params.tax}, sga=${params.sga}, margin=${params.margin}`);

      logger.info('💰 Calculando custos e preços...');

      // 3. Mapear roles da análise para profissionais do banco
      const resourceCalculations = [];
      let totalCost = 0;
      let totalPrice = 0;

      for (const allocation of analysis.teamEstimation.monthlyAllocation) {
        // Encontrar profissional correspondente (com fuzzy matching)
        let professional = professionals.find(
          (p) => p.role.toLowerCase() === allocation.role.toLowerCase()
        );

        // Se não encontrou match exato, tentar match parcial
        if (!professional) {
          // Mapeamento de roles comuns
          const roleMap: Record<string, string[]> = {
            'backend': ['backend developer', 'desenvolvedor backend', 'backend dev'],
            'frontend': ['frontend developer', 'desenvolvedor frontend', 'frontend dev'],
            'qa': ['qa engineer', 'qa tester', 'analista de testes', 'quality assurance'],
            'devops': ['devops engineer', 'devops', 'sre'],
            'designer': ['ux designer', 'ui designer', 'ux/ui designer', 'product designer'],
            'architect': ['arquiteto', 'architect', 'arquiteto de software'],
            'tech lead': ['tech lead', 'technical lead', 'líder técnico'],
            'product owner': ['product owner', 'po', 'gerente de produto']
          };

          // Normalizar role da IA
          const normalizedAIRole = allocation.role.toLowerCase().trim();

          // Tentar encontrar match por palavras-chave
          for (const [keyword, variants] of Object.entries(roleMap)) {
            if (variants.some(v => normalizedAIRole.includes(v))) {
              professional = professionals.find(p =>
                variants.some(v => p.role.toLowerCase().includes(keyword))
              );
              if (professional) {
                logger.info(`✅ Match encontrado: "${allocation.role}" → "${professional.role}"`);
                break;
              }
            }
          }
        }

        if (!professional) {
          logger.warn(`⚠️  Profissional não encontrado para role: ${allocation.role}`);
          logger.warn(`    Roles disponíveis: ${professionals.map(p => p.role).join(', ')}`);
          continue;
        }

        // Calcular total de horas
        const totalHours = calculateTotalHours(allocation.hoursPerMonth);

        // Debug logging
        logger.info(`🔍 DEBUG - Profissional: ${professional.name} (${professional.role})`);
        logger.info(`🔍 DEBUG - hourlyCost: ${professional.hourlyCost} (tipo: ${typeof professional.hourlyCost})`);
        logger.info(`🔍 DEBUG - totalHours: ${totalHours}`);
        logger.info(`🔍 DEBUG - hoursPerMonth: ${JSON.stringify(allocation.hoursPerMonth)}`);

        // Calcular custo e preço
        const calculation = calculateFullCostAndPrice({
          totalHours,
          hourlyCost: Number(professional.hourlyCost),
          taxRate: params.tax,
          sgaRate: params.sga,
          marginRate: params.margin,
        });

        logger.info(`🔍 DEBUG - calculation result: ${JSON.stringify(calculation)}`);

        resourceCalculations.push({
          professional,
          hoursPerMonth: allocation.hoursPerMonth,
          totalHours,
          cost: calculation.finalCost,
          price: calculation.finalPrice,
        });

        totalCost += calculation.finalCost;
        totalPrice += calculation.finalPrice;
      }

      logger.info(`📊 Custos calculados - Total: ${totalCost.toFixed(2)} | Preço: ${totalPrice.toFixed(2)}`);

      // 4. Excel será gerado APENAS após aprovação
      // (não gerar aqui para permitir revisão/edição)

      // 5. Salvar proposta no banco
      logger.info('💾 Salvando proposta no banco de dados...');
      const proposalRepo = AppDataSource.getRepository(Proposal);
      const resourceRepo = AppDataSource.getRepository(ProposalResource);

      const proposal = proposalRepo.create({
        clientName: input.clientName,
        projectName: input.projectName,
        description: input.description || analysis.analysis.scope,
        status: 'generated',
        totalCost,
        totalPrice,
        durationMonths: analysis.teamEstimation.projectDuration,
        // originalAIAnalysis: salvar análise ORIGINAL (imutável)
        originalAIAnalysis: {
          ...analysis,
          aiProvider: aiProvider,
          providerInfo: providerInfo,
        },
        // claudeAnalysis: salvar análise ATUAL (pode ser editada)
        claudeAnalysis: {
          ...analysis,
          aiProvider: aiProvider,
          providerInfo: providerInfo,
        },
        complexity: analysis.analysis.complexity,
        // excelFilePath será adicionado apenas após aprovação
      });

      await proposalRepo.save(proposal);

      // Salvar recursos da proposta
      for (const resource of resourceCalculations) {
        // Converter meses para semanas
        const hoursPerWeek: number[] = [];
        resource.hoursPerMonth.forEach(monthHours => {
          const weeklyHours = monthHours / 4;
          hoursPerWeek.push(weeklyHours, weeklyHours, weeklyHours, weeklyHours);
        });

        const proposalResource = resourceRepo.create({
          proposalId: proposal.id,
          professionalId: resource.professional.id,
          hoursPerMonth: resource.hoursPerMonth,
          hoursPerWeek: hoursPerWeek,
          totalHours: resource.totalHours,
          cost: resource.cost,
          price: resource.price,
        });
        await resourceRepo.save(proposalResource);
      }

      logger.info(`✅ Proposta gerada com sucesso! ID: ${proposal.id}`);

      return proposal;
    } catch (error) {
      logger.error('❌ Erro ao gerar proposta:', error);
      throw error;
    }
  }

  /**
   * Busca proposta por ID
   */
  async getProposalById(id: string): Promise<Proposal | null> {
    const proposalRepo = AppDataSource.getRepository(Proposal);
    return proposalRepo.findOne({
      where: { id },
      relations: ['resources', 'resources.professional'],
    });
  }

  /**
   * Atualiza alocações de recursos (horas por semana)
   */
  async updateProposalResources(
    proposalId: string,
    resources: Array<{ resourceId: string; hoursPerWeek: number[] }>
  ): Promise<void> {
    const resourceRepo = AppDataSource.getRepository(ProposalResource);

    for (const res of resources) {
      const resource = await resourceRepo.findOne({ where: { id: res.resourceId } });
      if (!resource) {
        logger.warn(`Recurso não encontrado: ${res.resourceId}`);
        continue;
      }

      // Converter semanas para meses (para manter compatibilidade)
      const hoursPerMonth: number[] = [];
      for (let i = 0; i < res.hoursPerWeek.length; i += 4) {
        const monthTotal = res.hoursPerWeek.slice(i, i + 4).reduce((sum, h) => sum + h, 0);
        hoursPerMonth.push(monthTotal);
      }

      // Atualizar
      resource.hoursPerWeek = res.hoursPerWeek;
      resource.hoursPerMonth = hoursPerMonth;
      resource.totalHours = res.hoursPerWeek.reduce((sum, h) => sum + h, 0);

      await resourceRepo.save(resource);
    }

    logger.info(`Recursos atualizados para proposta ${proposalId}`);
  }

  /**
   * Lista todas as propostas
   */
  async listProposals(filters?: {
    status?: string;
    clientName?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ proposals: Proposal[]; total: number }> {
    const proposalRepo = AppDataSource.getRepository(Proposal);

    const query = proposalRepo.createQueryBuilder('proposal');

    if (filters?.status) {
      query.andWhere('proposal.status = :status', { status: filters.status });
    }

    if (filters?.clientName) {
      query.andWhere('proposal.clientName ILIKE :clientName', {
        clientName: `%${filters.clientName}%`,
      });
    }

    query.orderBy('proposal.createdAt', 'DESC');

    if (filters?.limit) {
      query.take(filters.limit);
    }

    if (filters?.offset) {
      query.skip(filters.offset);
    }

    const [proposals, total] = await query.getManyAndCount();

    return { proposals, total };
  }

  /**
   * Atualiza proposta em revisão
   */
  async updateProposal(
    id: string,
    updates: {
      durationMonths?: number;
      totalCost?: number;
      totalPrice?: number;
      description?: string;
      claudeAnalysis?: object;
    }
  ): Promise<Proposal> {
    const proposalRepo = AppDataSource.getRepository(Proposal);
    const proposal = await proposalRepo.findOne({
      where: { id },
      relations: ['resources'],
    });

    if (!proposal) {
      throw new Error('Proposta não encontrada');
    }

    // Permitir edição mesmo se aprovada (usuário pode clicar em "Editar Proposta")
    // A proposta voltará para status 'under_review'

    // Atualizar campos
    if (updates.durationMonths !== undefined) {
      proposal.durationMonths = updates.durationMonths;
    }
    if (updates.totalCost !== undefined) {
      proposal.totalCost = updates.totalCost;
    }
    if (updates.totalPrice !== undefined) {
      proposal.totalPrice = updates.totalPrice;
    }
    if (updates.description !== undefined) {
      proposal.description = updates.description;
    }
    if (updates.claudeAnalysis !== undefined) {
      proposal.claudeAnalysis = updates.claudeAnalysis;
    }

    proposal.status = 'under_review';

    await proposalRepo.save(proposal);
    logger.info(`✏️ Proposta ${id} atualizada - Status: under_review`);

    return proposal;
  }

  /**
   * Aprova proposta e gera Excel
   */
  async approveProposal(
    id: string,
    feedback?: {
      rating?: number;
      notes?: string;
    }
  ): Promise<Proposal> {
    const proposalRepo = AppDataSource.getRepository(Proposal);
    const proposal = await proposalRepo.findOne({
      where: { id },
      relations: ['resources', 'resources.professional'],
    });

    if (!proposal) {
      throw new Error('Proposta não encontrada');
    }

    const learningService = new LearningService();

    // Calcular modificações se houver análise original
    if (proposal.originalAIAnalysis) {
      const { differences, wasModified } =
        learningService.calculateModifications(
          proposal.originalAIAnalysis,
          proposal
        );

      proposal.userModifications = differences as any;
      proposal.wasModified = wasModified;

      // Salvar métricas se foi modificada
      if (wasModified && differences.length > 0) {
        await learningService.saveMetrics(id, differences);
        logger.info(
          `📊 Proposta foi modificada. Diferenças: ${differences.length} campos alterados`
        );
      }
    }

    // Salvar feedback
    if (feedback) {
      if (feedback.rating !== undefined) {
        proposal.accuracyRating = feedback.rating;
      }
      if (feedback.notes !== undefined) {
        proposal.feedbackNotes = feedback.notes;
      }
    }

    // Atualizar status e timestamp
    proposal.status = 'approved';
    proposal.approvedAt = new Date();

    await proposalRepo.save(proposal);
    logger.info(`✅ Proposta ${id} aprovada`);

    // Agora gerar Excel
    logger.info('📊 Gerando planilha Excel após aprovação...');

    // Buscar parâmetros
    const parameterRepo = AppDataSource.getRepository(Parameter);
    const parameters = await parameterRepo.find();
    const params = {
      tax: Number(parameters.find((p) => p.name === 'tax')?.value) || 0.21,
      sga: Number(parameters.find((p) => p.name === 'sga')?.value) || 0.1,
      margin: Number(parameters.find((p) => p.name === 'margin')?.value) || 0.25,
    };

    const excelPath = await this.excelService.generateProposal({
      clientName: proposal.clientName,
      projectName: proposal.projectName,
      resources: proposal.resources.map((r) => ({
        role: r.professional.role,
        hoursPerWeek: r.hoursPerWeek || [],
        totalHours: r.totalHours,
        hourlyCost: Number(r.professional.hourlyCost),
        cost: r.cost,
        price: r.price,
      })),
      totalCost: proposal.totalCost,
      totalPrice: proposal.totalPrice,
      duration: proposal.durationMonths,
      schedule: (proposal.claudeAnalysis as any)?.schedule || {
        sprints: [],
        dependencies: [],
        milestones: [],
        riskBuffer: 0,
      },
      parameters: params,
    });

    proposal.excelFilePath = excelPath;
    proposal.status = 'excel_generated';
    await proposalRepo.save(proposal);

    logger.info(`✅ Proposta ${id} aprovada e Excel gerado com sucesso`);
    return proposal;
  }

  /**
   * Gera Excel como buffer (para download on-demand)
   */
  async generateExcelBuffer(id: string): Promise<Buffer> {
    const proposalRepo = AppDataSource.getRepository(Proposal);
    const proposal = await proposalRepo.findOne({
      where: { id },
      relations: ['resources', 'resources.professional'],
    });

    if (!proposal) {
      throw new Error('Proposta não encontrada');
    }

    // Buscar parâmetros
    const parameterRepo = AppDataSource.getRepository(Parameter);
    const parameters = await parameterRepo.find();
    const params = {
      tax: Number(parameters.find((p) => p.name === 'tax')?.value) || 0.21,
      sga: Number(parameters.find((p) => p.name === 'sga')?.value) || 0.1,
      margin: Number(parameters.find((p) => p.name === 'margin')?.value) || 0.25,
    };

    logger.info('📊 Gerando Excel buffer on-demand...');

    const buffer = await this.excelService.generateProposalBuffer({
      clientName: proposal.clientName,
      projectName: proposal.projectName,
      resources: proposal.resources.map((r) => ({
        role: r.professional.role,
        hoursPerWeek: r.hoursPerWeek || [],
        totalHours: r.totalHours,
        hourlyCost: Number(r.professional.hourlyCost),
        cost: r.cost,
        price: r.price,
      })),
      totalCost: proposal.totalCost,
      totalPrice: proposal.totalPrice,
      duration: proposal.durationMonths,
      schedule: (proposal.claudeAnalysis as any)?.schedule || {
        sprints: [],
        dependencies: [],
        milestones: [],
        riskBuffer: 0,
      },
      parameters: params,
    });

    logger.info('✅ Excel buffer gerado com sucesso');
    return buffer;
  }

  /**
   * Deleta proposta
   */
  async deleteProposal(id: string): Promise<boolean> {
    const proposalRepo = AppDataSource.getRepository(Proposal);
    const result = await proposalRepo.delete(id);
    return (result.affected || 0) > 0;
  }
}
