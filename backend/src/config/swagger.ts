import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Presales API - Sistema de Pré-Venda com IA',
      version: '1.0.0',
      description: `
        API REST para geração automática de propostas comerciais usando Inteligência Artificial.
        
        ## Funcionalidades Principais
        
        - 🤖 **Geração de Propostas com IA**: Análise de documentos usando Claude (Anthropic) ou OpenAI
        - 👥 **Gestão de Profissionais**: CRUD completo de profissionais e suas habilidades
        - 📊 **Parâmetros Financeiros**: Configuração de tax, SG&A e margin
        - 📄 **Upload de Documentos**: Suporte a múltiplos formatos (PDF, DOC, TXT, MD)
        - 🔐 **Autenticação JWT**: Segurança com tokens Bearer
        - 📥 **Export Excel**: Download de propostas em formato XLSX
        
        ## Autenticação
        
        A maioria dos endpoints requer autenticação via JWT Bearer token.
        
        1. Registre um usuário em \`/api/auth/register\`
        2. Faça login em \`/api/auth/login\` para obter o token
        3. Use o token no header: \`Authorization: Bearer <seu-token>\`
        
        ## Workflow de Geração de Proposta
        
        1. Upload de documentos (RFP, briefing, etc)
        2. Análise com IA (Claude ou OpenAI)
        3. Cálculo automático de custos
        4. Geração de Excel profissional
        5. Armazenamento no banco de dados
      `,
      contact: {
        name: 'API Support',
        email: 'support@presales.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Servidor de Desenvolvimento',
      },
      {
        url: 'http://localhost:3001/api',
        description: 'API Base URL',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Insira o token JWT obtido no endpoint /api/auth/login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error',
            },
            message: {
              type: 'string',
              example: 'Mensagem de erro',
            },
            code: {
              type: 'string',
              example: 'ERROR_CODE',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            role: {
              type: 'string',
              enum: ['admin', 'user'],
              example: 'user',
            },
            isActive: {
              type: 'boolean',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Professional: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
              example: 'Tech Lead',
            },
            role: {
              type: 'string',
              example: 'Tech Lead',
            },
            hourlyCost: {
              type: 'number',
              format: 'decimal',
              example: 110.12,
            },
            seniority: {
              type: 'string',
              enum: ['Junior', 'Pleno', 'Senior'],
              example: 'Senior',
            },
            skills: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['Node.js', 'React', 'TypeScript'],
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Parameter: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
              example: 'tax',
            },
            value: {
              type: 'number',
              format: 'decimal',
              example: 0.21,
              description: 'Valor decimal entre 0 e 1 (ex: 0.21 = 21%)',
            },
            type: {
              type: 'string',
              example: 'percentage',
            },
            description: {
              type: 'string',
              example: 'Impostos',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Autenticação e autorização',
      },
      {
        name: 'Proposals',
        description: 'Geração e gestão de propostas comerciais',
      },
      {
        name: 'Professionals',
        description: 'Gestão de profissionais e suas habilidades',
      },
      {
        name: 'Parameters',
        description: 'Configuração de parâmetros financeiros (tax, SG&A, margin)',
      },
      {
        name: 'Documents',
        description: 'Upload e gestão de documentos',
      },
      {
        name: 'Health',
        description: 'Endpoints de saúde e status do sistema',
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/index.ts',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Presales API Docs',
  }));

  // JSON spec
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};
