import { AppDataSource } from '../config/database';
import { Proposal } from '../entities/Proposal';
import { ProposalMetrics } from '../entities/ProposalMetrics';
import { logger } from '../config/logger';

export interface ModificationDiff {
  field: string;
  aiValue: any;
  userValue: any;
  difference: number;
  percentageDiff: number;
}

export class LearningService {
  /**
   * Calcula as diferenças entre análise original e editada
   */
  calculateModifications(
    original: any,
    modified: Proposal
  ): {
    differences: ModificationDiff[];
    wasModified: boolean;
  } {
    const differences: ModificationDiff[] = [];

    // Comparar duração
    if (original.teamEstimation?.projectDuration !== modified.durationMonths) {
      const aiValue = original.teamEstimation?.projectDuration || 0;
      const diff = modified.durationMonths - aiValue;
      const percentDiff = aiValue > 0 ? (diff / aiValue) * 100 : 0;

      differences.push({
        field: 'duration',
        aiValue,
        userValue: modified.durationMonths,
        difference: diff,
        percentageDiff: percentDiff,
      });
    }

    // Comparar custo
    const originalCost = this.calculateTotalCostFromAnalysis(original);
    const modifiedCost = Number(modified.totalCost);
    if (Math.abs(originalCost - modifiedCost) > 100) {
      const diff = modifiedCost - originalCost;
      const percentDiff = originalCost > 0 ? (diff / originalCost) * 100 : 0;

      differences.push({
        field: 'cost',
        aiValue: originalCost,
        userValue: modifiedCost,
        difference: diff,
        percentageDiff: percentDiff,
      });
    }

    // Comparar tamanho da equipe
    const originalTeamSize = original.teamEstimation?.teamComposition?.reduce(
      (sum: number, t: any) => sum + (t.quantity || 0),
      0
    ) || 0;
    const modifiedTeamSize = modified.resources?.length || 0;
    if (originalTeamSize !== modifiedTeamSize && originalTeamSize > 0) {
      const diff = modifiedTeamSize - originalTeamSize;
      const percentDiff = (diff / originalTeamSize) * 100;

      differences.push({
        field: 'teamSize',
        aiValue: originalTeamSize,
        userValue: modifiedTeamSize,
        difference: diff,
        percentageDiff: percentDiff,
      });
    }

    return {
      differences,
      wasModified: differences.length > 0,
    };
  }

  /**
   * Calcula métricas de acurácia
   */
  calculateAccuracyMetrics(differences: ModificationDiff[]): {
    durationAccuracy: number;
    costAccuracy: number;
    teamSizeAccuracy: number;
    overallAccuracy: number;
  } {
    const metrics = {
      durationAccuracy: 100,
      costAccuracy: 100,
      teamSizeAccuracy: 100,
      overallAccuracy: 100,
    };

    differences.forEach((diff) => {
      // Acurácia = 100 - abs(% diferença)
      // Limitar entre 0 e 100
      const accuracy = Math.max(0, Math.min(100, 100 - Math.abs(diff.percentageDiff)));

      switch (diff.field) {
        case 'duration':
          metrics.durationAccuracy = accuracy;
          break;
        case 'cost':
          metrics.costAccuracy = accuracy;
          break;
        case 'teamSize':
          metrics.teamSizeAccuracy = accuracy;
          break;
      }
    });

    // Média ponderada
    metrics.overallAccuracy =
      metrics.durationAccuracy * 0.4 +
      metrics.costAccuracy * 0.4 +
      metrics.teamSizeAccuracy * 0.2;

    return metrics;
  }

  /**
   * Salva métricas no banco
   */
  async saveMetrics(proposalId: string, differences: ModificationDiff[]) {
    const metricsRepo = AppDataSource.getRepository(ProposalMetrics);
    const metrics = this.calculateAccuracyMetrics(differences);

    // Verificar se já existe métrica para esta proposta
    const existingMetric = await metricsRepo.findOne({
      where: { proposalId },
    });

    if (existingMetric) {
      // Atualizar métrica existente
      existingMetric.durationAccuracy = metrics.durationAccuracy;
      existingMetric.costAccuracy = metrics.costAccuracy;
      existingMetric.teamSizeAccuracy = metrics.teamSizeAccuracy;
      existingMetric.overallAccuracy = metrics.overallAccuracy;
      await metricsRepo.save(existingMetric);
      logger.info(
        `✅ Métricas atualizadas para proposta ${proposalId}: ${metrics.overallAccuracy.toFixed(1)}% acurácia`
      );
    } else {
      // Criar nova métrica
      const proposalMetrics = metricsRepo.create({
        proposalId,
        ...metrics,
      });
      await metricsRepo.save(proposalMetrics);
      logger.info(
        `✅ Métricas salvas para proposta ${proposalId}: ${metrics.overallAccuracy.toFixed(1)}% acurácia`
      );
    }
  }

  /**
   * Busca propostas similares para Few-Shot Learning
   */
  async findSimilarProposals(criteria: {
    complexity: string;
    scope?: string;
    keywords?: string[];
  }): Promise<Proposal[]> {
    const proposalRepo = AppDataSource.getRepository(Proposal);

    let query = proposalRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.resources', 'resources')
      .leftJoinAndSelect('resources.professional', 'professional')
      .where('p.status = :status', { status: 'approved' })
      .andWhere('p.wasModified = :wasModified', { wasModified: true })
      .andWhere('p.complexity = :complexity', {
        complexity: criteria.complexity,
      });

    // Buscar por keywords no escopo (case-insensitive)
    if (criteria.keywords && criteria.keywords.length > 0) {
      const keywordConditions = criteria.keywords
        .map((_, index) => `p.description ILIKE :keyword${index}`)
        .join(' OR ');

      const keywordParams = criteria.keywords.reduce(
        (acc, keyword, index) => ({
          ...acc,
          [`keyword${index}`]: `%${keyword}%`,
        }),
        {}
      );

      query = query.andWhere(`(${keywordConditions})`, keywordParams);
    }

    const proposals = await query
      .orderBy('p.approvedAt', 'DESC')
      .limit(3)
      .getMany();

    logger.info(
      `🔍 Encontradas ${proposals.length} propostas similares para aprendizado`
    );
    return proposals;
  }

  /**
   * Constrói prompt com exemplos (Few-Shot Learning)
   */
  buildFewShotExamples(similarProposals: Proposal[]): string {
    if (similarProposals.length === 0) {
      return '';
    }

    let examplesText = `\n\n📚 EXEMPLOS DE PROJETOS SIMILARES APROVADOS:\n`;
    examplesText += `Use estes exemplos para calibrar suas estimativas.\n\n`;

    similarProposals.forEach((proposal, index) => {
      const original = proposal.originalAIAnalysis as any;
      const approved = {
        duration: proposal.durationMonths,
        cost: Number(proposal.totalCost),
        teamSize: proposal.resources?.length || 0,
      };

      examplesText += `EXEMPLO ${index + 1}: ${proposal.projectName}\n`;
      examplesText += `Cliente: ${proposal.clientName}\n`;
      examplesText += `Complexidade: ${proposal.complexity}\n`;
      examplesText += `Escopo: ${proposal.description?.substring(0, 200)}...\n`;
      examplesText += `\n`;

      if (original?.teamEstimation) {
        examplesText += `Previsão Inicial da IA:\n`;
        examplesText += `  • Duração: ${original.teamEstimation.projectDuration} meses\n`;
        examplesText += `  • Equipe: ${original.teamEstimation.teamComposition?.length || 0} roles\n`;
        examplesText += `\n`;
      }

      examplesText += `Valores APROVADOS pelo especialista:\n`;
      examplesText += `  • Duração: ${approved.duration} meses\n`;
      examplesText += `  • Custo: R$ ${approved.cost.toLocaleString('pt-BR')}\n`;
      examplesText += `  • Equipe: ${approved.teamSize} profissionais\n`;

      if (proposal.feedbackNotes) {
        examplesText += `\n`;
        examplesText += `Feedback do especialista: "${proposal.feedbackNotes}"\n`;
      }

      examplesText += `\n${'─'.repeat(60)}\n\n`;
    });

    examplesText += `\n⚠️ IMPORTANTE: Use estes exemplos para ajustar suas estimativas,\n`;
    examplesText += `mas considere as particularidades do novo projeto.\n\n`;

    return examplesText;
  }

  /**
   * Helper privado - Calcula custo total da análise original
   */
  private calculateTotalCostFromAnalysis(analysis: any): number {
    // Se não houver análise, retornar 0
    if (!analysis || !analysis.teamEstimation) {
      return 0;
    }

    // Estimativa básica: somar horas * custo médio por hora
    // Isso é uma aproximação, pois não temos os custos horários exatos na análise original
    const totalHours = analysis.teamEstimation.monthlyAllocation?.reduce(
      (sum: number, allocation: any) => {
        const hoursForRole = allocation.hoursPerMonth?.reduce(
          (roleSum: number, hours: number) => roleSum + hours,
          0
        ) || 0;
        return sum + hoursForRole;
      },
      0
    ) || 0;

    // Custo médio estimado por hora (pode ser refinado)
    const avgHourlyCost = 100; // R$ 100/hora (placeholder)

    return totalHours * avgHourlyCost;
  }
}
