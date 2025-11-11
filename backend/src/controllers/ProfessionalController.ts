import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Professional } from '../entities/Professional';
import { logger } from '../config/logger';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';

export class ProfessionalController {
  private professionalRepository = AppDataSource.getRepository(Professional);

  /**
   * GET /api/professionals
   * Lista todos os profissionais
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { role, seniority } = req.query;

      let query = this.professionalRepository.createQueryBuilder('professional');

      // Filtros opcionais
      if (role) {
        query = query.where('professional.role = :role', { role });
      }

      if (seniority) {
        query = query.andWhere('professional.seniority = :seniority', { seniority });
      }

      const professionals = await query
        .orderBy('professional.role', 'ASC')
        .addOrderBy('professional.seniority', 'DESC')
        .getMany();

      return res.status(200).json({
        status: 'success',
        data: {
          professionals,
          total: professionals.length,
        },
      });
    } catch (error) {
      logger.error('Erro ao listar profissionais:', error);
      next(error);
    }
  }

  /**
   * GET /api/professionals/:id
   * Busca profissional por ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const professional = await this.professionalRepository.findOne({
        where: { id },
      });

      if (!professional) {
        throw new NotFoundError('Profissional não encontrado');
      }

      return res.status(200).json({
        status: 'success',
        data: professional,
      });
    } catch (error) {
      logger.error('Erro ao buscar profissional:', error);
      next(error);
    }
  }

  /**
   * POST /api/professionals
   * Cria novo profissional
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, role, hourlyCost, seniority, skills } = req.body;

      // Validações
      if (!name || !role || hourlyCost === undefined || !seniority) {
        throw new ValidationError('name, role, hourlyCost e seniority são obrigatórios');
      }

      if (hourlyCost <= 0) {
        throw new ValidationError('hourlyCost deve ser maior que zero');
      }

      const validSeniorities = ['Junior', 'Pleno', 'Senior'];
      if (!validSeniorities.includes(seniority)) {
        throw new ValidationError(`seniority deve ser: ${validSeniorities.join(', ')}`);
      }

      // Criar profissional
      const professional = this.professionalRepository.create({
        name,
        role,
        hourlyCost: parseFloat(hourlyCost),
        seniority,
        skills: skills || [],
      });

      await this.professionalRepository.save(professional);

      logger.info(`✅ Profissional criado: ${name} (${role})`);

      return res.status(201).json({
        status: 'success',
        message: 'Profissional criado com sucesso',
        data: professional,
      });
    } catch (error) {
      logger.error('Erro ao criar profissional:', error);
      next(error);
    }
  }

  /**
   * PUT /api/professionals/:id
   * Atualiza profissional
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, role, hourlyCost, seniority, skills } = req.body;

      const professional = await this.professionalRepository.findOne({
        where: { id },
      });

      if (!professional) {
        throw new NotFoundError('Profissional não encontrado');
      }

      // Validações
      if (hourlyCost !== undefined && hourlyCost <= 0) {
        throw new ValidationError('hourlyCost deve ser maior que zero');
      }

      const validSeniorities = ['Junior', 'Pleno', 'Senior'];
      if (seniority && !validSeniorities.includes(seniority)) {
        throw new ValidationError(`seniority deve ser: ${validSeniorities.join(', ')}`);
      }

      // Atualizar campos
      if (name !== undefined) professional.name = name;
      if (role !== undefined) professional.role = role;
      if (hourlyCost !== undefined) professional.hourlyCost = parseFloat(hourlyCost);
      if (seniority !== undefined) professional.seniority = seniority;
      if (skills !== undefined) professional.skills = skills;

      await this.professionalRepository.save(professional);

      logger.info(`✅ Profissional atualizado: ${professional.name} (${professional.role})`);

      return res.status(200).json({
        status: 'success',
        message: 'Profissional atualizado com sucesso',
        data: professional,
      });
    } catch (error) {
      logger.error('Erro ao atualizar profissional:', error);
      next(error);
    }
  }

  /**
   * DELETE /api/professionals/:id
   * Deleta profissional
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const professional = await this.professionalRepository.findOne({
        where: { id },
      });

      if (!professional) {
        throw new NotFoundError('Profissional não encontrado');
      }

      // Verificar se há propostas usando este profissional
      // (opcional, podemos deixar o cascade deletar ou impedir)
      const name = professional.name;

      await this.professionalRepository.remove(professional);

      logger.info(`🗑️ Profissional deletado: ${name}`);

      return res.status(200).json({
        status: 'success',
        message: 'Profissional deletado com sucesso',
      });
    } catch (error) {
      logger.error('Erro ao deletar profissional:', error);
      next(error);
    }
  }
}
