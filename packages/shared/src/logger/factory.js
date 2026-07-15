import pino from 'pino';
export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    redact: {
        paths: [
            'password',
            'token',
            'secret',
            'authorization',
            'req.headers.authorization',
        ],
        censor: '[REDACTED]',
    },
});
export default logger;
