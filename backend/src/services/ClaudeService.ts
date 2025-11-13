import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../config/logger';
import fs from 'fs/promises';
import { ClaudeAPIError } from '../middleware/errorHandler';

// Interfaces para tipos de resposta
export interface ProjectAnalysis {
  scope: string;
  coreFunctionalities: string[];
  integrations: string[];
  nonFunctionalRequirements: string[];
  complexity: 'low' | 'medium' | 'high';
  risks: string[];
}

export interface TeamEstimation {
  teamComposition: { role: string; quantity: number }[];
  monthlyAllocation: { role: string; hoursPerMonth: number[] }[];
  projectDuration: number;
  phases: { name: string; effortPercentage: number }[];
}

export interface Schedule {
  sprints: { number: number; deliverables: string[] }[];
  dependencies: { task: string; dependsOn: string[] }[];
  milestones: { name: string; date: string }[];
  riskBuffer: number;
}

export interface CompleteAnalysis {
  analysis: ProjectAnalysis;
  teamEstimation: TeamEstimation;
  schedule: Schedule;
}

export class ClaudeService {
  private client: Anthropic;
  private model: string;

  constructor(model?: string) {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY não está configurada no .env');
    }

    this.client = new Anthropic({
      apiKey: apiKey,
    });

    // Modelo padrão se não for especificado
    this.model = model || 'claude-3-5-sonnet-20241022';

    logger.info(`✅ Claude AI Service inicializado com modelo: ${this.model}`);
  }

  /**
   * Converte arquivo para base64 para envio ao Claude
   */
  private async fileToBase64(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    return fileBuffer.toString('base64');
  }

  /**
   * Determina o media_type baseado no mimetype
   */
  private getMediaType(mimetype: string): string {
    const mimeMap: Record<string, string> = {
      'application/pdf': 'application/pdf',
      'image/png': 'image/png',
      'image/jpeg': 'image/jpeg',
      'image/jpg': 'image/jpeg',
      'image/webp': 'image/webp',
      'image/gif': 'image/gif',
    };
    return mimeMap[mimetype] || 'application/pdf';
  }

  /**
   * Análise de documentos - Passo 1: Análise Inicial
   * Extrai escopo, funcionalidades, requisitos e complexidade
   */
  async analyzeProjectScope(
    files: { path: string; mimetype: string }[],
    additionalContext?: string
  ): Promise<ProjectAnalysis> {
    try {
      logger.info(`Analisando escopo do projeto com ${files.length} documento(s)`);

      // Preparar conteúdo com documentos
      const content: any[] = [];

      // Adicionar cada documento
      for (const file of files) {
        const base64Data = await this.fileToBase64(file.path);
        const mediaType = this.getMediaType(file.mimetype);

        content.push({
          type: 'document',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: base64Data,
          },
        });
      }

      // Adicionar prompt de análise
      const contextText = additionalContext
        ? `\n\n**CONTEXTO ADICIONAL FORNECIDO PELO USUÁRIO:**\n${additionalContext}\n\n`
        : '';

      content.push({
        type: 'text',
        text: `Analise os documentos fornecidos e identifique:${contextText}

1. **Escopo principal do projeto** - Descreva em 2-3 frases o objetivo principal
2. **Funcionalidades core necessárias** - Liste as 5-10 funcionalidades mais importantes
3. **Integrações mencionadas** - Quais sistemas, APIs ou serviços externos são citados
4. **Requisitos não-funcionais** - Performance, segurança, escalabilidade, etc
5. **Complexidade estimada** - Classifique como "low", "medium" ou "high" baseado em:
   - Quantidade de funcionalidades
   - Necessidade de integrações
   - Requisitos técnicos complexos
   - Inovação/tecnologias novas
6. **Riscos identificados** - Potenciais desafios ou incertezas

**IMPORTANTE**: Retorne APENAS um objeto JSON válido com esta estrutura exata:
{
  "scope": "string descrevendo o escopo principal",
  "coreFunctionalities": ["func1", "func2", ...],
  "integrations": ["integration1", "integration2", ...],
  "nonFunctionalRequirements": ["req1", "req2", ...],
  "complexity": "low" | "medium" | "high",
  "risks": ["risk1", "risk2", ...]
}

Não adicione texto explicativo fora do JSON.`,
      });

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: content,
          },
        ],
      });

      // Extrair texto da resposta
      const textContent = response.content.find((block) => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new ClaudeAPIError('Resposta do Claude não contém texto');
      }

      // Parse JSON
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.error('Resposta do Claude não é JSON válido:', textContent.text);
        throw new ClaudeAPIError('Resposta do Claude não é JSON válido');
      }

      const analysis: ProjectAnalysis = JSON.parse(jsonMatch[0]);
      logger.info('✅ Análise de escopo concluída');

      return analysis;
    } catch (error) {
      logger.error('Erro ao analisar escopo do projeto:', error);
      throw new ClaudeAPIError(
        error instanceof Error ? error.message : 'Erro desconhecido'
      );
    }
  }

  /**
   * Passo 2: Estimativa de Equipe
   * Sugere composição da equipe, alocação mensal e duração
   */
  async estimateTeam(analysis: ProjectAnalysis): Promise<TeamEstimation> {
    try {
      logger.info('Estimando equipe necessária');

      const prompt = `Com base na seguinte análise de projeto, sugira a equipe necessária:

**Análise do Projeto:**
- Escopo: ${analysis.scope}
- Complexidade: ${analysis.complexity}
- Funcionalidades core: ${analysis.coreFunctionalities.length}
- Integrações: ${analysis.integrations.length}
- Riscos: ${analysis.risks.length}

**Perfis Disponíveis:**
- Tech Lead (liderança técnica, arquitetura)
- Backend Dev (APIs, banco de dados)
- Frontend Dev (interfaces, UX)
- UX Designer (design, prototipação)
- Architect (arquitetura de soluções)
- Product Owner (gestão de produto)
- DevOps (infraestrutura, CI/CD)
- QA (testes, qualidade)

**Considerações:**
- Metodologia ágil com sprints de 2 semanas
- Jornada de trabalho: 160 horas/mês por pessoa
- Equipe distribuída

Retorne APENAS um objeto JSON com esta estrutura:
{
  "teamComposition": [
    {"role": "Tech Lead", "quantity": 1},
    {"role": "Backend Dev", "quantity": 2}
  ],
  "monthlyAllocation": [
    {"role": "Tech Lead", "hoursPerMonth": [160, 160, 80, 40, 0, 0, 0, 0, 0, 0]},
    {"role": "Backend Dev", "hoursPerMonth": [160, 160, 160, 160, 80, 0, 0, 0, 0, 0]}
  ],
  "projectDuration": 5,
  "phases": [
    {"name": "Discovery", "effortPercentage": 10},
    {"name": "Desenvolvimento", "effortPercentage": 60},
    {"name": "Testes", "effortPercentage": 20},
    {"name": "Implantação", "effortPercentage": 10}
  ]
}

**IMPORTANTE**:
- hoursPerMonth deve ter o número de posições igual a projectDuration
- Coloque 0 para meses sem alocação
- projectDuration: você decide livremente (pode ser 1 mês, 3 meses, 6 meses, 12 meses, 24 meses ou mais)
- Seja realista baseado na complexidade e escopo do projeto`;

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 3000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const textContent = response.content.find((block) => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new ClaudeAPIError('Resposta do Claude não contém texto');
      }

      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new ClaudeAPIError('Resposta do Claude não é JSON válido');
      }

      const estimation: TeamEstimation = JSON.parse(jsonMatch[0]);
      logger.info('✅ Estimativa de equipe concluída');

      return estimation;
    } catch (error) {
      logger.error('Erro ao estimar equipe:', error);
      throw new ClaudeAPIError(
        error instanceof Error ? error.message : 'Erro desconhecido'
      );
    }
  }

  /**
   * Passo 3: Geração de Cronograma
   * Cria timeline detalhado com sprints, dependências e marcos
   */
  async generateSchedule(teamEstimation: TeamEstimation): Promise<Schedule> {
    try {
      logger.info('Gerando cronograma do projeto');

      const prompt = `Com base na seguinte estimativa de equipe, crie um cronograma detalhado:

**Duração do Projeto:** ${teamEstimation.projectDuration} meses
**Fases:**
${teamEstimation.phases.map((p) => `- ${p.name}: ${p.effortPercentage}%`).join('\n')}

**Equipe:**
${teamEstimation.teamComposition.map((t) => `- ${t.quantity}x ${t.role}`).join('\n')}

Retorne APENAS um objeto JSON com esta estrutura:
{
  "sprints": [
    {"number": 1, "deliverables": ["Setup inicial", "Arquitetura base"]},
    {"number": 2, "deliverables": ["API de usuários", "Tela de login"]}
  ],
  "dependencies": [
    {"task": "Tela de login", "dependsOn": ["API de usuários"]},
    {"task": "Dashboard", "dependsOn": ["Autenticação", "API de dados"]}
  ],
  "milestones": [
    {"name": "MVP", "date": "Mês 3"},
    {"name": "Beta", "date": "Mês 5"},
    {"name": "Produção", "date": "Mês ${teamEstimation.projectDuration}"}
  ],
  "riskBuffer": 10
}

**IMPORTANTE**:
- Considere sprints de 2 semanas
- riskBuffer é porcentagem de tempo adicional (5-20%)
- Milestones principais do projeto`;

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const textContent = response.content.find((block) => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new ClaudeAPIError('Resposta do Claude não contém texto');
      }

      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new ClaudeAPIError('Resposta do Claude não é JSON válido');
      }

      const schedule: Schedule = JSON.parse(jsonMatch[0]);
      logger.info('✅ Cronograma gerado com sucesso');

      return schedule;
    } catch (error) {
      logger.error('Erro ao gerar cronograma:', error);
      throw new ClaudeAPIError(
        error instanceof Error ? error.message : 'Erro desconhecido'
      );
    }
  }

  /**
   * Método orquestrador - Executa análise completa
   */
  async analyzeComplete(
    files: { path: string; mimetype: string }[],
    additionalContext?: string
  ): Promise<CompleteAnalysis> {
    try {
      logger.info('🤖 Iniciando análise completa com Claude AI');

      // Passo 1: Análise de escopo
      const analysis = await this.analyzeProjectScope(files, additionalContext);

      // Passo 2: Estimativa de equipe
      const teamEstimation = await this.estimateTeam(analysis);

      // Passo 3: Geração de cronograma
      const schedule = await this.generateSchedule(teamEstimation);

      logger.info('🎉 Análise completa concluída com sucesso');

      return {
        analysis,
        teamEstimation,
        schedule,
      };
    } catch (error) {
      logger.error('Erro na análise completa:', error);
      throw error;
    }
  }
}
