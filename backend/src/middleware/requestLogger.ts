import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

/**
 * Middleware para registrar todas as requisições HTTP
 * Logs incluem: método, path, status, tempo de resposta, IP
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const { method, originalUrl, ip } = req;

  // Log da requisição iniciada
  logger.info(`➡️  ${method} ${originalUrl}`, {
    method,
    url: originalUrl,
    ip: ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
  });

  // Interceptar o response para logar quando finalizar
  const originalSend = res.send;
  res.send = function (data: any): Response {
    const duration = Date.now() - startTime;
    const { statusCode } = res;

    // Determinar nível do log baseado no status
    const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    logger[logLevel](`⬅️  ${method} ${originalUrl} ${statusCode} ${duration}ms`, {
      method,
      url: originalUrl,
      statusCode,
      duration,
      ip: ip || req.socket.remoteAddress,
    });

    return originalSend.call(this, data);
  };

  next();
};
