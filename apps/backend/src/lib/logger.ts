import pino from 'pino';
import pinoHttp from 'pino-http';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
    base: undefined,
    redact: ['req.headers.authorization', 'req.headers.cookie'],
  },
  isDev
    ? pino.transport({
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:standard' },
      })
    : undefined,
);

export const requestLogger = pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url === '/health',
  },
  redact: ['req.headers.authorization', 'req.headers.cookie'],
});

