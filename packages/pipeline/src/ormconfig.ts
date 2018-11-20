import { ConnectionOptions } from 'typeorm';

import {
    Block,
    ExchangeCancelEvent,
    ExchangeCancelUpToEvent,
    ExchangeFillEvent,
    Relayer,
    SraOrder,
    SraOrdersObservedTimeStamp,
    Transaction,
    TrustedToken,
} from './entities';

const entities = [
    Block,
    ExchangeCancelEvent,
    ExchangeCancelUpToEvent,
    ExchangeFillEvent,
    Relayer,
    SraOrder,
    SraOrdersObservedTimeStamp,
    Transaction,
    TrustedToken,
];

const config: ConnectionOptions = {
    type: 'postgres',
    url: process.env.ZEROEX_DATA_PIPELINE_DB_URL,
    synchronize: false,
    // logging: ['error'],
    entities,
    migrations: ['./lib/migrations/**/*.js'],
};

module.exports = config;
