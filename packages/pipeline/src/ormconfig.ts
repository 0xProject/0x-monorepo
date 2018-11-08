import { ConnectionOptions } from 'typeorm';

import {
    Block,
    ExchangeCancelEvent,
    ExchangeCancelUpToEvent,
    ExchangeFillEvent,
    Relayer,
    SraOrder,
    Transaction,
} from './entities';

const entities = [
    Block,
    ExchangeCancelEvent,
    ExchangeCancelUpToEvent,
    ExchangeFillEvent,
    Relayer,
    SraOrder,
    Transaction,
];

export const testConfig: ConnectionOptions = {
    type: 'sqlite',
    database: 'database.sqlite',
    synchronize: true,
    logging: false,
    entities,
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
    logging: false,
    entities,
    migrations: ['./lib/src/migrations/**/*.js'],
    cli: {
        entitiesDir: 'lib/src/entities',
        migrationsDir: 'lib/src/migrations',
    },
};
