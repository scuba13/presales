# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a pre-sales automation system that uses Claude AI to analyze documents (RFPs, briefings, PDFs, images) and automatically generate commercial proposals in Excel format with cost calculations, resource allocation, and project timelines.

**Current Status**: Planning phase - the repository contains project specifications in `plano-app-prevenda.md` but no implementation yet.

## Planned Architecture

### High-Level Structure

The system will be built as a full-stack web application:

- **Frontend**: React + TypeScript + Tailwind CSS (drag-and-drop upload interface, proposal viewer, configuration panels)
- **Backend**: Node.js + Express + TypeScript (document processing, Claude AI integration, Excel generation)
- **Database**: PostgreSQL with TypeORM (professionals, proposals, parameters, templates)

### Core Data Flow

1. User uploads documents (PDF, DOCX, images, text)
2. Backend extracts text using pdf-parse (PDFs) and Tesseract (OCR for images)
3. Claude AI analyzes content to identify scope, complexity, required team composition, and timeline
4. System calculates costs using formula: `Base Cost → +Tax (21%) → +SG&A (10%) → ÷(1-Margin 25%) = Final Price`
5. ExcelJS generates formatted proposal with two tabs: "Custo Solução e Sustentação" and "Cronograma"

### Critical Business Logic

**Professional Roles and Hourly Costs** (default values in BRL):
- Tech Lead: R$ 110.12/h
- Backend Dev: R$ 98.21/h
- Frontend Dev: R$ 98.21/h
- UX Designer: R$ 59.52/h
- Architect: R$ 148.81/h
- Product Owner: R$ 77.38/h
- DevOps: R$ 95.24/h
- QA: R$ 44.64/h

**Cost Calculation Formula** (see plano-app-prevenda.md:256-276):
```
Custo_Base = Total_Hours × Hourly_Cost
Custo_Com_Impostos = Custo_Base × 1.21
Custo_Com_SGA = Custo_Com_Impostos × 1.10
Custo_Final = Custo_Com_SGA
Preço = Custo_Final / 0.75  (25% margin)
```

### Claude AI Integration Strategy

Three specialized prompts for different analysis stages (see plano-app-prevenda.md:134-172):

1. **Initial Analysis Prompt**: Extract scope, core functionalities, integrations, non-functional requirements, complexity estimation, and risks (returns JSON)
2. **Team Estimation Prompt**: Suggest team composition, monthly allocation in hours, project duration, and phases with effort percentages
3. **Schedule Generation Prompt**: Create detailed timeline with sprint deliverables, dependencies, critical milestones, and risk buffers

Use Anthropic SDK for integration. Always request JSON-formatted responses for structured data extraction.

### Excel Output Structure

**Tab 1: "Custo Solução e Sustentação"**
- Columns: Recurso | M1-M10 (monthly hours) | Total | Custo/Hora | Imposto | SG&A | Margem | Custo | Preço
- Two sections: Development (M1-M7) and Sustentation/Support (M8-M10)

**Tab 2: "Cronograma"**
- Simplified Gantt chart structure
- Phases: Discovery → Development → Testing → Deployment
- Include project milestones

## Development with Docker

### Quick Start
```bash
# Clonar repositório e configurar ambiente
cp .env.example .env
# Editar .env com suas credenciais (ANTHROPIC_API_KEY, etc)

# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Acessar serviços:
# - Frontend: http://localhost:5173
# - Backend API: http://localhost:3001
# - pgAdmin: http://localhost:5050 (admin@presales.com / admin123)

# Parar todos os serviços
docker-compose down

# Parar e remover volumes (CUIDADO: apaga dados do banco)
docker-compose down -v
```

### Comandos Docker Úteis
```bash
# Reconstruir imagens após mudanças no Dockerfile
docker-compose up -d --build

# Executar comandos no container do backend
docker-compose exec backend npm run typeorm migration:run
docker-compose exec backend npm run seed
docker-compose exec backend npm test

# Executar comandos no container do frontend
docker-compose exec frontend npm run lint

# Ver logs de um serviço específico
docker-compose logs -f backend
docker-compose logs -f postgres

# Acessar shell do container
docker-compose exec backend sh
docker-compose exec postgres psql -U postgres -d presales
```

## Development Commands

**Note**: Os comandos abaixo devem ser executados dentro dos containers Docker ou localmente se preferir desenvolvimento sem Docker.

### Frontend (when created)
```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run ESLint
npm test             # Run tests
```

### Backend (when created)
```bash
npm install          # Install dependencies
npm run dev          # Start with nodemon/ts-node-dev
npm run build        # Compile TypeScript
npm run start        # Run production build
npm test             # Run tests
npm run typeorm migration:run     # Run database migrations
npm run typeorm migration:generate -- -n MigrationName  # Generate migration
```

## Recommended Directory Structure

```
presales/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Upload/          # Drag-drop file upload
│       │   ├── Dashboard/       # Proposal history and metrics
│       │   ├── ProposalViewer/  # Excel preview and editing
│       │   └── Settings/        # Professional rates, tax config
│       ├── services/
│       │   ├── api.ts           # Backend API client
│       │   └── claude.ts        # Claude-specific utilities
│       └── utils/
│           └── calculations.ts  # Cost calculation formulas
├── backend/
│   └── src/
│       ├── controllers/         # Route handlers
│       ├── services/
│       │   ├── claude.service.ts    # Anthropic SDK integration
│       │   ├── excel.service.ts     # ExcelJS generation
│       │   └── document.service.ts  # PDF/OCR extraction
│       ├── entities/            # TypeORM entities
│       ├── routes/              # API route definitions
│       └── utils/
├── database/
│   └── migrations/
└── plano-app-prevenda.md       # Full specification (existing)
```

## Key API Endpoints (to implement)

- `POST /api/documents/upload` - Accept multiple files, extract text, return processing ID
- `POST /api/ai/analyze` - Send extracted content to Claude for analysis
- `POST /api/proposal/generate` - Generate Excel from Claude analysis + business rules
- `GET/POST/PUT/DELETE /api/resources` - CRUD for professional profiles and costs
- `GET/POST /api/parameters` - Manage tax, SG&A, and margin configurations
- `GET /api/proposals` - List proposal history

## Database Schema

**Key Tables** (implement with TypeORM):
- `professionals`: id, name, role, hourly_cost, seniority, skills[]
- `proposals`: id, client_name, project_name, created_at, status, total_cost, total_price
- `proposal_resources`: proposal_id, professional_id, hours_per_month[], total_hours
- `parameters`: id, name, value, type (tax|sga|margin)
- `templates`: id, name, team_composition, typical_duration

## Required Libraries

### Frontend
- react, typescript, tailwindcss
- @tanstack/react-query (state management)
- react-hook-form (forms)
- react-dropzone (file upload)
- recharts (cost distribution charts)
- xlsx or sheetjs-style (Excel preview)

### Backend
- express, typescript
- @anthropic-ai/sdk (Claude integration)
- exceljs (Excel generation)
- multer (file upload handling)
- pdf-parse (PDF text extraction)
- tesseract.js (OCR for images)
- typeorm (ORM)
- pg (PostgreSQL driver)
- reflect-metadata (required by TypeORM)
- joi or zod (validation)
- winston (logging)

## Implementation Priority (MVP - Phase 1)

1. Setup backend API structure with Express + TypeScript
2. Implement document upload endpoint with text extraction (pdf-parse, Tesseract)
3. Integrate Anthropic SDK with the three analysis prompts
4. Create ExcelJS service to generate formatted proposals
5. Build professional CRUD API and database schema
6. Implement cost calculation engine with formula
7. Build React frontend with upload interface
8. Add proposal viewer with inline editing
9. Create settings panel for parameters and professional rates

**Start with backend-first approach** - establish APIs and core logic before building UI.

## Testing Strategy

- Unit tests for cost calculation formulas (critical business logic)
- Integration tests for Claude AI prompts (validate JSON structure)
- E2E tests for upload → analysis → Excel generation flow
- Validate Excel output format matches specification exactly
- Test with various document formats (PDF, DOCX, images)

## Security Considerations

- Store Anthropic API key in environment variables (never commit)
- Implement JWT authentication for API endpoints
- Encrypt sensitive data (client names, project details)
- Add audit logs for proposal generation
- Validate and sanitize file uploads
- Set file size limits (prevent DoS)
- LGPD compliance for data storage

## Performance Goals

- Document processing: < 2 minutes end-to-end
- Claude API response: typically 10-30 seconds per analysis
- Excel generation: < 5 seconds
- Support concurrent uploads with job queue (consider Bull/BullMQ)
- add to memory
- add to memory