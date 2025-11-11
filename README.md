# Sistema de Pré-Venda com IA

Sistema completo de automação de pré-vendas que utiliza Claude AI para analisar documentos (RFPs, briefings, PDFs, imagens) e gerar automaticamente propostas comerciais em formato Excel com cálculos de custos, alocação de recursos e cronogramas.

## 📋 Funcionalidades

- 🤖 **Análise Inteligente com Claude AI**: Extrai automaticamente escopo, complexidade e requisitos de documentos
- 📊 **Geração Automática de Propostas**: Cria planilhas Excel formatadas com custos e cronogramas
- 💰 **Cálculo Financeiro Preciso**: Aplica impostos (21%), SG&A (10%) e margem (25%) automaticamente
- 👥 **Gestão de Recursos**: CRUD completo de profissionais com custos/hora personalizáveis
- 📈 **Dashboard Intuitivo**: Visualização de histórico, métricas e propostas geradas
- 🔒 **Segurança**: Autenticação JWT e validação de inputs

## 🏗️ Arquitetura

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Banco de Dados**: PostgreSQL com TypeORM
- **IA**: Anthropic Claude AI (API)
- **Containerização**: Docker + Docker Compose

## 🚀 Quick Start com Docker

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) (versão 20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (versão 2.0+)
- Chave de API do Anthropic ([obter aqui](https://console.anthropic.com/))

### Instalação

1. **Clone o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd presales
   ```

2. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env
   ```

   Edite o arquivo `.env` e adicione sua chave da API do Anthropic:
   ```env
   ANTHROPIC_API_KEY=sua_chave_api_aqui
   ```

3. **Inicie todos os serviços**
   ```bash
   docker-compose up -d
   ```

   Isso irá iniciar:
   - PostgreSQL (porta 5432)
   - pgAdmin (porta 5050)
   - Backend API (porta 3001)
   - Frontend (porta 5173)

4. **Acesse a aplicação**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:3001
   - **pgAdmin**: http://localhost:5050
     - Email: `admin@presales.com`
     - Senha: `admin123`

### Primeiros Passos

1. **Execute as migrations do banco de dados**
   ```bash
   docker-compose exec backend npm run typeorm migration:run
   ```

2. **Popule o banco com dados iniciais** (profissionais e parâmetros padrão)
   ```bash
   docker-compose exec backend npm run seed
   ```

3. **Crie sua primeira conta** acessando http://localhost:5173/register

4. **Gere sua primeira proposta**:
   - Faça login
   - Clique em "Nova Proposta"
   - Faça upload de documentos (PDF, DOCX, imagens)
   - Aguarde a análise do Claude AI
   - Baixe o Excel gerado

## 🛠️ Comandos Docker Úteis

### Gerenciamento de Containers

```bash
# Ver status dos serviços
docker-compose ps

# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Parar todos os serviços
docker-compose down

# Parar e remover volumes (CUIDADO: apaga o banco de dados)
docker-compose down -v

# Reconstruir as imagens
docker-compose up -d --build

# Reiniciar um serviço específico
docker-compose restart backend
```

### Executar Comandos nos Containers

```bash
# Backend
docker-compose exec backend npm run typeorm migration:run
docker-compose exec backend npm run seed
docker-compose exec backend npm test
docker-compose exec backend sh  # Acessar shell

# Frontend
docker-compose exec frontend npm run lint
docker-compose exec frontend npm test
docker-compose exec frontend sh

# PostgreSQL
docker-compose exec postgres psql -U postgres -d presales
```

### Desenvolvimento

```bash
# Instalar nova dependência no backend
docker-compose exec backend npm install <pacote>

# Instalar nova dependência no frontend
docker-compose exec frontend npm install <pacote>

# Gerar nova migration
docker-compose exec backend npm run typeorm migration:generate -- -n NomeDaMigration

# Reverter última migration
docker-compose exec backend npm run typeorm migration:revert
```

## 📊 Estrutura do Projeto

```
presales/
├── backend/
│   ├── src/
│   │   ├── controllers/       # Controladores das rotas
│   │   ├── services/          # Lógica de negócio
│   │   │   ├── claude.service.ts
│   │   │   ├── excel.service.ts
│   │   │   └── document.service.ts
│   │   ├── entities/          # Entidades TypeORM
│   │   ├── routes/            # Definição de rotas
│   │   ├── middleware/        # Middlewares (auth, error handling)
│   │   ├── utils/             # Utilitários (cálculos, etc)
│   │   ├── config/            # Configurações (database, etc)
│   │   └── index.ts
│   ├── Dockerfile.dev         # Docker para desenvolvimento
│   ├── Dockerfile             # Docker para produção
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Componentes React
│   │   ├── pages/             # Páginas
│   │   ├── services/          # Cliente API
│   │   ├── hooks/             # Custom hooks
│   │   └── utils/             # Utilitários
│   ├── Dockerfile.dev
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml         # Configuração Docker desenvolvimento
├── docker-compose.prod.yml    # Configuração Docker produção
├── .env.example               # Template de variáveis de ambiente
├── PLANO_IMPLEMENTACAO.md     # Plano detalhado de implementação
└── CLAUDE.md                  # Guia para Claude Code
```

## 🔧 Desenvolvimento Local (sem Docker)

Se preferir desenvolver sem Docker:

### Backend

```bash
cd backend
npm install
npm run dev
```

**Requerimentos**:
- Node.js 18+
- PostgreSQL rodando localmente
- Tesseract OCR instalado

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 🧪 Testes

```bash
# Backend
docker-compose exec backend npm test
docker-compose exec backend npm run test:coverage

# Frontend
docker-compose exec frontend npm test
```

## 📝 API Endpoints

### Autenticação
- `POST /api/auth/register` - Criar nova conta
- `POST /api/auth/login` - Login

### Documentos
- `POST /api/documents/upload` - Upload de arquivos

### Propostas
- `POST /api/proposal/generate` - Gerar proposta completa
- `GET /api/proposals` - Listar propostas
- `GET /api/proposals/:id` - Detalhes da proposta
- `GET /api/proposals/:id/download` - Download do Excel
- `DELETE /api/proposals/:id` - Deletar proposta

### Profissionais
- `GET /api/professionals` - Listar profissionais
- `POST /api/professionals` - Criar profissional
- `PUT /api/professionals/:id` - Atualizar profissional
- `DELETE /api/professionals/:id` - Deletar profissional

### Parâmetros
- `GET /api/parameters` - Listar parâmetros (tax, sga, margin)
- `PUT /api/parameters/:name` - Atualizar parâmetro

Documentação completa: http://localhost:3001/api-docs (Swagger)

## 💡 Fluxo de Uso

1. **Upload de Documentos**: Usuário faz upload de RFP/briefing
2. **Extração de Texto**: Sistema extrai texto de PDFs e imagens (OCR)
3. **Análise IA**: Claude AI analisa e identifica:
   - Escopo do projeto
   - Complexidade
   - Equipe necessária
   - Duração estimada
4. **Cálculo Automático**: Sistema aplica fórmulas financeiras
5. **Geração Excel**: Cria planilha com duas abas:
   - **Custo Solução e Sustentação**: Recursos × Meses com cálculos
   - **Cronograma**: Timeline do projeto
6. **Download**: Usuário baixa proposta pronta

## 📈 Fórmulas de Cálculo

```
Custo Base = Total de Horas × Custo/Hora
Custo com Impostos = Custo Base × 1.21 (21%)
Custo com SG&A = Custo com Impostos × 1.10 (10%)
Preço Final = Custo com SG&A ÷ 0.75 (margem 25%)
```

**Exemplo**:
- 1000 horas × R$ 100/hora = R$ 100.000
- Com imposto (21%): R$ 121.000
- Com SG&A (10%): R$ 133.100
- Com margem (25%): **R$ 177.467**

## 🔐 Segurança

- ✅ Autenticação JWT
- ✅ Senhas hasheadas com bcrypt
- ✅ Validação de inputs
- ✅ Rate limiting
- ✅ CORS configurado
- ✅ Variáveis sensíveis em .env
- ✅ SQL injection protection (TypeORM)

## 🐛 Troubleshooting

### Containers não iniciam

```bash
# Ver logs de erro
docker-compose logs

# Limpar e reconstruir tudo
docker-compose down -v
docker-compose up -d --build
```

### Erro de conexão com PostgreSQL

```bash
# Verificar se o PostgreSQL está rodando
docker-compose ps postgres

# Ver logs do PostgreSQL
docker-compose logs postgres

# Recriar o container
docker-compose restart postgres
```

### Frontend não conecta no Backend

1. Verifique se as variáveis de ambiente estão corretas no `.env`
2. Verifique se o backend está rodando: `docker-compose logs backend`
3. Teste a API diretamente: `curl http://localhost:3001/api/health`

### Tesseract OCR não funciona

O Tesseract é instalado automaticamente no container Docker. Se estiver rodando localmente sem Docker:

```bash
# macOS
brew install tesseract tesseract-lang

# Ubuntu/Debian
sudo apt-get install tesseract-ocr tesseract-ocr-por

# Windows
# Baixar instalador: https://github.com/UB-Mannheim/tesseract/wiki
```

## 📚 Documentação Adicional

- [Plano de Implementação](PLANO_IMPLEMENTACAO.md) - Plano detalhado com checkboxes
- [CLAUDE.md](CLAUDE.md) - Guia para Claude Code
- [Especificação Original](plano-app-prevenda.md) - Documento de requisitos completo

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 📧 Suporte

Para dúvidas ou problemas:
1. Verifique a seção [Troubleshooting](#-troubleshooting)
2. Consulte os logs: `docker-compose logs`
3. Abra uma issue no GitHub

---

**Desenvolvido com ❤️ usando Claude AI**
