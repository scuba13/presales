import { ClaudeService } from './ClaudeService';
import { OpenAIService } from './OpenAIService';
import { logger } from '../config/logger';

// Interface comum para todos os serviços de IA
export interface IAIService {
  analyzeComplete(files: { path: string; mimetype: string }[]): Promise<{
    analysis: {
      scope: string;
      coreFunctionalities: string[];
      integrations: string[];
      nonFunctionalRequirements: string[];
      complexity: 'low' | 'medium' | 'high';
      risks: string[];
    };
    teamEstimation: {
      teamComposition: { role: string; quantity: number }[];
      monthlyAllocation: { role: string; hoursPerMonth: number[] }[];
      projectDuration: number;
      phases: { name: string; effortPercentage: number }[];
    };
    schedule: {
      sprints: { number: number; deliverables: string[] }[];
      dependencies: { task: string; dependsOn: string[] }[];
      milestones: { name: string; date: string }[];
      riskBuffer: number;
    };
  }>;
}

// Tipos de provedores de IA suportados
export type AIProvider = 'claude' | 'openai';

/**
 * Factory para criar instâncias de serviços de IA
 */
export class AIServiceFactory {
  /**
   * Retorna uma instância do serviço de IA solicitado
   * Agora cria uma nova instância a cada vez para permitir diferentes modelos
   */
  static getService(provider: AIProvider, model?: string): IAIService {
    logger.info(`🤖 Inicializando serviço de IA: ${provider.toUpperCase()}${model ? ` (modelo: ${model})` : ''}`);

    switch (provider) {
      case 'claude':
        return new ClaudeService(model);

      case 'openai':
        return new OpenAIService(model);

      default:
        throw new Error(`Provedor de IA não suportado: ${provider}`);
    }
  }

  /**
   * Valida se o provedor é válido
   */
  static isValidProvider(provider: string): provider is AIProvider {
    return provider === 'claude' || provider === 'openai';
  }

  /**
   * Lista todos os provedores disponíveis
   */
  static getAvailableProviders(): AIProvider[] {
    return ['claude', 'openai'];
  }

  /**
   * Retorna informações sobre os provedores
   */
  static getProviderInfo(provider: AIProvider): {
    name: string;
    model: string;
    description: string;
    models: { id: string; name: string; description: string }[];
  } {
    const info = {
      claude: {
        name: 'Anthropic Claude',
        model: 'claude-sonnet-4-20250514',
        description: 'Modelos Claude da Anthropic com excelente capacidade de análise',
        models: [
          {
            id: 'claude-opus-4-20250514',
            name: 'Claude Opus 4',
            description: 'Mais poderoso (Mai/2025) - Máxima qualidade e raciocínio',
          },
          {
            id: 'claude-sonnet-4-20250514',
            name: 'Claude Sonnet 4',
            description: 'Balanceado (Mai/2025) - Excelente custo-benefício',
          },
          {
            id: 'claude-3-7-sonnet-20250219',
            name: 'Claude 3.7 Sonnet',
            description: 'Versão 3.7 (Fev/2025) - Ótima performance',
          },
          {
            id: 'claude-3-5-sonnet-20241022',
            name: 'Claude 3.5 Sonnet',
            description: 'Versão 3.5 (Out/2024) - Boa performance',
          },
          {
            id: 'claude-3-opus-20240229',
            name: 'Claude 3 Opus',
            description: 'Opus 3 - Alta qualidade',
          },
          {
            id: 'claude-3-5-haiku-20241022',
            name: 'Claude 3.5 Haiku',
            description: 'Mais rápido - Economia de custos',
          },
        ],
      },
      openai: {
        name: 'OpenAI GPT',
        model: 'o1',
        description: 'Modelos GPT da OpenAI com alta capacidade analítica',
        models: [
          {
            id: 'o1',
            name: 'GPT-o1 (Strawberry)',
            description: 'Mais recente - Raciocínio avançado e complexo',
          },
          {
            id: 'o1-mini',
            name: 'GPT-o1 Mini',
            description: 'Versão otimizada - Raciocínio rápido',
          },
          {
            id: 'gpt-4o',
            name: 'GPT-4o',
            description: 'Otimizado - Melhor performance multimodal',
          },
          {
            id: 'gpt-4-turbo',
            name: 'GPT-4 Turbo',
            description: 'Turbo - Alta velocidade',
          },
          {
            id: 'gpt-4',
            name: 'GPT-4',
            description: 'Versão estável - Alta qualidade',
          },
          {
            id: 'gpt-3.5-turbo',
            name: 'GPT-3.5 Turbo',
            description: 'Mais rápido - Economia de custos',
          },
        ],
      },
    };

    return info[provider];
  }
}
