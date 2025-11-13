import OpenAI from 'openai';
import { logger } from '../config/logger';
import fs from 'fs/promises';
import path from 'path';
import { createReadStream } from 'fs';
import { File } from 'node:buffer';

// Polyfill para Node 18
if (typeof globalThis.File === 'undefined') {
  (globalThis as any).File = File;
}

// Tipos (compatíveis com ClaudeService)
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

export class OpenAIService {
  private client: OpenAI;
  private model: string;

  constructor(model?: string) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY não configurada no ambiente');
    }

    this.client = new OpenAI({
      apiKey: apiKey,
    });

    // Modelo padrão se não for especificado
    this.model = model || 'gpt-4-turbo-preview';

    logger.info(`✅ OpenAI Service inicializado com modelo: ${this.model}`);
  }

  /**
   * Converte arquivo para base64
   */
  private async fileToBase64(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    return buffer.toString('base64');
  }

  /**
   * Converte MIME type para formato OpenAI
   */
  private getImageFormat(mimetype: string): string {
    const mimeToFormat: { [key: string]: string } = {
      'image/png': 'png',
      'image/jpeg': 'jpeg',
      'image/jpg': 'jpeg',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };
    return mimeToFormat[mimetype] || 'jpeg';
  }

  /**
   * Prepara conteúdo dos arquivos para a API OpenAI
   */
  private async prepareFilesContent(files: { path: string; mimetype: string }[]): Promise<any[]> {
    const content: any[] = [];

    for (const file of files) {
      const ext = path.extname(file.path).toLowerCase();

      // Para imagens, usar vision com base64
      if (file.mimetype.startsWith('image/')) {
        const base64 = await this.fileToBase64(file.path);
        content.push({
          type: 'image_url',
          image_url: {
            url: `data:${file.mimetype};base64,${base64}`,
            detail: 'high',
          },
        });
      }
      // Para PDFs e outros documentos, fazer upload para OpenAI e usar file_id
      else if (file.mimetype === 'application/pdf' || file.mimetype.includes('text')) {
        logger.info(`📤 Fazendo upload do arquivo ${path.basename(file.path)} para OpenAI...`);

        const uploaded = await this.client.files.create({
          file: createReadStream(file.path),
          purpose: 'user_data',
        });

        logger.info(`✅ Arquivo enviado com file_id: ${uploaded.id}`);

        content.push({
          type: 'file',
          file: {
            file_id: uploaded.id,
          },
        });
      }
    }

    return content;
  }

  /**
   * Faz requisição à API OpenAI com retry
   */
  private async callAPI(messages: any[], responseFormat?: any): Promise<string> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`📡 Chamando OpenAI API (tentativa ${attempt}/${maxRetries})`);

        // Modelos o1 e GPT-5 têm parâmetros diferentes
        const isO1Model = this.model.startsWith('o1');
        const isGPT5Model = this.model.startsWith('gpt-5');
        const isReasoningModel = isO1Model || isGPT5Model;

        // Para modelos o1/GPT-5: combinar system com user prompt (não suportam role 'system')
        let processedMessages = messages;
        if (isReasoningModel && messages.length > 0 && messages[0].role === 'system') {
          logger.info(`🔄 Modelo ${isO1Model ? 'o1' : 'GPT-5'} detectado - combinando system prompt com user prompt`);
          const systemContent = messages[0].content;
          const userMessage = messages[1];

          // Para o1: apenas texto (não suporta imagens)
          // Para GPT-5: suporta imagens e documentos
          if (isO1Model) {
            // Extrair apenas texto para o1
            let userText = '';
            if (typeof userMessage.content === 'string') {
              userText = userMessage.content;
            } else if (Array.isArray(userMessage.content)) {
              logger.info(`📋 User message tem ${userMessage.content.length} blocos`);
              const textBlocks = userMessage.content.filter((block: any) => block.type === 'text');
              logger.info(`📝 Blocos de texto: ${textBlocks.length}`);
              userText = textBlocks.map((block: any) => block.text).join('\n\n');
            }

            // Combinar system + user como texto puro (o1 só aceita texto)
            const combinedContent = `${systemContent}\n\n${userText}`;
            processedMessages = [
              { role: 'user', content: combinedContent },
              ...messages.slice(2),
            ];
            logger.info(`✅ Content length: ${combinedContent.length} caracteres`);
          } else {
            // GPT-5: manter imagens e documentos
            const combinedContent = typeof userMessage.content === 'string'
              ? `${systemContent}\n\n${userMessage.content}`
              : [{ type: 'text', text: systemContent }, ...userMessage.content];

            processedMessages = [
              { role: 'user', content: combinedContent },
              ...messages.slice(2),
            ];
          }

          logger.info(`✅ Mensagens processadas: ${processedMessages.length} mensagem(ns)`);
          logger.info(`✅ Primeira mensagem role: ${processedMessages[0].role}`);
        }

        const requestParams: any = {
          model: this.model,
          messages: processedMessages,
        };

        // Adicionar parâmetros baseado no modelo
        if (isReasoningModel) {
          // Modelos o1 e GPT-5 não suportam temperature nem response_format
          requestParams.max_completion_tokens = 16000;
        } else {
          // Modelos tradicionais (GPT-4, GPT-3.5)
          requestParams.temperature = 0.3;
          requestParams.max_tokens = 4096;
          requestParams.response_format = responseFormat || { type: 'text' };
        }

        const response = await this.client.chat.completions.create(requestParams);

        logger.info(`📊 Response choices: ${response.choices?.length || 0}`);
        if (response.choices?.[0]) {
          logger.info(`📊 Message role: ${response.choices[0].message?.role}`);
          logger.info(`📊 Content length: ${response.choices[0].message?.content?.length || 0}`);
          logger.info(`📊 Finish reason: ${response.choices[0].finish_reason}`);
        }

        const content = response.choices[0]?.message?.content;

        if (!content) {
          logger.error('❌ Resposta vazia recebida:', JSON.stringify(response, null, 2));
          throw new Error('OpenAI retornou resposta vazia');
        }

        logger.info('✅ Resposta recebida da OpenAI');
        return content;
      } catch (error: any) {
        lastError = error;
        logger.warn(`⚠️ Erro na tentativa ${attempt}: ${error.message}`);

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
        }
      }
    }

    throw lastError || new Error('Falha ao chamar OpenAI API');
  }

  /**
   * PROMPT 1: Análise de Escopo do Projeto
   */
  async analyzeProjectScope(
    files: { path: string; mimetype: string }[],
    additionalContext?: string
  ): Promise<ProjectAnalysis> {
    logger.info('🔍 Iniciando análise de escopo com OpenAI...');

    const filesContent = await this.prepareFilesContent(files);

    const systemPrompt = `Você é um analista de projetos especialista em software. Analise os documentos fornecidos e extraia informações estruturadas sobre o projeto.

Retorne APENAS um JSON válido (sem markdown, sem \`\`\`json) com esta estrutura:
{
  "scope": "descrição do escopo em 2-3 frases",
  "coreFunctionalities": ["funcionalidade 1", "funcionalidade 2", ...],
  "integrations": ["integração 1", "integração 2", ...],
  "nonFunctionalRequirements": ["requisito 1", "requisito 2", ...],
  "complexity": "low|medium|high",
  "risks": ["risco 1", "risco 2", ...]
}`;

    const contextText = additionalContext
      ? `\n\n**CONTEXTO ADICIONAL FORNECIDO PELO USUÁRIO:**\n${additionalContext}\n\n`
      : '';

    const userPrompt = `Analise os documentos fornecidos e extraia:${contextText}
1. Escopo geral do projeto
2. Funcionalidades principais
3. Integrações necessárias
4. Requisitos não funcionais (performance, segurança, etc)
5. Complexidade (baixa, média, alta)
6. Riscos identificados`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [{ type: 'text', text: userPrompt }, ...filesContent],
      },
    ];

    const response = await this.callAPI(messages, { type: 'json_object' });
    const analysis = JSON.parse(response);

    logger.info(`✅ Análise concluída - Complexidade: ${analysis.complexity}`);
    return analysis;
  }

  /**
   * PROMPT 2: Estimativa de Equipe
   */
  async estimateTeam(analysis: ProjectAnalysis): Promise<TeamEstimation> {
    logger.info('👥 Estimando composição de equipe com OpenAI...');

    const systemPrompt = `Você é um gerente de projetos especialista em dimensionamento de equipes de software.

Com base na análise do projeto, sugira a composição da equipe e alocação mensal.

Retorne APENAS um JSON válido (sem markdown, sem \`\`\`json) com esta estrutura:
{
  "teamComposition": [
    { "role": "Tech Lead", "quantity": 1 },
    { "role": "Backend Developer", "quantity": 2 }
  ],
  "monthlyAllocation": [
    { "role": "Tech Lead", "hoursPerMonth": [160, 160, 160, 80, 80, 40] },
    { "role": "Backend Developer", "hoursPerMonth": [160, 160, 160, 160, 120, 80] }
  ],
  "projectDuration": 6,
  "phases": [
    { "name": "Discovery", "effortPercentage": 10 },
    { "name": "Development", "effortPercentage": 60 },
    { "name": "Testing", "effortPercentage": 20 },
    { "name": "Deployment", "effortPercentage": 10 }
  ]
}

IMPORTANTE:
- hoursPerMonth deve ter o número de posições igual a projectDuration
- Use roles padrão: Tech Lead, Backend Developer, Frontend Developer, QA Engineer, DevOps Engineer, UX/UI Designer
- A alocação deve diminuir nas fases finais
- projectDuration: você decide livremente baseado na complexidade (pode ser 1 mês, 6 meses, 24 meses, etc)`;

    const userPrompt = `Com base nesta análise do projeto:

Escopo: ${analysis.scope}
Funcionalidades: ${analysis.coreFunctionalities.join(', ')}
Complexidade: ${analysis.complexity}

Sugira:
1. Composição da equipe (roles e quantidade)
2. Alocação mensal de horas para cada role
3. Duração total do projeto em meses (você decide livremente baseado na complexidade real)
4. Divisão em fases com % de esforço`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await this.callAPI(messages, { type: 'json_object' });
    const estimation = JSON.parse(response);

    logger.info(`✅ Equipe estimada - ${estimation.teamComposition.length} roles`);
    return estimation;
  }

  /**
   * PROMPT 3: Geração de Cronograma
   */
  async generateSchedule(teamEstimation: TeamEstimation): Promise<Schedule> {
    logger.info('📅 Gerando cronograma com OpenAI...');

    const systemPrompt = `Você é um gerente de projetos especialista em planejamento ágil.

Com base na estimativa de equipe, crie um cronograma detalhado com sprints.

Retorne APENAS um JSON válido (sem markdown, sem \`\`\`json) com esta estrutura:
{
  "sprints": [
    { "number": 1, "deliverables": ["Setup inicial", "Arquitetura"] },
    { "number": 2, "deliverables": ["Feature X", "Feature Y"] }
  ],
  "dependencies": [
    { "task": "Deploy", "dependsOn": ["Testes completos", "Aprovação QA"] }
  ],
  "milestones": [
    { "name": "MVP Ready", "date": "M3" },
    { "name": "Beta Release", "date": "M6" }
  ],
  "riskBuffer": 15
}

IMPORTANTE:
- Criar sprints de 2 semanas
- Duração: ${teamEstimation.projectDuration} meses
- riskBuffer deve ser entre 10-20 (%)`;

    const userPrompt = `Com base nesta estimativa:

Duração: ${teamEstimation.projectDuration} meses
Fases: ${teamEstimation.phases.map((p) => `${p.name} (${p.effortPercentage}%)`).join(', ')}

Crie:
1. Sprints com entregas principais
2. Dependências entre tarefas
3. Marcos (milestones) importantes
4. Buffer de risco (%)`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await this.callAPI(messages, { type: 'json_object' });
    const schedule = JSON.parse(response);

    logger.info(`✅ Cronograma gerado - ${schedule.sprints.length} sprints`);
    return schedule;
  }

  /**
   * Método orquestrador - Análise completa
   */
  async analyzeComplete(
    files: { path: string; mimetype: string }[],
    additionalContext?: string
  ): Promise<CompleteAnalysis> {
    logger.info('🚀 Iniciando análise completa com OpenAI...');

    const analysis = await this.analyzeProjectScope(files, additionalContext);
    const teamEstimation = await this.estimateTeam(analysis);
    const schedule = await this.generateSchedule(teamEstimation);

    logger.info('✅ Análise completa finalizada com OpenAI');

    return {
      analysis,
      teamEstimation,
      schedule,
    };
  }
}
