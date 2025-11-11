import { AppDataSource } from '../config/database';
import { Professional } from '../entities/Professional';
import { Parameter } from '../entities/Parameter';
import { logger } from '../config/logger';

export async function seedInitialData() {
  try {
    const professionalRepository = AppDataSource.getRepository(Professional);
    const parameterRepository = AppDataSource.getRepository(Parameter);

    // Verificar se já existem dados
    const existingProfessionals = await professionalRepository.count();
    const existingParameters = await parameterRepository.count();

    if (existingProfessionals > 0 && existingParameters > 0) {
      logger.info('✅ Dados iniciais já existem. Seed ignorado.');
      return;
    }

    logger.info('📝 Criando dados iniciais...');

    // Criar profissionais padrão (valores do plano)
    const professionals = [
      {
        name: 'Tech Lead',
        role: 'Tech Lead',
        hourlyCost: 110.12,
        seniority: 'Senior',
        skills: ['Arquitetura', 'Liderança Técnica', 'Node.js', 'React'],
      },
      {
        name: 'Desenvolvedor Backend',
        role: 'Backend Dev',
        hourlyCost: 98.21,
        seniority: 'Pleno',
        skills: ['Node.js', 'TypeScript', 'PostgreSQL', 'APIs REST'],
      },
      {
        name: 'Desenvolvedor Frontend',
        role: 'Frontend Dev',
        hourlyCost: 98.21,
        seniority: 'Pleno',
        skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js'],
      },
      {
        name: 'UX Designer',
        role: 'UX Designer',
        hourlyCost: 59.52,
        seniority: 'Pleno',
        skills: ['Figma', 'UI/UX', 'Design Systems', 'Prototipagem'],
      },
      {
        name: 'Arquiteto de Software',
        role: 'Architect',
        hourlyCost: 148.81,
        seniority: 'Senior',
        skills: ['Arquitetura de Soluções', 'Cloud', 'Microserviços', 'DDD'],
      },
      {
        name: 'Product Owner',
        role: 'Product Owner',
        hourlyCost: 77.38,
        seniority: 'Pleno',
        skills: ['Gestão de Produtos', 'Agile', 'Scrum', 'Stakeholder Management'],
      },
      {
        name: 'DevOps Engineer',
        role: 'DevOps',
        hourlyCost: 95.24,
        seniority: 'Pleno',
        skills: ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Terraform'],
      },
      {
        name: 'QA Engineer',
        role: 'QA',
        hourlyCost: 44.64,
        seniority: 'Junior',
        skills: ['Testes Automatizados', 'Selenium', 'Jest', 'Cypress'],
      },
    ];

    for (const profData of professionals) {
      const professional = professionalRepository.create(profData);
      await professionalRepository.save(professional);
    }

    logger.info(`✅ ${professionals.length} profissionais criados`);

    // Criar parâmetros padrão
    const parameters = [
      {
        name: 'tax',
        value: 0.21,
        type: 'percentage',
        description: 'Taxa de impostos aplicada sobre o custo base (21%)',
      },
      {
        name: 'sga',
        value: 0.10,
        type: 'percentage',
        description: 'SG&A - Despesas administrativas e gerais (10%)',
      },
      {
        name: 'margin',
        value: 0.25,
        type: 'percentage',
        description: 'Margem de lucro aplicada no preço final (25%)',
      },
    ];

    for (const paramData of parameters) {
      const parameter = parameterRepository.create(paramData);
      await parameterRepository.save(parameter);
    }

    logger.info(`✅ ${parameters.length} parâmetros criados`);
    logger.info('🎉 Seed de dados iniciais concluído com sucesso!');
  } catch (error) {
    logger.error('❌ Erro ao criar dados iniciais:', error);
    throw error;
  }
}
