# 🧠 Plano de Implementação: Sistema de Aprendizado da IA

**Data:** 2025-11-09
**Versão:** 1.0
**Objetivo:** Permitir que o sistema aprenda com propostas aprovadas para melhorar previsões futuras

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Problema Atual](#problema-atual)
3. [Solução Proposta](#solução-proposta)
4. [Arquitetura](#arquitetura)
5. [Fases de Implementação](#fases-de-implementação)
6. [Detalhamento Técnico](#detalhamento-técnico)
7. [Fluxos de Trabalho](#fluxos-de-trabalho)
8. [Métricas e KPIs](#métricas-e-kpis)
9. [Riscos e Mitigações](#riscos-e-mitigações)

---

## 🎯 Visão Geral

### Objetivo Principal
Transformar o sistema de **geração automática única** em um sistema de **aprendizado contínuo** que melhora suas previsões com base em feedback humano.

### Benefícios Esperados
- ✅ Previsões mais precisas a cada proposta aprovada
- ✅ Redução do tempo de ajustes manuais em 60-80%
- ✅ Maior confiança dos usuários na IA
- ✅ Base de conhecimento corporativa sobre estimativas

---

## ❌ Problema Atual

### Fluxo Atual
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Upload    │────▶│  IA Gera     │────▶│   Excel     │
│ Documentos  │     │  Proposta    │     │  Imediato   │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ❌ Usuário só visualiza
                    ❌ Sem edição
                    ❌ IA não aprende
                    ❌ Erros repetem
```

### Problemas Identificados
1. **Sem Feedback Loop:** IA nunca aprende com erros
2. **Sem Edição:** Usuário não pode ajustar antes do Excel
3. **Sem Histórico:** Propostas anteriores são ignoradas
4. **Baixa Precisão:** Sempre os mesmos erros de estimativa

---

## ✅ Solução Proposta

### Novo Fluxo Completo
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Upload    │────▶│  IA Gera     │────▶│   Revisar   │
│ Documentos  │     │  RASCUNHO    │     │   & Editar  │
└─────────────┘     └──────────────┘     └─────────────┘
                           │                     │
                           │                     ▼
                           │              ┌─────────────┐
                           │              │   Aprovar   │
                           │              └─────────────┘
                           │                     │
                           ▼                     ▼
                    ┌─────────────┐     ┌─────────────┐
                    │   Salvar    │────▶│    Gerar    │
                    │  Original   │     │    Excel    │
                    │  da IA      │     │    Final    │
                    └─────────────┘     └─────────────┘
                           │                     │
                           ▼                     ▼
                    ┌─────────────────────────────┐
                    │  COMPARAR & APRENDER        │
                    │  Original IA vs Editado     │
                    │  ────────────────────────   │
                    │  • Onde IA errou?           │
                    │  • Por quanto?              │
                    │  • Por quê? (feedback)      │
                    └─────────────────────────────┘
                           │
                           ▼
                    ┌─────────────────────────────┐
                    │  USAR EM PRÓXIMAS PREVISÕES │
                    │  ────────────────────────   │
                    │  Buscar propostas similares │
                    │  e incluir como exemplos    │
                    │  no prompt da IA            │
                    └─────────────────────────────┘
```

---

## 🏗️ Arquitetura

### Camadas do Sistema

```
┌──────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐     │
│  │   Upload   │  │   Review   │  │  Approval  │     │
│  │    Page    │─▶│    Page    │─▶│    Page    │     │
│  └────────────┘  └────────────┘  └────────────┘     │
└──────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────┐
│                    BACKEND API                       │
│  ┌────────────────────────────────────────────┐     │
│  │         ProposalController                 │     │
│  │  • generate()                              │     │
│  │  • update()                  ← NOVO        │     │
│  │  • approve()                 ← NOVO        │     │
│  │  • compareWithOriginal()     ← NOVO        │     │
│  └────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────┐     │
│  │         ProposalService                    │     │
│  │  • generateProposal()                      │     │
│  │  • updateProposal()          ← NOVO        │     │
│  │  • approveProposal()         ← NOVO        │     │
│  │  • calculateDifferences()    ← NOVO        │     │
│  │  • findSimilarProposals()    ← NOVO        │     │
│  └────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────┐     │
│  │         LearningService       ← NOVO       │     │
│  │  • trackModifications()                    │     │
│  │  • calculateAccuracy()                     │     │
│  │  • buildFewShotPrompt()                    │     │
│  │  • getSimilarProposals()                   │     │
│  └────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────┐
│                   DATABASE                           │
│  ┌────────────────────────────────────────────┐     │
│  │  Proposal (MODIFICADA)                     │     │
│  │  • originalAIAnalysis       ← NOVO         │     │
│  │  • userModifications        ← NOVO         │     │
│  │  • wasModified              ← NOVO         │     │
│  │  • accuracyRating           ← NOVO         │     │
│  │  • feedbackNotes            ← NOVO         │     │
│  │  • approvedAt               ← NOVO         │     │
│  └────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────┐     │
│  │  ProposalMetrics (NOVA)     ← NOVO         │     │
│  │  • proposalId                              │     │
│  │  • durationAccuracy                        │     │
│  │  • costAccuracy                            │     │
│  │  • teamSizeAccuracy                        │     │
│  │  • overallAccuracy                         │     │
│  └────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────┘
```

---

## 🚀 Fases de Implementação

### FASE 1: Base para Edição (1-2 semanas)
**Objetivo:** Permitir revisão e edição manual antes de gerar Excel

#### 1.1 Backend - Database
- [ ] Adicionar novos campos na entidade `Proposal`
- [ ] Criar migration para adicionar colunas
- [ ] Criar entidade `ProposalMetrics`
- [ ] Atualizar tipos TypeScript

#### 1.2 Backend - API
- [ ] Criar endpoint `PUT /api/proposals/:id` (update)
- [ ] Criar endpoint `POST /api/proposals/:id/approve` (approve)
- [ ] Modificar `ProposalService.generateProposal()` para:
  - Salvar com status `generated` (não `approved`)
  - Salvar análise original em `originalAIAnalysis`
  - NÃO gerar Excel ainda
- [ ] Criar `ProposalService.updateProposal()`
- [ ] Criar `ProposalService.approveProposal()`

#### 1.3 Frontend - Review Page
- [ ] Criar página `/proposals/:id/review`
- [ ] Componentes editáveis:
  - Editar duração do projeto
  - Editar equipe (roles e quantidades)
  - Editar alocação mensal (horas por mês)
  - Editar custos e preços
  - Editar cronograma (sprints, milestones)
- [ ] Botões de ação:
  - "Salvar Rascunho" (status: under_review)
  - "Aprovar e Gerar Excel" (approve + gerar Excel)
- [ ] Mostrar "diff" visual: IA sugeriu X, você mudou para Y

#### 1.4 Fluxo Modificado
- [ ] Após upload: redirecionar para `/proposals/:id/review`
- [ ] Excel gerado APENAS após aprovação
- [ ] Status progression:
  ```
  draft → generated → under_review → approved → excel_generated
  ```

---

### FASE 2: Tracking de Modificações (1 semana)
**Objetivo:** Registrar o que foi mudado e por quê

#### 2.1 Backend - Tracking
- [ ] Criar `LearningService.trackModifications()`
  ```typescript
  trackModifications(original, modified) {
    return {
      duration: { ai: 8, user: 6, diff: -2, diffPercent: -25 },
      team: { ai: 5, user: 4, diff: -1, diffPercent: -20 },
      cost: { ai: 200000, user: 180000, diff: -20000, diffPercent: -10 },
      // ...
    }
  }
  ```
- [ ] Salvar em `userModifications` campo JSONB
- [ ] Calcular e salvar métricas em `ProposalMetrics`

#### 2.2 Frontend - Feedback
- [ ] Modal ao aprovar: "Como foi a previsão da IA?"
  - Rating 1-5 estrelas
  - Campo de texto: "O que você mudou e por quê?"
- [ ] Salvar em `accuracyRating` e `feedbackNotes`

---

### FASE 3: Few-Shot Learning (1-2 semanas)
**Objetivo:** IA usar propostas anteriores como exemplos

#### 3.1 Backend - Similar Proposals
- [ ] Criar `LearningService.findSimilarProposals()`
  ```typescript
  findSimilarProposals({
    complexity: 'medium',
    scope: 'e-commerce com pagamentos',
    keywords: ['checkout', 'pagamento', 'carrinho']
  }): Promise<Proposal[]>
  ```
- [ ] Algoritmo de similaridade:
  - Mesma complexidade (peso: 40%)
  - Keywords no escopo (peso: 40%)
  - Indústria/setor (peso: 20%)
- [ ] Buscar apenas propostas:
  - `status = 'approved'`
  - `wasModified = true` (ou seja, foram revisadas)
  - Ordenar por `approvedAt DESC`
  - Limitar a 3-5 mais recentes

#### 3.2 Backend - Enhanced Prompt
- [ ] Modificar prompts em `ClaudeService` e `OpenAIService`
- [ ] Adicionar seção "EXEMPLOS DE PROJETOS SIMILARES:"
  ```typescript
  const similarProposals = await learningService.findSimilarProposals(...)

  const examplesSection = `
  EXEMPLOS DE PROJETOS SIMILARES APROVADOS:

  EXEMPLO 1: ${proposal1.projectName}
  - Complexidade: ${proposal1.complexity}
  - Escopo: ${proposal1.description}
  - Duração PREVISTA pela IA: ${proposal1.originalAIAnalysis.duration} meses
  - Duração APROVADA pelo usuário: ${proposal1.durationMonths} meses
  - Equipe: ${formatTeam(proposal1.resources)}
  - Custo: R$ ${proposal1.totalCost}
  - Feedback: "${proposal1.feedbackNotes}"

  EXEMPLO 2: ...

  Com base nestes exemplos, faça uma estimativa para o novo projeto:
  `
  ```

#### 3.3 Validação
- [ ] A/B Testing:
  - 50% das propostas COM exemplos
  - 50% das propostas SEM exemplos
- [ ] Comparar acurácia entre os dois grupos
- [ ] Medir melhoria ao longo do tempo

---

### FASE 4: Dashboard de Métricas (1 semana)
**Objetivo:** Visualizar evolução e acurácia da IA

#### 4.1 Backend - Analytics
- [ ] Criar `GET /api/analytics/ai-accuracy`
  ```json
  {
    "overallAccuracy": 78.5,
    "accuracyByField": {
      "duration": 82,
      "cost": 75,
      "team": 80
    },
    "improvementOverTime": [
      { "month": "2025-01", "accuracy": 65 },
      { "month": "2025-02", "accuracy": 72 },
      { "month": "2025-03", "accuracy": 78.5 }
    ],
    "totalProposals": 45,
    "proposalsWithModifications": 38,
    "avgModificationPercent": 15.2
  }
  ```

#### 4.2 Frontend - Dashboard
- [ ] Criar página `/analytics`
- [ ] Gráficos:
  - Linha: Acurácia ao longo do tempo
  - Barras: Acurácia por campo (duração, custo, equipe)
  - Pizza: % de propostas modificadas vs não modificadas
  - Heatmap: Onde IA erra mais (por complexidade)
- [ ] Tabela: Top 10 ajustes mais comuns
- [ ] Insights automáticos: "IA tende a subestimar duração em projetos high complexity em 20%"

---

### FASE 5: ML Avançado (Futuro - 2-3 meses)
**Objetivo:** Fine-tuning e modelos customizados

#### 5.1 Vector Embeddings
- [ ] Usar embeddings para similaridade semântica
- [ ] Integrar com vector database (Pinecone, Weaviate, PostgreSQL pgvector)
- [ ] Buscar propostas por similaridade de contexto (não só keywords)

#### 5.2 Fine-Tuning
- [ ] Coletar dataset: 100+ propostas aprovadas
- [ ] Fine-tune modelo OpenAI/Claude (se disponível)
- [ ] Ou treinar modelo próprio (considerando custos)

#### 5.3 Modelos Preditivos
- [ ] ML model para prever:
  - Probabilidade de modificação
  - Campos mais prováveis de serem editados
  - Magnitude da modificação esperada

---

## 💻 Detalhamento Técnico

### 1. Mudanças no Banco de Dados

#### Migration 1: Adicionar campos de aprendizado
```typescript
// migrations/xxxxx-add-learning-fields.ts
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLearningFields1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar colunas à tabela proposals
    await queryRunner.addColumn(
      'proposals',
      new TableColumn({
        name: 'originalAIAnalysis',
        type: 'jsonb',
        isNullable: true,
        comment: 'Análise original da IA antes de qualquer edição',
      })
    );

    await queryRunner.addColumn(
      'proposals',
      new TableColumn({
        name: 'userModifications',
        type: 'jsonb',
        isNullable: true,
        comment: 'Diferenças entre análise original e aprovada',
      })
    );

    await queryRunner.addColumn(
      'proposals',
      new TableColumn({
        name: 'wasModified',
        type: 'boolean',
        default: false,
        comment: 'Se a proposta foi editada pelo usuário',
      })
    );

    await queryRunner.addColumn(
      'proposals',
      new TableColumn({
        name: 'accuracyRating',
        type: 'int',
        isNullable: true,
        comment: 'Rating 1-5 da acurácia da previsão inicial',
      })
    );

    await queryRunner.addColumn(
      'proposals',
      new TableColumn({
        name: 'feedbackNotes',
        type: 'text',
        isNullable: true,
        comment: 'Feedback textual do usuário sobre a previsão',
      })
    );

    await queryRunner.addColumn(
      'proposals',
      new TableColumn({
        name: 'approvedAt',
        type: 'timestamp',
        isNullable: true,
        comment: 'Quando a proposta foi aprovada',
      })
    );

    // Atualizar status default
    await queryRunner.query(
      `ALTER TABLE proposals ALTER COLUMN status SET DEFAULT 'draft'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('proposals', 'originalAIAnalysis');
    await queryRunner.dropColumn('proposals', 'userModifications');
    await queryRunner.dropColumn('proposals', 'wasModified');
    await queryRunner.dropColumn('proposals', 'accuracyRating');
    await queryRunner.dropColumn('proposals', 'feedbackNotes');
    await queryRunner.dropColumn('proposals', 'approvedAt');
  }
}
```

#### Migration 2: Criar tabela ProposalMetrics
```typescript
// migrations/xxxxx-create-proposal-metrics.ts
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateProposalMetrics1234567891 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'proposal_metrics',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'proposalId',
            type: 'uuid',
          },
          {
            name: 'durationAccuracy',
            type: 'decimal',
            precision: 5,
            scale: 2,
            comment: 'Acurácia da previsão de duração (0-100%)',
          },
          {
            name: 'costAccuracy',
            type: 'decimal',
            precision: 5,
            scale: 2,
            comment: 'Acurácia da previsão de custo (0-100%)',
          },
          {
            name: 'teamSizeAccuracy',
            type: 'decimal',
            precision: 5,
            scale: 2,
            comment: 'Acurácia da previsão de tamanho da equipe (0-100%)',
          },
          {
            name: 'overallAccuracy',
            type: 'decimal',
            precision: 5,
            scale: 2,
            comment: 'Acurácia geral (média ponderada)',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['proposalId'],
            referencedTableName: 'proposals',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('proposal_metrics');
  }
}
```

---

### 2. Entidades TypeORM Atualizadas

#### Proposal Entity
```typescript
// backend/src/entities/Proposal.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { ProposalResource } from './ProposalResource';
import { ProposalMetrics } from './ProposalMetrics';

@Entity('proposals')
export class Proposal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  clientName: string;

  @Column({ type: 'varchar', length: 255 })
  projectName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  status: string; // "draft" | "generated" | "under_review" | "approved" | "excel_generated" | "sent" | "client_approved" | "client_rejected"

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalPrice: number;

  @Column({ type: 'int' })
  durationMonths: number;

  @Column({ type: 'text', nullable: true })
  excelFilePath: string;

  @Column({ type: 'jsonb', nullable: true })
  claudeAnalysis: object; // Análise ATUAL (pode ser editada)

  // ========== NOVOS CAMPOS ==========
  @Column({ type: 'jsonb', nullable: true })
  originalAIAnalysis: object; // Análise ORIGINAL da IA (imutável)

  @Column({ type: 'jsonb', nullable: true })
  userModifications: object; // Modificações feitas pelo usuário

  @Column({ type: 'boolean', default: false })
  wasModified: boolean; // Se foi modificada após geração

  @Column({ type: 'int', nullable: true })
  accuracyRating: number; // 1-5 estrelas

  @Column({ type: 'text', nullable: true })
  feedbackNotes: string; // Feedback do usuário

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date; // Timestamp de aprovação
  // ==================================

  @Column({ type: 'varchar', length: 50, nullable: true })
  complexity: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ProposalResource, (resource) => resource.proposal)
  resources: ProposalResource[];

  @OneToOne(() => ProposalMetrics, (metrics) => metrics.proposal)
  metrics: ProposalMetrics;
}
```

#### ProposalMetrics Entity (NOVA)
```typescript
// backend/src/entities/ProposalMetrics.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Proposal } from './Proposal';

@Entity('proposal_metrics')
export class ProposalMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  proposalId: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  durationAccuracy: number; // 0-100

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  costAccuracy: number; // 0-100

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  teamSizeAccuracy: number; // 0-100

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  overallAccuracy: number; // 0-100

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => Proposal, (proposal) => proposal.metrics)
  @JoinColumn({ name: 'proposalId' })
  proposal: Proposal;
}
```

---

### 3. Backend Services

#### LearningService (NOVO)
```typescript
// backend/src/services/LearningService.ts
import { AppDataSource } from '../config/database';
import { Proposal } from '../entities/Proposal';
import { ProposalMetrics } from '../entities/ProposalMetrics';
import { logger } from '../config/logger';

interface ModificationDiff {
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
    modified: any
  ): {
    differences: ModificationDiff[];
    wasModified: boolean;
  } {
    const differences: ModificationDiff[] = [];

    // Comparar duração
    if (original.teamEstimation.projectDuration !== modified.durationMonths) {
      const diff =
        modified.durationMonths - original.teamEstimation.projectDuration;
      const percentDiff =
        (diff / original.teamEstimation.projectDuration) * 100;

      differences.push({
        field: 'duration',
        aiValue: original.teamEstimation.projectDuration,
        userValue: modified.durationMonths,
        difference: diff,
        percentageDiff: percentDiff,
      });
    }

    // Comparar custo
    const originalCost = this.calculateTotalCostFromAnalysis(original);
    if (Math.abs(originalCost - modified.totalCost) > 100) {
      const diff = modified.totalCost - originalCost;
      const percentDiff = (diff / originalCost) * 100;

      differences.push({
        field: 'cost',
        aiValue: originalCost,
        userValue: modified.totalCost,
        difference: diff,
        percentageDiff: percentDiff,
      });
    }

    // Comparar tamanho da equipe
    const originalTeamSize = original.teamEstimation.teamComposition.reduce(
      (sum: number, t: any) => sum + t.quantity,
      0
    );
    const modifiedTeamSize = modified.resources.length;
    if (originalTeamSize !== modifiedTeamSize) {
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
      const accuracy = Math.max(0, 100 - Math.abs(diff.percentageDiff));

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
      (metrics.durationAccuracy * 0.4 +
        metrics.costAccuracy * 0.4 +
        metrics.teamSizeAccuracy * 0.2);

    return metrics;
  }

  /**
   * Salva métricas no banco
   */
  async saveMetrics(proposalId: string, differences: ModificationDiff[]) {
    const metricsRepo = AppDataSource.getRepository(ProposalMetrics);
    const metrics = this.calculateAccuracyMetrics(differences);

    const proposalMetrics = metricsRepo.create({
      proposalId,
      ...metrics,
    });

    await metricsRepo.save(proposalMetrics);
    logger.info(
      `✅ Métricas salvas para proposta ${proposalId}: ${metrics.overallAccuracy.toFixed(1)}% acurácia`
    );
  }

  /**
   * Busca propostas similares para Few-Shot Learning
   */
  async findSimilarProposals(criteria: {
    complexity: string;
    scope: string;
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
        cost: proposal.totalCost,
        teamSize: proposal.resources.length,
      };

      examplesText += `EXEMPLO ${index + 1}: ${proposal.projectName}\n`;
      examplesText += `Cliente: ${proposal.clientName}\n`;
      examplesText += `Complexidade: ${proposal.complexity}\n`;
      examplesText += `Escopo: ${proposal.description?.substring(0, 200)}...\n`;
      examplesText += `\n`;
      examplesText += `Previsão Inicial da IA:\n`;
      examplesText += `  • Duração: ${original.teamEstimation.projectDuration} meses\n`;
      examplesText += `  • Equipe: ${original.teamEstimation.teamComposition.length} roles\n`;
      examplesText += `\n`;
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

  // Helper privado
  private calculateTotalCostFromAnalysis(analysis: any): number {
    // Implementar lógica de cálculo baseada na análise original
    return 0; // Placeholder
  }
}
```

#### ProposalService (MODIFICADO)
```typescript
// backend/src/services/ProposalService.ts
// Adicionar novos métodos

/**
 * Atualiza proposta em revisão
 */
async updateProposal(
  id: string,
  updates: {
    durationMonths?: number;
    resources?: any[];
    totalCost?: number;
    totalPrice?: number;
    description?: string;
  }
): Promise<Proposal> {
  const proposalRepo = AppDataSource.getRepository(Proposal);
  const proposal = await proposalRepo.findOne({ where: { id } });

  if (!proposal) {
    throw new Error('Proposta não encontrada');
  }

  // Não permitir edição se já aprovada
  if (proposal.status === 'approved' || proposal.status === 'excel_generated') {
    throw new Error('Proposta já aprovada não pode ser editada');
  }

  // Atualizar campos
  Object.assign(proposal, updates);
  proposal.status = 'under_review';

  await proposalRepo.save(proposal);
  logger.info(`✏️ Proposta ${id} atualizada`);

  return proposal;
}

/**
 * Aprova proposta e gera Excel
 */
async approveProposal(id: string, feedback?: {
  rating?: number;
  notes?: string;
}): Promise<Proposal> {
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
    const { differences, wasModified } = learningService.calculateModifications(
      proposal.originalAIAnalysis,
      proposal
    );

    proposal.userModifications = differences as any;
    proposal.wasModified = wasModified;

    // Salvar métricas
    if (wasModified) {
      await learningService.saveMetrics(id, differences);
    }
  }

  // Salvar feedback
  if (feedback) {
    proposal.accuracyRating = feedback.rating;
    proposal.feedbackNotes = feedback.notes;
  }

  // Atualizar status e timestamp
  proposal.status = 'approved';
  proposal.approvedAt = new Date();

  await proposalRepo.save(proposal);

  // Agora gerar Excel
  logger.info('📊 Gerando planilha Excel após aprovação...');
  const excelPath = await this.excelService.generateProposal({
    clientName: proposal.clientName,
    projectName: proposal.projectName,
    resources: proposal.resources.map((r) => ({
      role: r.professional.role,
      hoursPerMonth: r.hoursPerMonth,
      totalHours: r.totalHours,
      hourlyCost: Number(r.professional.hourlyCost),
      cost: r.cost,
      price: r.price,
    })),
    totalCost: proposal.totalCost,
    totalPrice: proposal.totalPrice,
    duration: proposal.durationMonths,
    schedule: (proposal.claudeAnalysis as any).schedule,
    parameters: {
      tax: 0.21, // Buscar do banco
      sga: 0.10,
      margin: 0.25,
    },
  });

  proposal.excelFilePath = excelPath;
  proposal.status = 'excel_generated';
  await proposalRepo.save(proposal);

  logger.info(`✅ Proposta ${id} aprovada e Excel gerado`);
  return proposal;
}
```

---

### 4. Frontend - Review Page

#### Estrutura da Página
```typescript
// frontend/src/pages/ProposalReview.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { proposalService } from '../services/api';
import {
  CheckCircle,
  XCircle,
  Edit2,
  Save,
  AlertTriangle
} from 'lucide-react';

export default function ProposalReview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  // Buscar proposta
  const { data: proposal, isLoading } = useQuery({
    queryKey: ['proposal', id],
    queryFn: () => proposalService.getById(id!),
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: (data: any) => proposalService.update(id!, data),
    onSuccess: () => {
      toast.success('Proposta atualizada!');
      setIsEditing(false);
    },
  });

  // Mutation para aprovar
  const approveMutation = useMutation({
    mutationFn: () => proposalService.approve(id!, { rating, feedback }),
    onSuccess: () => {
      toast.success('Proposta aprovada! Excel sendo gerado...');
      navigate(`/proposals/${id}`);
    },
  });

  const handleApprove = () => {
    setShowApprovalModal(true);
  };

  const confirmApproval = () => {
    approveMutation.mutate();
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {proposal.projectName}
            </h1>
            <p className="text-gray-600 mt-1">{proposal.clientName}</p>
            <div className="flex gap-2 mt-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {proposal.complexity} complexity
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                {proposal.status}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50"
            >
              <Edit2 className="w-4 h-4" />
              {isEditing ? 'Cancelar' : 'Editar'}
            </button>
            <button
              onClick={handleApprove}
              className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4" />
              Aprovar e Gerar Excel
            </button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Duração</p>
          {isEditing ? (
            <input
              type="number"
              value={editedData?.durationMonths || proposal.durationMonths}
              onChange={(e) =>
                setEditedData({
                  ...editedData,
                  durationMonths: parseInt(e.target.value),
                })
              }
              className="mt-1 text-2xl font-bold border rounded px-2 py-1 w-24"
            />
          ) : (
            <p className="text-2xl font-bold">{proposal.durationMonths}</p>
          )}
          <p className="text-sm text-gray-600">meses</p>
          {proposal.originalAIAnalysis && (
            <p className="text-xs text-gray-500 mt-2">
              IA sugeriu: {proposal.originalAIAnalysis.teamEstimation.projectDuration} meses
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Custo Total</p>
          <p className="text-2xl font-bold">
            R$ {proposal.totalCost.toLocaleString('pt-BR')}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Preço Final</p>
          <p className="text-2xl font-bold text-green-600">
            R$ {proposal.totalPrice.toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Team Allocation */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Alocação da Equipe</h2>
        <div className="space-y-4">
          {proposal.resources.map((resource, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium">{resource.professional.role}</h3>
                  <p className="text-sm text-gray-600">
                    {resource.totalHours}h total
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    R$ {resource.price.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-gray-500">
                    R$ {resource.cost.toLocaleString('pt-BR')} custo
                  </p>
                </div>
              </div>

              {/* Hours per month - grid visual */}
              <div className="grid grid-cols-10 gap-1 mt-3">
                {resource.hoursPerMonth.map((hours, monthIdx) => (
                  <div key={monthIdx} className="text-center">
                    <div
                      className={`h-16 rounded flex items-end justify-center ${
                        hours > 0 ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                      style={{ height: `${(hours / 160) * 64}px` }}
                    >
                      {hours > 0 && (
                        <span className="text-xs text-white mb-1">{hours}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">M{monthIdx + 1}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Cronograma</h2>
        <div className="space-y-3">
          {proposal.claudeAnalysis.schedule.sprints.map((sprint, index) => (
            <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
              <h4 className="font-medium">Sprint {sprint.number}</h4>
              <ul className="text-sm text-gray-600 mt-1 space-y-1">
                {sprint.deliverables.map((deliverable, idx) => (
                  <li key={idx}>• {deliverable}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">
              Aprovar Proposta
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Como foi a precisão da IA? (1-5 estrelas)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-3xl ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                O que você ajustou e por quê? (Opcional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg p-2"
                placeholder="Ex: Reduzi a duração porque o cliente tem equipe interna de infraestrutura..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmApproval}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Confirmar Aprovação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 📊 Fluxos de Trabalho

### Fluxo 1: Geração Inicial (Modificado)
```
┌─────────────────────────────────────────────────────────┐
│ 1. Usuário faz upload de documentos                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Backend: ProposalService.generateProposal()         │
│    a) Buscar propostas similares                       │
│    b) Construir prompt com exemplos (Few-Shot)         │
│    c) Chamar IA (Claude/OpenAI)                        │
│    d) Salvar análise em originalAIAnalysis             │
│    e) Salvar análise em claudeAnalysis (editável)      │
│    f) Status = 'generated'                             │
│    g) NÃO gerar Excel ainda                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Frontend: Redirecionar para /proposals/:id/review   │
└─────────────────────────────────────────────────────────┘
```

### Fluxo 2: Revisão e Edição
```
┌─────────────────────────────────────────────────────────┐
│ 1. Usuário visualiza proposta gerada                   │
│    - Vê sugestões originais da IA                      │
│    - Compara com experiência própria                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Usuário clica em "Editar"                           │
│    - Modifica duração: 8 meses → 6 meses               │
│    - Ajusta equipe: Remove 1 DevOps                    │
│    - Altera alocação: Reduz horas do Tech Lead         │
│    - Ajusta custos manualmente                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Usuário clica em "Salvar Rascunho"                  │
│    - Status = 'under_review'                           │
│    - Mudanças salvas em claudeAnalysis                 │
│    - originalAIAnalysis permanece inalterado           │
└─────────────────────────────────────────────────────────┘
```

### Fluxo 3: Aprovação e Aprendizado
```
┌─────────────────────────────────────────────────────────┐
│ 1. Usuário clica em "Aprovar e Gerar Excel"            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Modal de Feedback                                   │
│    - Rating: ⭐⭐⭐⭐⭐ (5 estrelas)                       │
│    - Notas: "IA superestimou duração. Cliente tem      │
│              equipe interna de infra"                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Backend: ProposalService.approveProposal()          │
│    a) LearningService.calculateModifications()         │
│       - Compara originalAIAnalysis vs dados atuais     │
│       - Calcula diferenças em %                        │
│    b) Salva em userModifications                       │
│    c) LearningService.saveMetrics()                    │
│       - durationAccuracy: 75% (errou 25%)              │
│       - costAccuracy: 90%                              │
│       - teamSizeAccuracy: 80%                          │
│       - overallAccuracy: 81.7%                         │
│    d) Salva rating e feedback                          │
│    e) Status = 'approved'                              │
│    f) approvedAt = now()                               │
│    g) Gera Excel                                       │
│    h) Status = 'excel_generated'                       │
└─────────────────────────────────────────────────────────┘
```

### Fluxo 4: Próxima Geração com Aprendizado
```
┌─────────────────────────────────────────────────────────┐
│ 1. Novo projeto similar entra no sistema               │
│    - Complexidade: Medium                              │
│    - Escopo: "E-commerce com checkout customizado"     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 2. LearningService.findSimilarProposals()              │
│    - Busca: complexity = 'medium'                      │
│    - Busca: keywords em 'e-commerce', 'checkout'       │
│    - Busca: wasModified = true                         │
│    - Busca: status = 'approved'                        │
│    - Retorna: Top 3 mais recentes                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 3. LearningService.buildFewShotExamples()              │
│                                                         │
│    EXEMPLO 1: Sistema E-commerce - Empresa X           │
│    IA previu: 8 meses, R$ 200k                         │
│    Aprovado: 6 meses, R$ 180k                          │
│    Motivo: "Cliente tem infra pronta"                  │
│                                                         │
│    EXEMPLO 2: Loja Virtual - Empresa Y                 │
│    IA previu: 7 meses, R$ 190k                         │
│    Aprovado: 6 meses, R$ 175k                          │
│    Motivo: "Usamos template de checkout"               │
│                                                         │
│    EXEMPLO 3: Marketplace - Empresa Z                  │
│    IA previu: 9 meses, R$ 250k                         │
│    Aprovado: 7 meses, R$ 220k                          │
│    Motivo: "Equipe sênior, delivery mais rápido"       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Prompt para IA incluindo exemplos                   │
│                                                         │
│    "Analise este novo projeto de e-commerce.           │
│                                                         │
│     [Exemplos formatados aqui]                         │
│                                                         │
│     Com base nestes 3 exemplos, note que:              │
│     - Projetos similares foram entregues em 6-7 meses  │
│     - Custos ficaram entre R$ 175k - R$ 220k           │
│     - Principais ajustes: infra pronta, templates      │
│                                                         │
│     Agora estime para este novo projeto..."            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 5. IA gera estimativa mais precisa                     │
│    - Duração: 6.5 meses (antes: 8 meses)              │
│    - Custo: R$ 185k (antes: R$ 200k)                  │
│    - ✅ 18% mais preciso!                              │
└─────────────────────────────────────────────────────────┘
```

---

## 📈 Métricas e KPIs

### KPIs para Acompanhar

#### 1. Acurácia da IA
```
Métrica: Acurácia Geral
Fórmula: Média ponderada de todas as métricas
Meta: > 85% após 50 propostas aprovadas

Detalhamento:
- Acurácia de Duração (peso 40%)
- Acurácia de Custo (peso 40%)
- Acurácia de Tamanho da Equipe (peso 20%)
```

#### 2. Taxa de Modificação
```
Métrica: % de propostas modificadas
Fórmula: (Propostas modificadas / Total de propostas) * 100
Meta: < 30% após implementação de Few-Shot

Benchmark:
- Fase 0 (atual): ~80% modificadas
- Fase 1: ~70% modificadas
- Fase 3 (com Few-Shot): ~30% modificadas
```

#### 3. Magnitude de Ajustes
```
Métrica: Média de % de diferença por campo
Fórmula: Média(abs(valor_ia - valor_aprovado) / valor_ia)

Metas por campo:
- Duração: < 15% diferença
- Custo: < 10% diferença
- Equipe: < 20% diferença
```

#### 4. Tempo de Revisão
```
Métrica: Tempo médio de revisão
Fórmula: Média(approvedAt - createdAt)
Meta: < 2 horas

Esperado:
- Fase 1: ~4 horas (muitas edições)
- Fase 3: ~1.5 horas (poucas edições)
```

#### 5. User Satisfaction
```
Métrica: Rating médio (1-5 estrelas)
Fórmula: Média(accuracyRating)
Meta: > 4.0 estrelas

Correlação esperada:
Rating vs Acurácia da IA deve ser > 0.8
```

### Dashboard Analytics SQL Queries

```sql
-- Acurácia geral ao longo do tempo
SELECT
  DATE_TRUNC('month', p.approved_at) as month,
  AVG(pm.overall_accuracy) as avg_accuracy,
  COUNT(*) as proposals_count
FROM proposals p
JOIN proposal_metrics pm ON p.id = pm.proposal_id
WHERE p.status = 'approved'
GROUP BY month
ORDER BY month DESC;

-- Top 10 ajustes mais comuns
SELECT
  jsonb_array_elements(user_modifications)->>'field' as field,
  COUNT(*) as frequency,
  AVG((jsonb_array_elements(user_modifications)->>'percentageDiff')::float) as avg_diff_percent
FROM proposals
WHERE was_modified = true
GROUP BY field
ORDER BY frequency DESC
LIMIT 10;

-- Acurácia por complexidade
SELECT
  p.complexity,
  AVG(pm.duration_accuracy) as duration_acc,
  AVG(pm.cost_accuracy) as cost_acc,
  AVG(pm.team_size_accuracy) as team_acc,
  AVG(pm.overall_accuracy) as overall_acc,
  COUNT(*) as count
FROM proposals p
JOIN proposal_metrics pm ON p.id = pm.proposal_id
WHERE p.status = 'approved'
GROUP BY p.complexity;

-- Melhoria com Few-Shot Learning
WITH proposals_ordered AS (
  SELECT
    p.*,
    pm.overall_accuracy,
    ROW_NUMBER() OVER (ORDER BY p.approved_at) as seq
  FROM proposals p
  JOIN proposal_metrics pm ON p.id = pm.proposal_id
  WHERE p.status = 'approved'
)
SELECT
  CASE
    WHEN seq <= 10 THEN 'Primeiras 10'
    WHEN seq <= 30 THEN 'Próximas 20'
    ELSE 'Últimas (com aprendizado)'
  END as batch,
  AVG(overall_accuracy) as avg_accuracy
FROM proposals_ordered
GROUP BY batch;
```

---

## ⚠️ Riscos e Mitigações

### Risco 1: Usuários não fornecem feedback
**Probabilidade:** Média
**Impacto:** Alto
**Mitigação:**
- Fazer rating obrigatório (1-5 estrelas)
- Feedback textual opcional
- Gamificação: "Você já ajudou a treinar a IA em 10 propostas! 🎉"
- Mostrar impacto: "Suas avaliações melhoraram a IA em 15%"

### Risco 2: Propostas similares insuficientes
**Probabilidade:** Alta (no início)
**Impacto:** Médio
**Mitigação:**
- Algoritmo de fallback: se < 3 similares, buscar por complexidade apenas
- Seed data: importar propostas históricas manualmente (se houver)
- Mensagem para usuário: "Sistema ainda aprendendo. Esta é uma das primeiras propostas dessa categoria."

### Risco 3: IA interpreta mal os exemplos
**Probabilidade:** Baixa
**Impacto:** Médio
**Mitigação:**
- Testar prompts extensivamente
- Incluir disclaimer nos exemplos: "Adapte ao contexto específico"
- Monitorar casos onde acurácia piorou após Few-Shot
- Adicionar validações: se estimativa divergir muito dos exemplos, alertar

### Risco 4: Overhead de processamento
**Probabilidade:** Baixa
**Impacto:** Baixo
**Mitigação:**
- Cache de propostas similares (15 minutos)
- Busca assíncrona (não bloquear geração)
- Índices no banco: complexity, status, approvedAt
- Limitar a 3-5 exemplos (não todos)

### Risco 5: Privacidade dos dados
**Probabilidade:** Baixa
**Impacto:** Alto
**Mitigação:**
- Anonimizar dados ao incluir em prompts
- Não incluir informações sensíveis (valores específicos de contratos)
- Permitir usuário marcar proposta como "privada" (não usar como exemplo)
- LGPD compliance: consentimento para usar dados de aprendizado

---

## 📅 Timeline Estimado

```
FASE 1: Base para Edição
├─ Sprint 1 (Semana 1)
│  ├─ Database migrations
│  ├─ Backend: Update & Approve endpoints
│  └─ Testes unitários backend
│
└─ Sprint 2 (Semana 2)
   ├─ Frontend: Review page
   ├─ Frontend: Edit components
   └─ Testes integração

FASE 2: Tracking
├─ Sprint 3 (Semana 3)
│  ├─ LearningService.trackModifications()
│  ├─ ProposalMetrics entity
│  └─ Feedback modal

FASE 3: Few-Shot Learning
├─ Sprint 4 (Semana 4)
│  ├─ LearningService.findSimilarProposals()
│  └─ Algoritmo de similaridade
│
└─ Sprint 5 (Semana 5)
   ├─ buildFewShotExamples()
   ├─ Modificar prompts IA
   └─ A/B Testing

FASE 4: Analytics
└─ Sprint 6 (Semana 6)
   ├─ Analytics API
   ├─ Dashboard frontend
   └─ Gráficos e insights

FASE 5: ML Avançado (Futuro)
└─ A definir (2-3 meses)
```

**Total Estimado: 6 semanas (1.5 meses)**

---

## ✅ Checklist de Implementação

### Preparação
- [ ] Revisar e aprovar este plano
- [ ] Definir prioridades (fazer todas as fases ou parar em alguma?)
- [ ] Configurar ambiente de desenvolvimento
- [ ] Criar branch: `feature/ai-learning-system`

### Fase 1
- [ ] Criar migrations
- [ ] Atualizar entidades
- [ ] Implementar endpoints backend
- [ ] Criar tela de revisão frontend
- [ ] Testes E2E do fluxo completo
- [ ] Deploy em staging
- [ ] Validação com usuários beta

### Fase 2
- [ ] Implementar tracking service
- [ ] Criar modal de feedback
- [ ] Dashboard básico de métricas
- [ ] Testes

### Fase 3
- [ ] Algoritmo de busca de similares
- [ ] Prompt engineering com exemplos
- [ ] A/B Testing
- [ ] Análise de resultados

### Fase 4
- [ ] Analytics API completa
- [ ] Dashboard avançado
- [ ] Relatórios automatizados

---

## 📚 Referências e Recursos

### Papers e Conceitos
- **Few-Shot Learning:** [Language Models are Few-Shot Learners (GPT-3 Paper)](https://arxiv.org/abs/2005.14165)
- **RAG (Retrieval-Augmented Generation):** [Lewis et al., 2020](https://arxiv.org/abs/2005.11401)
- **Prompt Engineering:** [OpenAI Best Practices](https://platform.openai.com/docs/guides/prompt-engineering)

### Ferramentas
- **Vector Databases:** Pinecone, Weaviate, PostgreSQL pgvector
- **Monitoring:** Langfuse, LangSmith
- **A/B Testing:** PostHog, GrowthBook

### Métricas de ML
- **MAPE (Mean Absolute Percentage Error):** Métrica principal para acurácia
- **R² Score:** Para modelos preditivos futuros
- **Confusion Matrix:** Se implementar classificação de complexidade

---

## 🎯 Critérios de Sucesso

### Após Fase 1 (Semana 2)
- ✅ Usuários conseguem revisar e editar propostas
- ✅ Excel gerado apenas após aprovação
- ✅ 100% das propostas passam pelo fluxo de revisão

### Após Fase 2 (Semana 3)
- ✅ 80%+ dos usuários fornecem rating
- ✅ Métricas sendo calculadas e salvas corretamente
- ✅ Dashboard mostra dados reais

### Após Fase 3 (Semana 5)
- ✅ Acurácia geral > 75% (baseline: ~60%)
- ✅ Taxa de modificação < 50% (baseline: ~80%)
- ✅ A/B Test mostra melhoria estatisticamente significativa (p < 0.05)

### Após Fase 4 (Semana 6)
- ✅ Dashboard acessível e útil
- ✅ Insights automáticos funcionando
- ✅ Usuários reportam confiança na IA aumentou

---

## 📞 Próximos Passos

1. **Revisar este documento** e fazer ajustes necessários
2. **Aprovar o plano** e definir se faremos todas as fases ou priorizaremos algumas
3. **Criar issues/tasks** no GitHub/Jira para cada item
4. **Iniciar Fase 1** com a implementação do backend (migrations + endpoints)
5. **Agendar reuniões** de review ao final de cada sprint

---

**Documento preparado por:** Claude Code
**Data:** 2025-11-09
**Versão:** 1.0

**Status:** 🟡 Aguardando Aprovação
