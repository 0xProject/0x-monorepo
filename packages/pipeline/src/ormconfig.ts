import { ConnectionOptions } from 'typeorm';

export const testConfig: ConnectionOptions = {
    type: 'sqlite',
    database: 'database.sqlite',
    synchronize: true,
    logging: false,
    entities: ['./lib/src/entities/**/*.js'],
    migrations: ['./lib/src/migrations/**/*.js'],
    cli: {
        entitiesDir: 'lib/src/entities',
        migrationsDir: 'lib/src/migrations',
    },
};

export const deployConfig: ConnectionOptions = {
    type: 'postgres',
    url: process.env.ZEROEX_DATA_PIPELINE_DB_URL,
    synchronize: true,
    logging: true,
    entities: ['./lib/src/entities/**/*.js'],
    migrations: ['./lib/src/migrations/**/*.js'],
    cli: {
        entitiesDir: 'lib/src/entities',
        migrationsDir: 'lib/src/migrations',
    },
};
