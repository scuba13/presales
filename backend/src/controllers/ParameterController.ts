import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Parameter } from '../entities/Parameter';
import { logger } from '../config/logger';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';

export class ParameterController {
  private parameterRepository = AppDataSource.getRepository(Parameter);

  /**
   * GET /api/parameters
   * Lista todos os parâmetros (tax, sga, margin)
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const parameters = await this.parameterRepository.find({
        order: {
          name: 'ASC',
        },
      });

      // Formatar para resposta amigável
      const formattedParameters = parameters.reduce((acc, param) => {
        acc[param.name] = {
          value: param.value,
          percentage: `${(param.value * 100).toFixed(2)}%`,
          type: param.type,
          updatedAt: param.updatedAt,
        };
        return acc;
      }, {} as Record<string, any>);

      return res.status(200).json({
        status: 'success',
        data: {
          parameters: formattedParameters,
          raw: parameters,
        },
      });
    } catch (error) {
      logger.error('Erro ao listar parâmetros:', error);
      next(error);
    }
  }

  /**
   * GET /api/parameters/:name
   * Busca parâmetro por nome (tax, sga, margin)
   */
  async getByName(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.params;

      const parameter = await this.parameterRepository.findOne({
        where: { name },
      });

      if (!parameter) {
        throw new NotFoundError(`Parâmetro '${name}' não encontrado`);
      }

      return res.status(200).json({
        status: 'success',
        data: {
          name: parameter.name,
          value: parameter.value,
          percentage: `${(parameter.value * 100).toFixed(2)}%`,
          type: parameter.type,
          updatedAt: parameter.updatedAt,
        },
      });
    } catch (error) {
      logger.error('Erro ao buscar parâmetro:', error);
      next(error);
    }
  }

  /**
   * PUT /api/parameters/:name
   * Atualiza valor de um parâmetro
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.params;
      const { value } = req.body;

      if (value === undefined) {
        throw new ValidationError('value é obrigatório');
      }

      const numValue = parseFloat(value);

      // Validações
      if (isNaN(numValue)) {
        throw new ValidationError('value deve ser um número válido');
      }

      if (numValue < 0 || numValue > 1) {
        throw new ValidationError('value deve ser entre 0 e 1 (percentual decimal)');
      }

      const parameter = await this.parameterRepository.findOne({
        where: { name },
      });

      if (!parameter) {
        throw new NotFoundError(`Parâmetro '${name}' não encontrado`);
      }

      const oldValue = parameter.value;
      parameter.value = numValue;

      await this.parameterRepository.save(parameter);

      logger.info(
        `✅ Parâmetro atualizado: ${name} de ${(oldValue * 100).toFixed(2)}% para ${(
          numValue * 100
        ).toFixed(2)}%`
      );

      return res.status(200).json({
        status: 'success',
        message: 'Parâmetro atualizado com sucesso',
        data: {
          name: parameter.name,
          value: parameter.value,
          percentage: `${(parameter.value * 100).toFixed(2)}%`,
          oldValue: oldValue,
          oldPercentage: `${(oldValue * 100).toFixed(2)}%`,
          updatedAt: parameter.updatedAt,
        },
      });
    } catch (error) {
      logger.error('Erro ao atualizar parâmetro:', error);
      next(error);
    }
  }

  /**
   * POST /api/parameters
   * Cria novo parâmetro (usado principalmente no seed, mas pode ser útil para adicionar novos)
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, value, type } = req.body;

      // Validações
      if (!name || value === undefined || !type) {
        throw new ValidationError('name, value e type são obrigatórios');
      }

      const numValue = parseFloat(value);

      if (isNaN(numValue)) {
        throw new ValidationError('value deve ser um número válido');
      }

      if (numValue < 0 || numValue > 1) {
        throw new ValidationError('value deve ser entre 0 e 1 (percentual decimal)');
      }

      // Verificar se já existe
      const existing = await this.parameterRepository.findOne({
        where: { name },
      });

      if (existing) {
        throw new ValidationError(`Parâmetro '${name}' já existe. Use PUT para atualizar.`);
      }

      const parameter = this.parameterRepository.create({
        name,
        value: numValue,
        type,
      });

      await this.parameterRepository.save(parameter);

      logger.info(`✅ Parâmetro criado: ${name} = ${(numValue * 100).toFixed(2)}%`);

      return res.status(201).json({
        status: 'success',
        message: 'Parâmetro criado com sucesso',
        data: {
          name: parameter.name,
          value: parameter.value,
          percentage: `${(parameter.value * 100).toFixed(2)}%`,
          type: parameter.type,
        },
      });
    } catch (error) {
      logger.error('Erro ao criar parâmetro:', error);
      next(error);
    }
  }
}
