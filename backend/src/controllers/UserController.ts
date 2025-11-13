import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { logger } from '../config/logger';
import { NotFoundError, UnauthorizedError, ValidationError } from '../middleware/errorHandler';
import bcrypt from 'bcryptjs';

export class UserController {
  private userRepository = AppDataSource.getRepository(User);

  /**
   * GET /api/users
   * Lista todos os usuários (apenas admin)
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await this.userRepository.find({
        select: ['id', 'name', 'email', 'role', 'isActive', 'createdAt', 'updatedAt'],
        order: { createdAt: 'DESC' },
      });

      return res.status(200).json({
        status: 'success',
        data: {
          users,
          total: users.length,
        },
      });
    } catch (error) {
      logger.error('Erro ao listar usuários:', error);
      next(error);
    }
  }

  /**
   * POST /api/users
   * Cria novo usuário (apenas admin)
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, role } = req.body;

      // Validações
      if (!name || !email || !password) {
        throw new ValidationError('Nome, email e senha são obrigatórios');
      }

      if (password.length < 6) {
        throw new ValidationError('Senha deve ter no mínimo 6 caracteres');
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new ValidationError('Email inválido');
      }

      // Verificar se email já existe
      const existingUser = await this.userRepository.findOne({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        throw new ValidationError('Email já cadastrado');
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10);

      // Criar usuário
      const user = this.userRepository.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role || 'user',
        isActive: true,
      });

      await this.userRepository.save(user);

      logger.info(`✅ Usuário criado: ${user.email}`);

      // Remover senha da resposta
      const { password: _, ...userWithoutPassword } = user;

      return res.status(201).json({
        status: 'success',
        message: 'Usuário criado com sucesso',
        data: userWithoutPassword,
      });
    } catch (error) {
      logger.error('Erro ao criar usuário:', error);
      next(error);
    }
  }

  /**
   * GET /api/users/:id
   * Busca usuário por ID (apenas admin)
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const user = await this.userRepository.findOne({
        where: { id },
        select: ['id', 'name', 'email', 'role', 'isActive', 'createdAt', 'updatedAt'],
      });

      if (!user) {
        throw new NotFoundError('Usuário não encontrado');
      }

      return res.status(200).json({
        status: 'success',
        data: user,
      });
    } catch (error) {
      logger.error('Erro ao buscar usuário:', error);
      next(error);
    }
  }

  /**
   * PUT /api/users/:id
   * Atualiza usuário (apenas admin)
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, email, role, isActive } = req.body;

      const user = await this.userRepository.findOne({ where: { id } });

      if (!user) {
        throw new NotFoundError('Usuário não encontrado');
      }

      // Atualizar campos
      if (name !== undefined) user.name = name;
      if (email !== undefined) {
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new ValidationError('Email inválido');
        }

        // Verificar se email já existe (diferente do usuário atual)
        const existingUser = await this.userRepository.findOne({
          where: { email: email.toLowerCase() },
        });

        if (existingUser && existingUser.id !== id) {
          throw new ValidationError('Email já cadastrado');
        }

        user.email = email.toLowerCase();
      }
      if (role !== undefined) user.role = role;
      if (isActive !== undefined) user.isActive = isActive;

      await this.userRepository.save(user);

      logger.info(`✅ Usuário atualizado: ${user.email}`);

      // Remover senha da resposta
      const { password: _, ...userWithoutPassword } = user;

      return res.status(200).json({
        status: 'success',
        message: 'Usuário atualizado com sucesso',
        data: userWithoutPassword,
      });
    } catch (error) {
      logger.error('Erro ao atualizar usuário:', error);
      next(error);
    }
  }

  /**
   * DELETE /api/users/:id
   * Deleta usuário (apenas admin)
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const user = await this.userRepository.findOne({ where: { id } });

      if (!user) {
        throw new NotFoundError('Usuário não encontrado');
      }

      await this.userRepository.remove(user);

      logger.info(`✅ Usuário deletado: ${user.email}`);

      return res.status(200).json({
        status: 'success',
        message: 'Usuário deletado com sucesso',
      });
    } catch (error) {
      logger.error('Erro ao deletar usuário:', error);
      next(error);
    }
  }
}
