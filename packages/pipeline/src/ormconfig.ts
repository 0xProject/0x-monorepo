import { ConnectionOptions } from 'typeorm';

import {
    Block,
    ExchangeCancelEvent,
    ExchangeCancelUpToEvent,
    ExchangeFillEvent,
    OHLCVExternal,
    Relayer,
    SraOrder,
    SraOrdersObservedTimeStamp,
    TokenMetadata,
    Transaction,
} from './entities';

const entities = [
    Block,
    ExchangeCancelEvent,
    ExchangeCancelUpToEvent,
    ExchangeFillEvent,
    OHLCVExternal,
    Relayer,
    SraOrder,
    SraOrdersObservedTimeStamp,
    TokenMetadata,
    Transaction,
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
