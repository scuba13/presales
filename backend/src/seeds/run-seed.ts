import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { seedInitialData } from './initial-data';
import { logger } from '../config/logger';

async function runSeed() {
  try {
    // Conectar ao banco de dados
    await AppDataSource.initialize();
    logger.info('✅ Conexão com banco de dados estabelecida');

    // Executar seed
    await seedInitialData();

    // Fechar conexão
    await AppDataSource.destroy();
    logger.info('👋 Conexão com banco de dados encerrada');

    process.exit(0);
  } catch (error) {
    logger.error('❌ Erro ao executar seed:', error);
    process.exit(1);
  }
}

runSeed();
