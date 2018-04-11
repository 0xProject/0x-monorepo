export const configs = {
    AURORA_USER: process.env.AURORA_USER || '',
    AURORA_DB: process.env.AURORA_DB || '',
    AURORA_PASSWORD: process.env.AURORA_PASSWORD || '',
    AURORA_PORT: parseInt(process.env.AURORA_PORT || '5432', 10),
    AURORA_HOST: process.env.AURORA_HOST,
    ROLLBAR_ACCESS_KEY: process.env.ROLLBAR_ACCESS_KEY,
    ENVIRONMENT: process.env.NODE_ENV || 'development',
};
