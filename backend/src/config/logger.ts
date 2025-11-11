import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Formato customizado para logs
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Criar logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // Console
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),
    // Arquivo de erros
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Arquivo combinado
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Se não estiver em produção, log detalhado
if (process.env.NODE_ENV !== 'production') {
  logger.level = 'debug';
}

export default logger;
