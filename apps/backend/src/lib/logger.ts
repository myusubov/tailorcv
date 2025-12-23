import pino from 'pino';
import pinoHttp from 'pino-http';
import { env } from '../config/env';

const isDev = env.NODE_ENV !== 'production';

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
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
        remotePort: req.remotePort,
        headers: {
          'user-agent': req.headers?.['user-agent'],
          'fly-request-id': req.headers?.['fly-request-id'],
          'x-request-id': req.headers?.['x-request-id'],
        },
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
  customProps: (req, res) => ({
    responseTime: res.responseTime,
  }),
});
