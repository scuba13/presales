# Plano de Implementação - Sistema de Pré-Venda com IA

## Status do Projeto
- **Início**: 2025-11-07
- **Última Atualização**: 2025-11-07
- **Progresso Geral**: Fase 1 ✅ | Fase 2 ✅ | Fase 3 (parcial - 3/6 concluídas)

---

## FASE 1: Fundação e Backend Core (Semanas 1-4)

### 1.0 Setup Docker (PRIORIDADE MÁXIMA)
- [x] Criar `docker-compose.yml` na raiz com:
  - PostgreSQL (versão 15)
  - pgAdmin (interface web para gerenciar PostgreSQL)
  - Backend (Node.js)
  - Frontend (React + Vite)
- [x] Criar rede Docker customizada
- [x] Configurar volumes persistentes para:
  - Dados do PostgreSQL
  - Uploads de arquivos
  - node_modules (para melhor performance)
- [x] Criar `.env` com variáveis de ambiente
- [ ] Testar: `docker-compose up -d` (será testado após criar os Dockerfiles)

**Arquivo docker-compose.yml**:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: presales_postgres
    environment:
      POSTGRES_DB: ${DATABASE_NAME:-presales}
      POSTGRES_USER: ${DATABASE_USER:-postgres}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD:-postgres123}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - presales_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: presales_pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL:-admin@presales.com}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD:-admin123}
    ports:
      - "5050:80"
    depends_on:
      - postgres
    networks:
      - presales_network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: presales_backend
    environment:
      NODE_ENV: development
      PORT: 3001
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_USER: ${DATABASE_USER:-postgres}
      DATABASE_PASSWORD: ${DATABASE_PASSWORD:-postgres123}
      DATABASE_NAME: ${DATABASE_NAME:-presales}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      JWT_SECRET: ${JWT_SECRET:-your_jwt_secret_change_in_production}
    ports:
      - "3001:3001"
    volumes:
      - ./backend:/app
      - /app/node_modules
      - backend_uploads:/app/uploads
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - presales_network
    command: npm run dev

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: presales_frontend
    environment:
      VITE_API_URL: http://localhost:3001/api
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    networks:
      - presales_network
    command: npm run dev

volumes:
  postgres_data:
  backend_uploads:

networks:
  presales_network:
    driver: bridge
```

**Arquivo .env.example**:
```env
# Database
DATABASE_NAME=presales
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres123

# pgAdmin
PGADMIN_EMAIL=admin@presales.com
PGADMIN_PASSWORD=admin123

# Backend
PORT=3001
JWT_SECRET=your_jwt_secret_change_in_production
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Frontend
VITE_API_URL=http://localhost:3001/api
```

---

### 1.1 Setup Inicial do Projeto
- [x] Criar estrutura de diretórios:
  ```
  presales/
  ├── frontend/
  ├── backend/
  ├── docker-compose.yml
  ├── .env
  └── .env.example
  ```
- [x] Inicializar repositório Git (se ainda não feito)
- [x] Criar `.gitignore` para Node.js, TypeScript, Docker e arquivos sensíveis:
  ```
  node_modules/
  dist/
  .env
  .env.local
  *.log
  uploads/
  .DS_Store
  ```
- [x] Criar `README.md` com instruções de setup usando Docker

**Comandos**:
```bash
mkdir -p frontend backend
touch docker-compose.yml .env.example
cp .env.example .env
```

---

### 1.2 Configurar Backend: Node.js + Express + TypeScript (com Docker)
- [x] Criar `backend/Dockerfile.dev` para desenvolvimento:
  ```dockerfile
  FROM node:18-alpine

  WORKDIR /app

  # Instalar dependências do sistema para Tesseract OCR
  RUN apk add --no-cache \
      tesseract-ocr \
      tesseract-ocr-data-por \
      tesseract-ocr-data-eng

  # Copiar package.json e package-lock.json
  COPY package*.json ./

  # Instalar dependências
  RUN npm install

  # Copiar código fonte
  COPY . .

  # Expor porta
  EXPOSE 3001

  # Comando padrão (pode ser sobrescrito no docker-compose)
  CMD ["npm", "run", "dev"]
  ```

- [x] Criar `backend/Dockerfile` para produção:
  ```dockerfile
  FROM node:18-alpine AS builder

  WORKDIR /app

  # Instalar dependências
  COPY package*.json ./
  RUN npm ci --only=production

  # Copiar código e compilar TypeScript
  COPY . .
  RUN npm run build

  # Imagem final
  FROM node:18-alpine

  WORKDIR /app

  # Instalar Tesseract
  RUN apk add --no-cache \
      tesseract-ocr \
      tesseract-ocr-data-por \
      tesseract-ocr-data-eng

  # Copiar node_modules e código compilado
  COPY --from=builder /app/node_modules ./node_modules
  COPY --from=builder /app/dist ./dist
  COPY --from=builder /app/package*.json ./

  EXPOSE 3001

  CMD ["npm", "start"]
  ```

- [x] Criar `backend/.dockerignore`:
  ```
  node_modules
  dist
  .env
  *.log
  uploads
  .git
  ```

- [x] Inicializar projeto Node.js no diretório `backend/`
- [x] Instalar dependências principais:
  ```bash
  npm install express cors dotenv
  npm install -D typescript @types/node @types/express @types/cors ts-node-dev nodemon
  ```
- [x] Criar `tsconfig.json` com configurações:
  ```json
  {
    "compilerOptions": {
      "target": "ES2020",
      "module": "commonjs",
      "outDir": "./dist",
      "rootDir": "./src",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "experimentalDecorators": true,
      "emitDecoratorMetadata": true
    }
  }
  ```
- [x] Criar estrutura de diretórios:
  ```
  backend/src/
  ├── controllers/
  ├── services/
  ├── entities/
  ├── routes/
  ├── middleware/
  ├── utils/
  ├── config/
  └── index.ts
  ```
- [x] Configurar `package.json` scripts:
  ```json
  {
    "scripts": {
      "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
      "build": "tsc",
      "start": "node dist/index.js"
    }
  }
  ```
- [x] Criar arquivo `.env.example` com variáveis necessárias:
  ```
  PORT=3001
  DATABASE_HOST=localhost
  DATABASE_PORT=5432
  DATABASE_USER=postgres
  DATABASE_PASSWORD=postgres
  DATABASE_NAME=presales
  ANTHROPIC_API_KEY=your_api_key_here
  JWT_SECRET=your_jwt_secret
  ```
- [x] Criar servidor Express básico em `src/index.ts`

**Arquivos Criados**: `backend/package.json`, `backend/tsconfig.json`, `backend/.env`, `backend/src/index.ts`

---

### 1.3 Configurar TypeORM (PostgreSQL já está no Docker)
- [x] Instalar TypeORM e dependências:
  ```bash
  npm install typeorm pg reflect-metadata
  ```
- [x] Criar arquivo de configuração `src/config/database.ts`:
  ```typescript
  import { DataSource } from "typeorm";

  export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DATABASE_HOST || "postgres", // nome do serviço Docker
    port: parseInt(process.env.DATABASE_PORT || "5432"),
    username: process.env.DATABASE_USER || "postgres",
    password: process.env.DATABASE_PASSWORD || "postgres123",
    database: process.env.DATABASE_NAME || "presales",
    synchronize: false, // usar migrations em produção
    logging: true,
    entities: ["src/entities/**/*.ts"],
    migrations: ["src/migrations/**/*.ts"],
    subscribers: []
  });
  ```
- [x] Inicializar TypeORM no `src/index.ts`
- [ ] Testar conexão com banco de dados (após subir o Docker):
  ```bash
  docker-compose up -d postgres
  docker-compose logs -f backend
  ```
- [ ] Acessar pgAdmin em `http://localhost:5050` para visualizar o banco

**Arquivos Criados**: `backend/src/config/database.ts`

---

### 1.4 Criar Entities do TypeORM
- [x] **Entity: Professional**
  ```typescript
  @Entity("professionals")
  export class Professional {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    name: string;

    @Column()
    role: string; // "Tech Lead", "Backend Dev", etc

    @Column("decimal", { precision: 10, scale: 2 })
    hourlyCost: number;

    @Column()
    seniority: string; // "Junior", "Pleno", "Senior"

    @Column("simple-array")
    skills: string[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
  }
  ```
- [x] **Entity: Proposal**
  ```typescript
  @Entity("proposals")
  export class Proposal {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    clientName: string;

    @Column()
    projectName: string;

    @Column("text", { nullable: true })
    description: string;

    @Column()
    status: string; // "draft", "generated", "sent", "approved"

    @Column("decimal", { precision: 12, scale: 2 })
    totalCost: number;

    @Column("decimal", { precision: 12, scale: 2 })
    totalPrice: number;

    @Column("int")
    durationMonths: number;

    @Column("text", { nullable: true })
    excelFilePath: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => ProposalResource, resource => resource.proposal)
    resources: ProposalResource[];
  }
  ```
- [x] **Entity: ProposalResource**
  ```typescript
  @Entity("proposal_resources")
  export class ProposalResource {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => Proposal, proposal => proposal.resources)
    proposal: Proposal;

    @ManyToOne(() => Professional)
    professional: Professional;

    @Column("simple-array")
    hoursPerMonth: number[]; // [160, 160, 80, ...] - M1 a M10

    @Column("int")
    totalHours: number;

    @Column("decimal", { precision: 12, scale: 2 })
    cost: number;

    @Column("decimal", { precision: 12, scale: 2 })
    price: number;
  }
  ```
- [x] **Entity: Parameter**
  ```typescript
  @Entity("parameters")
  export class Parameter {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ unique: true })
    name: string; // "tax", "sga", "margin"

    @Column("decimal", { precision: 5, scale: 4 })
    value: number; // 0.21, 0.10, 0.25

    @Column()
    type: string; // "percentage"

    @UpdateDateColumn()
    updatedAt: Date;
  }
  ```
- [x] **Entity: Template**
  ```typescript
  @Entity("templates")
  export class Template {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    name: string;

    @Column("jsonb")
    teamComposition: object; // { "Tech Lead": 1, "Backend Dev": 2, ... }

    @Column("int")
    typicalDuration: number; // meses

    @Column("text", { nullable: true })
    description: string;
  }
  ```
- [x] Criar entities (migrations serão geradas automaticamente pelo TypeORM)
- [ ] Executar migrations após subir o Docker: `docker-compose exec backend npm run typeorm migration:run`

**Arquivos Criados**: `backend/src/entities/*.ts`, `backend/src/migrations/*.ts`

---

### 1.5 Seed de Dados Iniciais
- [x] Criar script `src/seeds/initial-data.ts` para popular:
  - **Profissionais padrão** com custos/hora:
    - Tech Lead: R$ 110.12
    - Backend Dev: R$ 98.21
    - Frontend Dev: R$ 98.21
    - UX Designer: R$ 59.52
    - Arquiteto: R$ 148.81
    - Product Owner: R$ 77.38
    - DevOps: R$ 95.24
    - QA: R$ 44.64
  - **Parâmetros padrão**:
    - tax: 0.21 (21%)
    - sga: 0.10 (10%)
    - margin: 0.25 (25%)
- [x] Script de seed criado
- [ ] Executar seed após subir o Docker: `docker-compose exec backend npm run seed`

**Arquivos Criados**: `backend/src/seeds/initial-data.ts`

---

### 1.6 API de Upload de Documentos
- [ ] Instalar Multer para upload:
  ```bash
  npm install multer
  npm install -D @types/multer
  ```
- [ ] Criar configuração Multer em `src/config/multer.ts`:
  - Definir pasta de destino: `uploads/`
  - Validar tipos permitidos: PDF, DOCX, PNG, JPG, TXT
  - Limite de tamanho: 10MB por arquivo
- [ ] Criar controller `src/controllers/DocumentController.ts`:
  - Método `upload(req, res)` - aceita múltiplos arquivos
  - Retorna IDs dos arquivos processados
- [ ] Criar rota `POST /api/documents/upload`
- [ ] Testar upload via Postman/Insomnia

**Arquivos Criados**: `backend/src/config/multer.ts`, `backend/src/controllers/DocumentController.ts`, `backend/src/routes/documents.ts`

---

### 1.7 Serviço de Extração de Texto
- [ ] Instalar dependências:
  ```bash
  npm install pdf-parse tesseract.js mammoth
  ```
- [ ] Criar `src/services/DocumentService.ts` com métodos:
  - `extractTextFromPDF(filePath: string): Promise<string>`
  - `extractTextFromImage(filePath: string): Promise<string>` (OCR com Tesseract)
  - `extractTextFromDocx(filePath: string): Promise<string>` (usando mammoth)
  - `processDocument(filePath: string, mimeType: string): Promise<string>` (router)
- [ ] Adicionar tratamento de erros para arquivos corrompidos
- [ ] Criar testes unitários para cada método
- [ ] Integrar com `DocumentController` para processar após upload

**Arquivos Criados**: `backend/src/services/DocumentService.ts`

---

## FASE 2: Integração IA e Lógica de Negócio (Semanas 5-6)

### 2.1 Setup Anthropic SDK ✅
- [x] Instalar SDK:
  ```bash
  npm install @anthropic-ai/sdk
  ```
- [x] Adicionar `ANTHROPIC_API_KEY` no `.env`
- [x] Criar `src/services/ClaudeService.ts` com inicialização do client
- [x] Testar conexão com API (fazer chamada simples)

**Arquivos Criados**: `backend/src/services/ClaudeService.ts`

---

### 2.2 Implementar Prompts Especializados do Claude ✅
- [x] **Prompt 1: Análise Inicial**
  - Método: `analyzeProjectScope(documentText: string): Promise<ProjectAnalysis>`
  - Input: texto extraído dos documentos
  - Output esperado (JSON):
    ```typescript
    interface ProjectAnalysis {
      scope: string;
      coreFunctionalities: string[];
      integrations: string[];
      nonFunctionalRequirements: string[];
      complexity: "low" | "medium" | "high";
      risks: string[];
    }
    ```
  - Salvar prompt em `src/prompts/analysis-prompt.ts`

- [x] **Prompt 2: Estimativa de Equipe**
  - Método: `estimateTeam(analysis: ProjectAnalysis): Promise<TeamEstimation>`
  - Output esperado:
    ```typescript
    interface TeamEstimation {
      teamComposition: { role: string; quantity: number }[];
      monthlyAllocation: { role: string; hoursPerMonth: number[] }[];
      projectDuration: number; // meses
      phases: { name: string; effortPercentage: number }[];
    }
    ```
  - Salvar prompt em `src/prompts/team-estimation-prompt.ts`

- [x] **Prompt 3: Geração de Cronograma**
  - Método: `generateSchedule(teamEstimation: TeamEstimation): Promise<Schedule>`
  - Output esperado:
    ```typescript
    interface Schedule {
      sprints: { number: number; deliverables: string[] }[];
      dependencies: { task: string; dependsOn: string[] }[];
      milestones: { name: string; date: string }[];
      riskBuffer: number; // dias
    }
    ```
  - Salvar prompt em `src/prompts/schedule-prompt.ts`

- [x] Criar método orquestrador:
  ```typescript
  async analyzeComplete(documentText: string): Promise<CompleteAnalysis> {
    const analysis = await this.analyzeProjectScope(documentText);
    const teamEstimation = await this.estimateTeam(analysis);
    const schedule = await this.generateSchedule(teamEstimation);
    return { analysis, teamEstimation, schedule };
  }
  ```

- [x] Adicionar validação de resposta JSON do Claude
- [x] Implementar retry logic para falhas de API
- [x] Adicionar logs detalhados das chamadas

**Arquivos Criados**: `backend/src/prompts/*.ts`, atualização de `ClaudeService.ts`

---

### 2.3 Engine de Cálculo de Custos ✅
- [x] Criar `src/utils/calculations.ts` com funções puras:
  ```typescript
  // Fórmulas conforme especificação
  export function calculateBaseCost(totalHours: number, hourlyCost: number): number {
    return totalHours * hourlyCost;
  }

  export function applyTax(baseCost: number, taxRate: number): number {
    return baseCost * (1 + taxRate);
  }

  export function applySGA(costWithTax: number, sgaRate: number): number {
    return costWithTax * (1 + sgaRate);
  }

  export function calculatePrice(finalCost: number, marginRate: number): number {
    return finalCost / (1 - marginRate);
  }

  export function calculateFullCostAndPrice(
    totalHours: number,
    hourlyCost: number,
    taxRate: number,
    sgaRate: number,
    marginRate: number
  ): { cost: number; price: number } {
    const baseCost = calculateBaseCost(totalHours, hourlyCost);
    const withTax = applyTax(baseCost, taxRate);
    const finalCost = applySGA(withTax, sgaRate);
    const price = calculatePrice(finalCost, marginRate);
    return { cost: finalCost, price };
  }
  ```
- [x] Criar testes unitários para cada fórmula com casos de teste:
  - Exemplo do plano: 1000h × R$100 = R$177.467 final
  - Casos extremos: 0 horas, valores negativos (deve rejeitar)
  - Precisão decimal
- [x] Adicionar validações de input

**Arquivos Criados**: `backend/src/utils/calculations.ts`, `backend/tests/calculations.test.ts`

---

### 2.4 Serviço de Cálculo de Proposta ✅
- [x] Criar `src/services/ProposalService.ts`:
  - Método `generateProposal()` orquestra todo o fluxo
  - Para cada recurso:
    - Somar horas mensais
    - Buscar custo/hora do profissional
    - Aplicar fórmulas de cálculo
  - Calcular totais gerais
  - Retornar estrutura completa para Excel
- [x] Integrar com entities TypeORM (buscar profissionais e parâmetros do DB)
- [x] Adicionar logs de auditoria das operações

**Arquivos Criados**: `backend/src/services/ProposalCalculationService.ts`

---

## FASE 3: Geração de Excel e APIs (Semanas 7-8)

### 3.1 Serviço de Geração de Excel ✅
- [x] Instalar ExcelJS:
  ```bash
  npm install exceljs
  npm install -D @types/exceljs
  ```
- [x] Criar `src/services/ExcelService.ts` com método principal:
  ```typescript
  async generateProposal(proposalData: ProposalData): Promise<string>
  ```
- [x] **Implementar Aba 1: "Custo Solução e Sustentação"**
  - [x] Criar headers: Recurso | M1-M10 | Total | Custo/Hora | Imposto | SG&A | Margem | Custo | Preço
  - [x] Adicionar seção "Desenvolvimento" (linhas de recursos)
  - [x] Adicionar seção "Sustentação" (M8-M10)
  - [x] Aplicar formatação:
    - Headers em negrito, fundo azul
    - Valores monetários: R$ #,##0.00
    - Bordas nas células
    - Larguras de coluna ajustadas
  - [x] Adicionar linha de TOTAL no final

- [x] **Implementar Aba 2: "Cronograma"**
  - [x] Criar estrutura com sprints e milestones
  - [x] Colunas: Sprint/Fase | Descrição/Deliverables | Status
  - [x] Seções para:
    - Marcos principais (milestones)
    - Sprints e entregas
    - Dependências
  - [x] Adicionar buffer de risco
  - [x] Formatação com cores e bordas

- [x] Salvar arquivo em `uploads/proposals/` com nome único
- [x] Retornar caminho do arquivo

**Arquivos Criados**: `backend/src/services/ExcelService.ts`

---

### 3.2 Controller e API de Geração de Proposta ✅
- [x] Criar `src/controllers/ProposalController.ts`
- [x] Implementar endpoint `POST /api/proposals/generate`:
  - Input: `{ files: File[], clientName: string, projectName: string, description?: string }`
  - Fluxo:
    1. Upload de arquivos (Multer)
    2. Análise completa com Claude (ClaudeService) - **documentos enviados diretamente**
    3. Cálculo de custos (ProposalService integrado)
    4. Geração de Excel (ExcelService)
    5. Salvar proposta no DB (TypeORM)
    6. Retornar: `{ id, clientName, projectName, totalCost, totalPrice, excelDownloadUrl }`
- [x] Adicionar validações de input
- [x] Tratamento de erros em cada etapa
- [x] Logs detalhados do processo

**Arquivos Criados**: `backend/src/controllers/ProposalController.ts`, `backend/src/routes/proposals.ts`

---

### 3.3 APIs CRUD - Profissionais
- [ ] Criar `src/controllers/ProfessionalController.ts`
- [ ] Implementar endpoints:
  - `GET /api/professionals` - listar todos
  - `GET /api/professionals/:id` - buscar por ID
  - `POST /api/professionals` - criar novo
  - `PUT /api/professionals/:id` - atualizar
  - `DELETE /api/professionals/:id` - deletar
- [ ] Adicionar validação com Joi ou Zod:
  ```typescript
  const professionalSchema = {
    name: string().required(),
    role: string().required(),
    hourlyCost: number().min(0).required(),
    seniority: string().valid("Junior", "Pleno", "Senior"),
    skills: array().items(string())
  }
  ```
- [ ] Criar rotas em `src/routes/professionals.ts`

**Arquivos Criados**: `backend/src/controllers/ProfessionalController.ts`, `backend/src/routes/professionals.ts`

---

### 3.4 APIs CRUD - Parâmetros
- [ ] Criar `src/controllers/ParameterController.ts`
- [ ] Implementar endpoints:
  - `GET /api/parameters` - listar todos (tax, sga, margin)
  - `PUT /api/parameters/:name` - atualizar valor
- [ ] Validar que valores são percentuais (0 a 1)
- [ ] Criar rotas em `src/routes/parameters.ts`

**Arquivos Criados**: `backend/src/controllers/ParameterController.ts`, `backend/src/routes/parameters.ts`

---

### 3.5 APIs - Histórico de Propostas ✅
- [x] Adicionar métodos em `ProposalController`:
  - `GET /api/proposals` - listar com filtros (cliente, status, limit, offset)
  - `GET /api/proposals/:id` - detalhes completos
  - `GET /api/proposals/:id/download` - download do Excel
  - `DELETE /api/proposals/:id` - deletar
- [x] Implementar paginação (limit, offset)
- [x] Adicionar ordenação (createdAt DESC)

**Arquivos Atualizados**: `backend/src/controllers/ProposalController.ts`, `backend/src/routes/proposals.ts`

---

### 3.6 Autenticação JWT
- [ ] Instalar dependências:
  ```bash
  npm install jsonwebtoken bcrypt
  npm install -D @types/jsonwebtoken @types/bcrypt
  ```
- [ ] Criar Entity `User`:
  ```typescript
  @Entity("users")
  export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string; // hash

    @Column()
    name: string;

    @CreateDateColumn()
    createdAt: Date;
  }
  ```
- [ ] Criar `src/controllers/AuthController.ts`:
  - `POST /api/auth/register` - criar usuário
  - `POST /api/auth/login` - retorna JWT token
- [ ] Criar middleware `src/middleware/auth.ts`:
  - Validar token em header Authorization
  - Adicionar user no `req.user`
- [ ] Proteger rotas sensíveis (todas exceto login/register)

**Arquivos Criados**: `backend/src/entities/User.ts`, `backend/src/controllers/AuthController.ts`, `backend/src/middleware/auth.ts`

---

### 3.7 Documentação Swagger
- [ ] Instalar Swagger:
  ```bash
  npm install swagger-ui-express swagger-jsdoc
  npm install -D @types/swagger-ui-express
  ```
- [ ] Criar `src/config/swagger.ts` com definições OpenAPI
- [ ] Documentar cada endpoint com JSDoc:
  ```typescript
  /**
   * @swagger
   * /api/professionals:
   *   get:
   *     summary: Lista todos os profissionais
   *     tags: [Professionals]
   *     responses:
   *       200:
   *         description: Lista de profissionais
   */
  ```
- [ ] Disponibilizar em `/api-docs`

**Arquivos Criados**: `backend/src/config/swagger.ts`

---

## FASE 4: Frontend (Semanas 9-10)

### 4.1 Setup React + TypeScript + Tailwind (com Docker)
- [ ] Criar `frontend/Dockerfile.dev`:
  ```dockerfile
  FROM node:18-alpine

  WORKDIR /app

  # Copiar package.json
  COPY package*.json ./

  # Instalar dependências
  RUN npm install

  # Copiar código fonte
  COPY . .

  # Expor porta do Vite
  EXPOSE 5173

  # Comando padrão
  CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
  ```

- [ ] Criar `frontend/Dockerfile` para produção:
  ```dockerfile
  FROM node:18-alpine AS builder

  WORKDIR /app

  COPY package*.json ./
  RUN npm ci

  COPY . .
  RUN npm run build

  # Nginx para servir build
  FROM nginx:alpine

  COPY --from=builder /app/dist /usr/share/nginx/html
  COPY nginx.conf /etc/nginx/conf.d/default.conf

  EXPOSE 80

  CMD ["nginx", "-g", "daemon off;"]
  ```

- [ ] Criar `frontend/.dockerignore`:
  ```
  node_modules
  dist
  .env
  *.log
  .git
  ```

- [ ] Criar projeto React com Vite:
  ```bash
  cd frontend
  npm create vite@latest . -- --template react-ts
  npm install
  ```
- [ ] Instalar Tailwind CSS:
  ```bash
  npm install -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p
  ```
- [ ] Configurar `tailwind.config.js`:
  ```javascript
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]
  ```
- [ ] Adicionar diretivas Tailwind em `src/index.css`
- [ ] Instalar dependências principais:
  ```bash
  npm install @tanstack/react-query axios react-router-dom
  npm install react-hook-form @hookform/resolvers zod
  npm install react-dropzone recharts
  npm install react-hot-toast lucide-react
  ```
- [ ] Criar estrutura de pastas:
  ```
  src/
  ├── components/
  ├── pages/
  ├── services/
  ├── hooks/
  ├── utils/
  ├── types/
  └── App.tsx
  ```
- [ ] Configurar React Query Provider
- [ ] Configurar React Router
- [ ] Testar build: `npm run build`

**Arquivos Criados**: `frontend/package.json`, `frontend/tailwind.config.js`, `frontend/src/App.tsx`

---

### 4.2 Serviço API Client
- [ ] Criar `src/services/api.ts`:
  ```typescript
  import axios from 'axios';

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  });

  // Interceptor para adicionar token
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  export default api;
  ```
- [ ] Criar funções para cada endpoint:
  - `uploadDocuments(files: File[])`
  - `generateProposal(data)`
  - `getProposals(filters?)`
  - `getProfessionals()`
  - `updateProfessional(id, data)`
  - etc.

**Arquivos Criados**: `frontend/src/services/api.ts`

---

### 4.3 Autenticação - Login/Register
- [ ] Criar `src/pages/Login.tsx` com formulário
- [ ] Criar `src/pages/Register.tsx`
- [ ] Implementar context `src/contexts/AuthContext.tsx`:
  - Estado: `user`, `token`, `isAuthenticated`
  - Métodos: `login()`, `logout()`, `register()`
- [ ] Criar componente `PrivateRoute` para proteger rotas
- [ ] Configurar rotas no `App.tsx`:
  ```typescript
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
    ...
  </Routes>
  ```

**Arquivos Criados**: `frontend/src/pages/Login.tsx`, `frontend/src/pages/Register.tsx`, `frontend/src/contexts/AuthContext.tsx`

---

### 4.4 Dashboard Principal
- [ ] Criar `src/pages/Dashboard.tsx`
- [ ] Componentes do Dashboard:
  - [ ] **Header**: Logo, nome do usuário, botão logout
  - [ ] **Stats Cards**:
    - Total de propostas geradas
    - Valor total (soma de preços)
    - Proposta média
    - Taxa de conversão (se houver)
  - [ ] **Botão "Nova Proposta"** (destaque, chama para ação)
  - [ ] **Tabela de Propostas Recentes**:
    - Colunas: Cliente | Projeto | Data | Valor | Status | Ações
    - Ações: Visualizar, Download Excel, Deletar
    - Paginação
  - [ ] **Filtros**:
    - Por cliente (input text)
    - Por status (dropdown)
    - Por data (date range)
- [ ] Integrar com React Query para buscar propostas
- [ ] Adicionar loading states e error handling

**Arquivos Criados**: `frontend/src/pages/Dashboard.tsx`, `frontend/src/components/Dashboard/*.tsx`

---

### 4.5 Componente de Upload (Nova Proposta)
- [ ] Criar `src/pages/NewProposal.tsx`
- [ ] Usar `react-dropzone` para área de upload:
  ```typescript
  const { getRootProps, getInputProps, acceptedFiles } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'text/plain': ['.txt']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: handleDrop
  });
  ```
- [ ] Componentes:
  - [ ] **Dropzone visual** (área tracejada, ícone de upload)
  - [ ] **Lista de arquivos selecionados** com preview e botão remover
  - [ ] **Formulário**:
    - Nome do cliente (input)
    - Nome do projeto (input)
    - Descrição opcional (textarea)
  - [ ] **Progress Bar** durante upload e processamento
  - [ ] **Botão "Gerar Proposta"**
- [ ] Estados:
  - `idle` - inicial
  - `uploading` - fazendo upload
  - `analyzing` - Claude analisando
  - `generating` - gerando Excel
  - `success` - concluído
  - `error` - erro
- [ ] Ao concluir, redirecionar para página de visualização

**Arquivos Criados**: `frontend/src/pages/NewProposal.tsx`, `frontend/src/components/Upload/*.tsx`

---

### 4.6 Visualizador de Proposta
- [ ] Criar `src/pages/ProposalView.tsx` (rota: `/proposals/:id`)
- [ ] Buscar dados da proposta via API
- [ ] Componentes:
  - [ ] **Header**: Cliente, Projeto, Data de criação
  - [ ] **Resumo Executivo**:
    - Duração total: X meses
    - Custo total: R$ X
    - Preço total: R$ X
    - Margem aplicada: 25%
  - [ ] **Gráfico de Distribuição de Custos** (Pizza - Recharts):
    - Por perfil profissional
  - [ ] **Gráfico de Alocação Mensal** (Barras empilhadas):
    - Eixo X: Meses (M1-M10)
    - Eixo Y: Horas
    - Séries: Cada perfil
  - [ ] **Preview do Excel** (usando SheetJS ou iframe):
    - Tabs: "Custo Solução" e "Cronograma"
    - Permitir edição inline (opcional)
  - [ ] **Timeline do Cronograma** visual
  - [ ] **Botões de ação**:
    - Download Excel
    - Editar (redirecionar para modo edição)
    - Deletar
    - Voltar ao Dashboard

**Arquivos Criados**: `frontend/src/pages/ProposalView.tsx`, `frontend/src/components/ProposalView/*.tsx`

---

### 4.7 Página de Configurações
- [ ] Criar `src/pages/Settings.tsx` com tabs:
  - [ ] **Tab 1: Profissionais**
    - Tabela editável com colunas: Nome | Cargo | Custo/Hora | Senioridade | Ações
    - Inline editing ou modal
    - Botão "Adicionar Profissional"
    - Validação: custo/hora > 0
  - [ ] **Tab 2: Parâmetros Financeiros**
    - Sliders ou inputs para:
      - Imposto (%) - default 21%
      - SG&A (%) - default 10%
      - Margem (%) - default 25%
    - Mostrar impacto no cálculo em tempo real (exemplo)
  - [ ] **Tab 3: Templates** (opcional, futuro):
    - Equipes pré-definidas
- [ ] Salvar alterações via API
- [ ] Toast de confirmação ao salvar

**Arquivos Criados**: `frontend/src/pages/Settings.tsx`, `frontend/src/components/Settings/*.tsx`

---

### 4.8 Componentes Compartilhados
- [ ] Criar componentes reutilizáveis:
  - [ ] `Button.tsx` - botão customizado com variantes
  - [ ] `Input.tsx` - input com label e validação
  - [ ] `Card.tsx` - container com sombra
  - [ ] `Table.tsx` - tabela responsiva
  - [ ] `Modal.tsx` - modal genérico
  - [ ] `LoadingSpinner.tsx`
  - [ ] `ErrorMessage.tsx`
  - [ ] `Toast.tsx` (ou usar react-hot-toast)

**Arquivos Criados**: `frontend/src/components/ui/*.tsx`

---

## FASE 5: Integração, Testes e Deploy (Semanas 11-12)

### 5.1 Integração Frontend ↔ Backend
- [ ] Configurar CORS no backend para permitir origem do frontend
- [ ] Testar todas as rotas:
  - [ ] Login/Register
  - [ ] Upload de documentos
  - [ ] Geração de proposta completa
  - [ ] Listagem de propostas
  - [ ] CRUD de profissionais
  - [ ] Atualização de parâmetros
  - [ ] Download de Excel
- [ ] Ajustar tipos TypeScript (interfaces compartilhadas)
- [ ] Tratamento de erros:
  - Mensagens amigáveis no frontend
  - Logs detalhados no backend
- [ ] Loading states em todas as operações assíncronas

**Status**: [ ] Integração completa e funcional

---

### 5.2 Testes Backend
- [ ] Instalar Jest e Supertest:
  ```bash
  npm install -D jest ts-jest @types/jest supertest @types/supertest
  ```
- [ ] Configurar Jest em `jest.config.js`
- [ ] **Testes Unitários**:
  - [ ] `calculations.test.ts` - todas as fórmulas de custo
  - [ ] `DocumentService.test.ts` - extração de texto
  - [ ] `ProposalCalculationService.test.ts`
- [ ] **Testes de Integração**:
  - [ ] Fluxo completo: upload → análise → geração
  - [ ] CRUD endpoints
  - [ ] Autenticação JWT
- [ ] **Testes de API**:
  - [ ] Validar formato de resposta do Claude (mock)
  - [ ] Validar estrutura do Excel gerado
- [ ] Atingir cobertura mínima: 70%

**Arquivos Criados**: `backend/tests/**/*.test.ts`, `backend/jest.config.js`

---

### 5.3 Testes Frontend
- [ ] Instalar Vitest e Testing Library:
  ```bash
  npm install -D vitest @testing-library/react @testing-library/jest-dom
  ```
- [ ] **Testes de Componentes**:
  - [ ] Upload component (drag-and-drop)
  - [ ] Dashboard (renderização de propostas)
  - [ ] Forms (validação)
- [ ] **Testes E2E** (opcional - Playwright):
  - [ ] Fluxo: Login → Nova Proposta → Upload → Visualizar
- [ ] Atingir cobertura mínima: 60%

**Arquivos Criados**: `frontend/tests/**/*.test.tsx`, `frontend/vitest.config.ts`

---

### 5.4 Docker Compose para Produção
- [ ] Criar `docker-compose.prod.yml` para produção:
  ```yaml
  version: '3.8'
  services:
    postgres:
      image: postgres:15-alpine
      environment:
        POSTGRES_DB: ${DATABASE_NAME}
        POSTGRES_USER: ${DATABASE_USER}
        POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
      volumes:
        - postgres_data:/var/lib/postgresql/data
      networks:
        - presales_network
      restart: unless-stopped

    backend:
      build:
        context: ./backend
        dockerfile: Dockerfile
      environment:
        NODE_ENV: production
        DATABASE_HOST: postgres
        DATABASE_PORT: 5432
        DATABASE_USER: ${DATABASE_USER}
        DATABASE_PASSWORD: ${DATABASE_PASSWORD}
        DATABASE_NAME: ${DATABASE_NAME}
        ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
        JWT_SECRET: ${JWT_SECRET}
      depends_on:
        - postgres
      networks:
        - presales_network
      volumes:
        - backend_uploads:/app/uploads
      restart: unless-stopped

    frontend:
      build:
        context: ./frontend
        dockerfile: Dockerfile
      ports:
        - "80:80"
      depends_on:
        - backend
      networks:
        - presales_network
      restart: unless-stopped

    nginx:
      image: nginx:alpine
      ports:
        - "443:443"
      volumes:
        - ./nginx.conf:/etc/nginx/nginx.conf
        - ./ssl:/etc/nginx/ssl
      depends_on:
        - frontend
        - backend
      networks:
        - presales_network
      restart: unless-stopped

  volumes:
    postgres_data:
    backend_uploads:

  networks:
    presales_network:
      driver: bridge
  ```
- [ ] Testar produção: `docker-compose -f docker-compose.prod.yml up --build`

**Arquivos Criados**: `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`

---

### 5.5 Logs e Monitoramento
- [ ] Instalar Winston no backend:
  ```bash
  npm install winston
  ```
- [ ] Configurar `src/config/logger.ts`:
  - Logs em arquivo: `logs/app.log`
  - Diferentes níveis: error, warn, info, debug
  - Formato JSON para facilitar parsing
- [ ] Adicionar logs em pontos críticos:
  - Início/fim de processamento de proposta
  - Erros de API (Claude, TypeORM)
  - Uploads de arquivos
  - Autenticação (login/logout)
- [ ] Criar middleware de logging para requests HTTP

**Arquivos Criados**: `backend/src/config/logger.ts`, `backend/src/middleware/logger.ts`

---

### 5.6 Tratamento de Erros Centralizado
- [ ] Criar `src/middleware/errorHandler.ts`:
  ```typescript
  export const errorHandler = (err, req, res, next) => {
    logger.error(err.stack);

    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }

    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    res.status(500).json({
      error: 'Erro interno do servidor',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  };
  ```
- [ ] Usar em `app.use(errorHandler)` no final das rotas
- [ ] Criar classes de erro customizadas:
  - `ValidationError`
  - `NotFoundError`
  - `UnauthorizedError`
  - `ClaudeAPIError`

**Arquivos Criados**: `backend/src/middleware/errorHandler.ts`, `backend/src/errors/*.ts`

---

### 5.7 Segurança
- [ ] **Backend**:
  - [ ] Instalar helmet: `npm install helmet`
  - [ ] Configurar rate limiting: `npm install express-rate-limit`
  - [ ] Validar e sanitizar inputs (evitar SQL injection)
  - [ ] Não expor stack traces em produção
  - [ ] HTTPS em produção (certificado SSL)
- [ ] **Frontend**:
  - [ ] Sanitizar inputs de usuário
  - [ ] Não expor API keys
  - [ ] Content Security Policy
- [ ] **Geral**:
  - [ ] Backup automático do banco (cron job)
  - [ ] Rotação de logs
  - [ ] Monitoramento de uso da API do Claude

**Arquivos Atualizados**: `backend/src/index.ts` (middlewares de segurança)

---

### 5.8 Documentação Final
- [ ] Atualizar `README.md` na raiz com:
  - Descrição do projeto
  - Pré-requisitos (Node.js, PostgreSQL, Anthropic API key)
  - Instruções de instalação
  - Como rodar localmente (com Docker e sem Docker)
  - Variáveis de ambiente necessárias
  - Como rodar testes
  - Estrutura do projeto
  - Screenshots (opcional)
- [ ] Criar `backend/README.md` com detalhes da API
- [ ] Criar `frontend/README.md` com detalhes do UI
- [ ] Documentar decisões arquiteturais importantes
- [ ] Changelog de versões

**Arquivos Atualizados**: `README.md`, `backend/README.md`, `frontend/README.md`

---

### 5.9 Deploy (Opcional - Produção)
- [ ] **Backend**:
  - [ ] Escolher provedor (AWS, GCP, Azure, Heroku, Railway)
  - [ ] Configurar variáveis de ambiente
  - [ ] Deploy do banco PostgreSQL (RDS, Cloud SQL, etc)
  - [ ] Deploy da aplicação Node.js
- [ ] **Frontend**:
  - [ ] Build de produção: `npm run build`
  - [ ] Deploy em CDN (Vercel, Netlify, CloudFront)
  - [ ] Configurar domínio customizado
- [ ] **Monitoramento**:
  - [ ] Configurar alertas (uptime, erros)
  - [ ] Analytics (opcional)

**Status**: [ ] Aplicação em produção

---

## Checklist de Qualidade

### Funcionalidades Core
- [ ] Upload de múltiplos tipos de arquivo funcional
- [ ] Extração de texto de PDF, imagens e DOCX
- [ ] Integração com Claude AI retornando JSON válido
- [ ] Cálculos de custo precisos (validado com testes)
- [ ] Geração de Excel com 2 abas formatadas corretamente
- [ ] CRUD de profissionais funcionando
- [ ] CRUD de parâmetros funcionando
- [ ] Histórico de propostas com filtros
- [ ] Download de Excel gerado
- [ ] Autenticação JWT

### Qualidade de Código
- [ ] TypeScript sem erros de tipo
- [ ] ESLint sem warnings
- [ ] Código comentado em pontos críticos
- [ ] Funções pequenas e focadas (SRP)
- [ ] DRY - sem duplicação desnecessária
- [ ] Tratamento de erros em todos os pontos críticos

### Performance
- [ ] Upload e processamento < 2 minutos
- [ ] Geração de Excel < 5 segundos
- [ ] API responses < 500ms (exceto Claude)
- [ ] Frontend responsivo (mobile friendly)

### Segurança
- [ ] Senhas hasheadas com bcrypt
- [ ] JWT com expiração
- [ ] Rate limiting ativo
- [ ] CORS configurado corretamente
- [ ] Validação de inputs
- [ ] Arquivos sensíveis no .gitignore

### Documentação
- [ ] README completo
- [ ] API documentada (Swagger)
- [ ] Código com comentários úteis
- [ ] Variáveis de ambiente documentadas

---

## Métricas de Sucesso (conforme especificação)

- [ ] Redução de 70% no tempo de criação de propostas
- [ ] Precisão de 85% nas estimativas de esforço (comparar com propostas reais)
- [ ] Tempo de processamento < 2 minutos
- [ ] Zero erros em cálculos financeiros (validado por testes)
- [ ] Interface intuitiva (feedback de usuários)

---

## Notas de Implementação

### Prioridades
1. **Primeiro**: Backend + APIs core (Fases 1-3)
2. **Segundo**: Frontend básico (Fase 4)
3. **Terceiro**: Testes e refinamentos (Fase 5)

### Decisões Técnicas
- **TypeORM**: Escolhido para ORM (em vez de Prisma)
- **ExcelJS**: Para geração de arquivos .xlsx
- **React Query**: Para state management e cache
- **Tailwind CSS**: Para estilização rápida e consistente

### Riscos e Mitigações
| Risco | Mitigação |
|-------|-----------|
| Claude API lenta/indisponível | Implementar cache de respostas, retry logic |
| Extração de texto imprecisa | Validação humana antes de gerar proposta |
| Cálculos financeiros incorretos | Testes unitários extensivos, validação manual |
| Upload de arquivos grandes | Limitar tamanho, usar processamento assíncrono |

---

**Última Atualização**: 2025-11-07
**Próxima Revisão**: [Definir data após início]
