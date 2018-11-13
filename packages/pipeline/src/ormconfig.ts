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

const config: ConnectionOptions = {
    type: 'postgres',
    url: process.env.ZEROEX_DATA_PIPELINE_DB_URL,
    synchronize: false,
    logging: false,
    entities,
    migrations: ['./lib/migrations/**/*.js'],
};

module.exports = config;
