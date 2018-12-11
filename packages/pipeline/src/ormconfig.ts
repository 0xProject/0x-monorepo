import { ConnectionOptions } from 'typeorm';

import {
    Block,
    DexTrade,
    ERC20ApprovalEvent,
    ExchangeCancelEvent,
    ExchangeCancelUpToEvent,
    ExchangeFillEvent,
    OHLCVExternal,
    Relayer,
    SraOrder,
    SraOrdersObservedTimeStamp,
    TokenMetadata,
    TokenOrderbookSnapshot,
    Transaction,
    TrustedToken,
} from './entities';

const entities = [
    Block,
    DexTrade,
    ExchangeCancelEvent,
    ExchangeCancelUpToEvent,
    ExchangeFillEvent,
    ERC20ApprovalEvent,
    OHLCVExternal,
    Relayer,
    SraOrder,
    SraOrdersObservedTimeStamp,
    TokenMetadata,
    TokenOrderbookSnapshot,
    Transaction,
    TrustedToken,
];

const config: ConnectionOptions = {
    type: 'postgres',
    url: process.env.ZEROEX_DATA_PIPELINE_DB_URL,
    synchronize: false,
    logging: ['error'],
    entities,
    migrations: ['./lib/migrations/**/*.js'],
};

module.exports = config;
