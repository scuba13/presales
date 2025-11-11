import 'reflect-metadata';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { AppDataSource } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './config/logger';
import { setupSwagger } from './config/swagger';
import { requestLogger } from './middleware/requestLogger';

// Carregar variáveis de ambiente
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middlewares de segurança
app.use(helmet());

// Configuração CORS
const allowedOrigins = [
  'http://localhost:5173',       // Frontend dev
  'http://localhost:3000',       // Frontend alternativo
  process.env.FRONTEND_URL,      // Frontend produção
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir requisições sem origin (mobile apps, Postman, etc)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`❌ CORS bloqueou origem: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Permite cookies e headers de autenticação
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Middlewares de parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging HTTP
app.use(requestLogger);

// Swagger Documentation
setupSwagger(app);

/**
 * @swagger
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check do servidor
 *     description: Verifica se o servidor está funcionando corretamente
 *     security: []
 *     responses:
 *       200:
 *         description: Servidor funcionando normalmente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Tempo de execução do servidor em segundos
 */
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * @swagger
 * /:
 *   get:
 *     tags:
 *       - Health
 *     summary: Informações da API
 *     description: Retorna informações básicas sobre a API e seus endpoints
 *     security: []
 *     responses:
 *       200:
 *         description: Informações da API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 version:
 *                   type: string
 *                 endpoints:
 *                   type: object
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Presales API - Sistema de Pré-Venda com IA',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      docs: '/api-docs',
    },
  });
});

// Rotas da API
import documentRoutes from './routes/documents';
import proposalRoutes from './routes/proposals';
import professionalRoutes from './routes/professionals';
import parameterRoutes from './routes/parameters';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';

app.use('/api/documents', documentRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/professionals', professionalRoutes);
app.use('/api/parameters', parameterRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Middleware de tratamento de erros (deve ser o último)
app.use(errorHandler);

// Inicializar conexão com banco de dados e iniciar servidor
const startServer = async () => {
  try {
    // Conectar ao banco de dados
    await AppDataSource.initialize();
    logger.info('✅ Conexão com banco de dados estabelecida com sucesso');

    // Iniciar servidor
    app.listen(PORT, () => {
      logger.info(`🚀 Servidor rodando na porta ${PORT}`);
      logger.info(`📝 Health check: http://localhost:${PORT}/health`);
      logger.info(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar servidor
startServer();

export default app;
