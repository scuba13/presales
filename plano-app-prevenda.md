# Plano de Desenvolvimento - Sistema de Pré-Venda com IA

## 📋 Visão Geral do Projeto

Desenvolver uma aplicação web completa para automatizar o processo de pré-venda, utilizando Claude AI para análise de documentos e geração automática de propostas comerciais em formato Excel.

### Objetivo Principal
Transformar inputs diversos (textos, PDFs, imagens) em uma proposta estruturada de pré-venda com cálculo automático de custos, recursos e cronograma.

## 🏗️ Arquitetura do Sistema

### 1. Frontend (Interface Amigável)
```
Tecnologia Sugerida: React + TypeScript + Tailwind CSS
```

#### Componentes Principais:
- **Dashboard Principal**
  - Upload de arquivos (arrastar e soltar)
  - Histórico de propostas geradas
  - Métricas e estatísticas

- **Módulo de Upload e Análise**
  - Suporte para múltiplos formatos: TXT, PDF, DOCX, imagens
  - Preview de arquivos carregados
  - Status de processamento em tempo real
  - Interface para revisar informações extraídas

- **Configuração de Parâmetros**
  - Gestão de profissionais e seus custos/hora
  - Configuração de impostos (default: 21%)
  - Definição de SG&A (default: 10%)
  - Ajuste de margem (default: 25%)
  - Templates de equipes pré-definidas

- **Visualizador de Proposta**
  - Preview da planilha gerada
  - Edição inline de valores
  - Gráficos de distribuição de custos
  - Timeline visual do cronograma

### 2. Backend (Node.js + Express)
```
Tecnologia Sugerida: Node.js + Express + TypeScript
```

#### APIs Principais:

##### a) API de Upload e Processamento
```
POST /api/documents/upload
- Recebe arquivos múltiplos
- Extrai texto de PDFs usando pdf-parse
- OCR para imagens usando Tesseract
- Retorna ID de processamento
```

##### b) API de Integração com Claude
```
POST /api/ai/analyze
- Envia contexto extraído para Claude
- Prompts específicos para:
  * Identificar escopo do projeto
  * Estimar complexidade
  * Sugerir perfis necessários
  * Definir fases do projeto
```

##### c) API de Geração de Proposta
```
POST /api/proposal/generate
- Recebe análise do Claude
- Aplica regras de negócio
- Calcula custos com base nos parâmetros
- Gera Excel usando ExcelJS
```

##### d) API de Gestão de Recursos
```
GET/POST/PUT/DELETE /api/resources
- CRUD de profissionais
- Gestão de custos por perfil
- Histórico de alterações
```

### 3. Banco de Dados (PostgreSQL)
```
Estrutura Sugerida:
```

#### Tabelas Principais:

**professionals**
- id, name, role, hourly_cost, seniority, skills[]

**proposals**
- id, client_name, project_name, created_at, status, total_cost, total_price

**proposal_resources**
- proposal_id, professional_id, hours_per_month[], total_hours

**parameters**
- id, name, value, type (tax, sga, margin)

**templates**
- id, name, team_composition, typical_duration

## 📊 Estrutura do Excel de Saída

### Aba 1: Custo Solução e Sustentação

#### Seção de Desenvolvimento
| Recurso | M1 | M2 | M3 | ... | M10 | Total | Custo/Hora | Imposto | SG&A | Margem | Custo | Preço |
|---------|----|----|-------|-----|-----|--------|----------|---------|------|---------|--------|-------|

**Profissionais Disponíveis:**
- Tech Lead (TL) - R$ 110,12/hora
- Dev Backend - R$ 98,21/hora
- Dev Frontend - R$ 98,21/hora
- UX Designer - R$ 59,52/hora
- Arquiteto - R$ 148,81/hora
- Product Owner - R$ 77,38/hora
- DevOps - R$ 95,24/hora
- QA - R$ 44,64/hora

#### Seção de Sustentação
Mesma estrutura, mas para fase pós-implantação (M8-M10)

### Aba 2: Cronograma
- Estrutura de Gantt simplificado
- Fases: Discovery, Desenvolvimento, Testes, Implantação
- Marcos principais do projeto

## 🤖 Prompts para Claude AI

### Prompt 1: Análise Inicial
```
Analise os seguintes documentos e identifique:
1. Escopo principal do projeto
2. Funcionalidades core necessárias
3. Integrações mencionadas
4. Requisitos não-funcionais
5. Complexidade estimada (baixa/média/alta)
6. Riscos identificados

Formato de resposta: JSON estruturado
```

### Prompt 2: Estimativa de Equipe
```
Com base no escopo identificado, sugira:
1. Composição da equipe (perfis e quantidade)
2. Alocação mensal de cada recurso (em horas)
3. Duração total do projeto
4. Fases do projeto com percentual de esforço

Considere:
- Projeto de complexidade [X]
- Metodologia ágil com sprints de 2 semanas
- Equipe distribuída
```

### Prompt 3: Geração de Cronograma
```
Crie um cronograma detalhado com:
1. Principais entregas por sprint
2. Dependências entre atividades
3. Marcos críticos
4. Buffer de riscos

Formato: Lista de atividades com duração e predecessoras
```

## 📁 Estrutura de Diretórios do Projeto

```
prevenda-ai-app/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Upload/
│   │   │   ├── Dashboard/
│   │   │   ├── ProposalViewer/
│   │   │   └── Settings/
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── claude.ts
│   │   └── utils/
│   │       └── calculations.ts
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   │   ├── claude.service.ts
│   │   │   ├── excel.service.ts
│   │   │   └── document.service.ts
│   │   ├── models/
│   │   ├── routes/
│   │   └── utils/
│   └── package.json
│
├── database/
│   └── migrations/
│
└── docker-compose.yml
```

## 🔄 Fluxo de Processamento

1. **Upload de Documentos**
   - Usuario faz upload de RFP/briefing/documentos
   - Sistema extrai texto e metadados

2. **Análise por IA**
   - Claude analisa conteúdo extraído
   - Identifica requisitos e complexidade
   - Sugere composição de equipe

3. **Revisão Humana**
   - Usuário revisa sugestões da IA
   - Ajusta parâmetros se necessário
   - Confirma ou modifica alocações

4. **Cálculo Automático**
   - Sistema aplica fórmulas de custo
   - Calcula impostos, SG&A e margem
   - Gera preço final

5. **Geração do Excel**
   - Cria planilha formatada
   - Inclui gráficos e resumos
   - Disponibiliza para download

## 🛠️ Funcionalidades Avançadas

### Fase 1 (MVP)
- Upload e processamento básico
- Integração Claude para análise
- Geração de Excel simples
- CRUD de profissionais

### Fase 2
- Templates de propostas
- Histórico e versionamento
- Comparação entre propostas
- Dashboard analytics

### Fase 3
- Machine Learning para melhorar estimativas
- Integração com CRM
- Workflow de aprovação
- API para integrações externas

## 📈 Fórmulas e Cálculos

### Cálculo de Custo Total
```
Custo_Base = Horas_Totais × Custo_Hora
Custo_Com_Impostos = Custo_Base × (1 + Taxa_Imposto)
Custo_Com_SGA = Custo_Com_Impostos × (1 + Taxa_SGA)
Custo_Final = Custo_Com_SGA
```

### Cálculo de Preço
```
Preço = Custo_Final / (1 - Margem)
```

### Exemplo:
- 1000 horas × R$ 100/hora = R$ 100.000
- Com imposto (21%): R$ 121.000
- Com SG&A (10%): R$ 133.100
- Com margem (25%): R$ 177.467

## 🔒 Segurança e Compliance

- Autenticação JWT
- Criptografia de dados sensíveis
- Logs de auditoria
- Backup automático
- LGPD compliance

## 📝 Instruções para Claude Code

### Para gerar o Frontend:
```
Crie uma aplicação React com TypeScript que:
1. Tenha uma interface de upload drag-and-drop
2. Mostre progress bar durante processamento
3. Use Tailwind CSS para estilização
4. Implemente formulários para configurar parâmetros
5. Tenha visualização de Excel inline
6. Use react-query para gerenciamento de estado
```

### Para gerar o Backend:
```
Crie uma API REST em Node.js que:
1. Aceite uploads de múltiplos arquivos
2. Integre com API do Claude usando Anthropic SDK
3. Use ExcelJS para gerar planilhas
4. Implemente autenticação com JWT
5. Use PostgreSQL com Prisma ORM
6. Tenha tratamento robusto de erros
```

### Para gerar os Prompts:
```
Crie prompts otimizados que:
1. Extraiam informações estruturadas dos documentos
2. Usem few-shot learning com exemplos
3. Retornem sempre JSON válido
4. Sejam específicos para cada tipo de análise
5. Incluam validações e tratamento de edge cases
```

## 🚀 Deploy e Infraestrutura

### Opção 1: Cloud (AWS/GCP/Azure)
- Frontend: S3 + CloudFront / Cloud Storage + CDN
- Backend: ECS/Cloud Run/Container Instances
- Database: RDS/Cloud SQL/Azure Database
- Files: S3/Cloud Storage/Blob Storage

### Opção 2: On-Premise
- Docker Compose para desenvolvimento
- Kubernetes para produção
- PostgreSQL dedicado
- Nginx como reverse proxy

## 📚 Bibliotecas Recomendadas

### Frontend
- React 18+
- TypeScript 5+
- Tailwind CSS
- React Query
- React Hook Form
- Recharts (gráficos)
- React-Dropzone
- SheetJS (preview Excel)

### Backend
- Express.js
- TypeScript
- Anthropic SDK
- ExcelJS
- Multer (upload)
- pdf-parse
- Tesseract.js
- Prisma ORM
- Joi (validação)
- Winston (logs)

## 🎯 Métricas de Sucesso

- Redução de 70% no tempo de criação de propostas
- Precisão de 85% nas estimativas de esforço
- Satisfação do usuário > 4.5/5
- Tempo de processamento < 2 minutos
- Zero erros em cálculos financeiros

## 🔄 Próximos Passos

1. **Semana 1-2**: Setup do ambiente e estrutura base
2. **Semana 3-4**: Implementação do upload e extração
3. **Semana 5-6**: Integração com Claude AI
4. **Semana 7-8**: Geração de Excel e cálculos
5. **Semana 9-10**: Interface de usuário completa
6. **Semana 11-12**: Testes e refinamentos

---

## 💡 Notas para Implementação no Claude Code

Ao usar este documento no Claude Code, peça para:

1. **Começar pelo backend** - estabelecer as APIs primeiro
2. **Criar mocks de dados** - para testar sem Claude inicialmente
3. **Implementar incrementalmente** - uma funcionalidade por vez
4. **Priorizar o fluxo principal** - upload → análise → geração
5. **Adicionar testes** - unitários e de integração
6. **Documentar APIs** - usando Swagger/OpenAPI
7. **Versionar código** - com commits semânticos

Este plano fornece uma base sólida para desenvolver a aplicação de pré-venda com IA. Ajuste conforme necessário baseado em feedback e requisitos específicos do negócio.