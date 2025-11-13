import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { logger } from '../config/logger';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';
import jwt from 'jsonwebtoken';

export class AuthController {
  private userRepository = AppDataSource.getRepository(User);

  /**
   * POST /api/auth/login
   * Autentica usuário e retorna token JWT
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      // Validações
      if (!email || !password) {
        throw new ValidationError('email e password são obrigatórios');
      }

      // Buscar usuário
      const user = await this.userRepository.findOne({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        throw new NotFoundError('Credenciais inválidas');
      }

      // Verificar se usuário está ativo
      if (!user.isActive) {
        throw new ValidationError('Usuário inativo');
      }

      // Verificar senha
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        throw new NotFoundError('Credenciais inválidas');
      }

      logger.info(`✅ Login bem-sucedido: ${email}`);

      // Gerar token JWT
      const token = this.generateToken(user);

      // Remover senha da resposta
      const { password: _, ...userWithoutPassword } = user;

      return res.status(200).json({
        status: 'success',
        message: 'Login realizado com sucesso',
        data: {
          user: userWithoutPassword,
          token,
        },
      });
    } catch (error) {
      logger.error('Erro ao fazer login:', error);
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Retorna informações do usuário autenticado
   */
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      // O middleware de auth já adiciona req.user
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new ValidationError('Usuário não autenticado');
      }

      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundError('Usuário não encontrado');
      }

      // Remover senha da resposta
      const { password: _, ...userWithoutPassword } = user;

      return res.status(200).json({
        status: 'success',
        data: userWithoutPassword,
      });
    } catch (error) {
      logger.error('Erro ao buscar usuário:', error);
      next(error);
    }
  }

  /**
   * Gera token JWT para o usuário
   */
  private generateToken(user: User): string {
    const secret = process.env.JWT_SECRET || 'seu-secret-super-secreto-aqui';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      secret,
      { expiresIn }
    );
  }
}
