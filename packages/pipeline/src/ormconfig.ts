import { ConnectionOptions } from 'typeorm';

import {
    Block,
    CopperActivity,
    CopperActivityType,
    CopperCustomField,
    CopperLead,
    CopperOpportunity,
    DexTrade,
    ERC20ApprovalEvent,
    EtherscanTransaction,
    ExchangeCancelEvent,
    ExchangeCancelUpToEvent,
    ExchangeFillEvent,
    GreenhouseApplication,
    NonfungibleDotComTrade,
    OHLCVExternal,
    Relayer,
    Slippage,
    SraOrder,
    SraOrdersObservedTimeStamp,
    TokenMetadata,
    TokenOrderbookSnapshot,
    Transaction,
} from './entities';

const entities = [
    Block,
    CopperActivity,
    CopperActivityType,
    CopperCustomField,
    CopperLead,
    CopperOpportunity,
    DexTrade,
    ERC20ApprovalEvent,
    EtherscanTransaction,
    ExchangeCancelEvent,
    ExchangeCancelUpToEvent,
    ExchangeFillEvent,
    GreenhouseApplication,
    NonfungibleDotComTrade,
    OHLCVExternal,
    Relayer,
    Slippage,
    SraOrder,
    SraOrdersObservedTimeStamp,
    TokenMetadata,
    TokenOrderbookSnapshot,
    Transaction,
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
