import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../config/logger';

/**
 * Interface para o payload do JWT
 */
export interface JWTPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Estende o Request do Express para incluir user
 */
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware de autenticação JWT
 * Verifica se o token é válido e adiciona user ao request
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Pegar token do header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        status: 'error',
        message: 'Token não fornecido',
        code: 'NO_TOKEN',
      });
    }

    // Formato esperado: "Bearer <token>"
    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
      return res.status(401).json({
        status: 'error',
        message: 'Formato de token inválido',
        code: 'INVALID_TOKEN_FORMAT',
      });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
      return res.status(401).json({
        status: 'error',
        message: 'Token mal formatado',
        code: 'MALFORMED_TOKEN',
      });
    }

    // Verificar token
    const secret = process.env.JWT_SECRET || 'seu-secret-super-secreto-aqui';

    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        logger.error('Erro ao verificar token JWT:', err);

        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            status: 'error',
            message: 'Token expirado',
            code: 'TOKEN_EXPIRED',
          });
        }

        return res.status(401).json({
          status: 'error',
          message: 'Token inválido',
          code: 'INVALID_TOKEN',
        });
      }

      // Adicionar user ao request
      req.user = decoded as JWTPayload;
      return next();
    });
  } catch (error) {
    logger.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao processar autenticação',
    });
  }
};

/**
 * Middleware de autorização por role
 * Verifica se o usuário tem a role necessária
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Usuário não autenticado',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Acesso negado. Você não tem permissão para acessar este recurso.',
        code: 'FORBIDDEN',
      });
    }

    next();
  };
};
