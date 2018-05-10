import { BigNumber } from '@0xproject/utils';

import {
    BlockParam,
    BlockParamLiteral,
    ContractAbi,
    ContractEventArg,
    ExchangeContractErrs,
    FilterObject,
    LogEntryEvent,
    LogWithDecodedArgs,
    Order,
    OrderState,
    SignedOrder,
} from '@0xproject/types';

export enum OrderWatcherError {
    SubscriptionAlreadyPresent = 'SUBSCRIPTION_ALREADY_PRESENT',
    SubscriptionNotFound = 'SUBSCRIPTION_NOT_FOUND',
}

export type EventWatcherCallback = (err: null | Error, log?: LogEntryEvent) => void;

/**
 * orderExpirationCheckingIntervalMs: How often to check for expired orders. Default=50.
 * eventPollingIntervalMs: How often to poll the Ethereum node for new events. Default=200.
 * expirationMarginMs: Amount of time before order expiry that you'd like to be notified
 * of an orders expiration. Default=0.
 * cleanupJobIntervalMs: How often to run a cleanup job which revalidates all the orders. Default=1hr.
 * stateLayer: Optional blockchain state layer OrderWatcher will monitor for new events. Default=latest.
 */
export interface OrderWatcherConfig {
    orderExpirationCheckingIntervalMs?: number;
    eventPollingIntervalMs?: number;
    expirationMarginMs?: number;
    cleanupJobIntervalMs?: number;
    stateLayer: BlockParamLiteral;
}

export type OnOrderStateChangeCallback = (err: Error | null, orderState?: OrderState) => void;

export enum InternalOrderWatcherError {
    NoAbiDecoder = 'NO_ABI_DECODER',
    ZrxNotInTokenRegistry = 'ZRX_NOT_IN_TOKEN_REGISTRY',
    WethNotInTokenRegistry = 'WETH_NOT_IN_TOKEN_REGISTRY',
}
