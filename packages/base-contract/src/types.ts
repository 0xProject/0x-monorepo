import { LogEntryEvent } from 'ethereum-types';

export type LogEvent = LogEntryEvent;

export interface ContractEvent<ContractEventArgs> {
    logIndex: number;
    transactionIndex: number;
    transactionHash: string;
    blockHash: string;
    blockNumber: number;
    address: string;
    type: string;
    event: string;
    args: ContractEventArgs;
}

export enum SubscriptionErrors {
    SubscriptionNotFound = 'SUBSCRIPTION_NOT_FOUND',
    SubscriptionAlreadyPresent = 'SUBSCRIPTION_ALREADY_PRESENT',
}
