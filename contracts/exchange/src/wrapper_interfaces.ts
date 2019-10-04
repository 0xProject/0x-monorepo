import { PromiseWithTransactionHash } from '@0x/base-contract';
import { BlockParam, CallData, TransactionReceiptWithDecodedLogs, TxData } from 'ethereum-types';

// Generated Wrapper Interfaces
export interface AssetProxyDispatcher {
    registerAssetProxy: {
        awaitTransactionSuccessAsync: (
            assetProxy: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ) => PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>;
    };
    getAssetProxy: {
        callAsync(assetProxyId: string, callData?: Partial<CallData>, defaultBlock?: BlockParam): Promise<string>;
    };
}

export interface Authorizable extends Ownable {
    addAuthorizedAddress: {
        awaitTransactionSuccessAsync: (
            target: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ) => PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>;
    };
    removeAuthorizedAddress: {
        awaitTransactionSuccessAsync: (
            target: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ) => PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>;
    };
    authorized: {
        callAsync(authority: string, callData?: Partial<CallData>, defaultBlock?: BlockParam): Promise<boolean>;
    };
}

export interface Ownable {
    transferOwnership: {
        awaitTransactionSuccessAsync: (
            newOwner: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ) => PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>;
    };
    owner: {
        callAsync(callData?: Partial<CallData>, defaultBlock?: BlockParam): Promise<string>;
    };
}
