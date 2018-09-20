import { ConnectionOptions } from 'typeorm';

export const config: ConnectionOptions = {
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
