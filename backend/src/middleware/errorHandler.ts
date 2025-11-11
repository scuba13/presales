import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { ErrorResponse, ErrorCode } from '../types/api';

// Classes de erro customizadas
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, true, ErrorCode.VALIDATION_ERROR);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso não encontrado') {
    super(message, 404, true, ErrorCode.NOT_FOUND);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Não autorizado') {
    super(message, 401, true, ErrorCode.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Acesso negado') {
    super(message, 403, true, ErrorCode.FORBIDDEN);
  }
}

export class ClaudeAPIError extends AppError {
  constructor(message: string) {
    super(`Erro na API do Claude: ${message}`, 500, true, 'CLAUDE_API_ERROR');
  }
}

export class AIAPIError extends AppError {
  constructor(message: string, provider: string = 'IA') {
    super(`Erro na API ${provider}: ${message}`, 500, true, 'AI_API_ERROR');
  }
}

// Middleware de tratamento de erros
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log do erro
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Se for erro operacional (esperado)
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      status: 'error',
      message: err.message,
      code: err.code,
    };
    return res.status(err.statusCode).json(response);
  }

  // Erro de validação do Joi
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: err.message,
    });
  }

  // Erro do TypeORM
  if (err.name === 'QueryFailedError') {
    return res.status(400).json({
      status: 'error',
      message: 'Erro ao executar consulta no banco de dados',
    });
  }

  // Erro da OpenAI API
  if (err.message && err.message.includes('429')) {
    return res.status(429).json({
      status: 'error',
      message: 'Limite de uso da API excedido. Por favor, verifique seus créditos ou tente novamente mais tarde.',
      code: 'QUOTA_EXCEEDED',
    });
  }

  if (err.message && err.message.includes('401')) {
    return res.status(401).json({
      status: 'error',
      message: 'Chave de API inválida ou não autorizada.',
      code: 'UNAUTHORIZED_API',
    });
  }

  if (err.message && err.message.includes('exceeded your current quota')) {
    return res.status(429).json({
      status: 'error',
      message: 'Limite de uso da API excedido. Por favor, verifique seus créditos ou tente novamente mais tarde.',
      code: 'QUOTA_EXCEEDED',
    });
  }

  // Erro genérico (não esperado)
  return res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production'
      ? 'Erro interno do servidor'
      : err.message,
  });
};
