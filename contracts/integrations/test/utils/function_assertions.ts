import { PromiseWithTransactionHash } from '@0x/base-contract';
import { BlockParam, CallData, TransactionReceiptWithDecodedLogs, TxData } from 'ethereum-types';
import * as _ from 'lodash';

import { DeploymentManager } from './';

export interface ContractGetterFunction {
    callAsync: (...args: any[]) => Promise<any>;
    getABIEncodedTransactionData: (...args: any[]) => string;
}

export interface ContractWrapperFunction extends ContractGetterFunction {
    awaitTransactionSuccessAsync?: (...args: any[]) => PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>;
}

export interface Condition {
    before: (...args: any[]) => Promise<void>;
    after: (result: any, receipt: TransactionReceiptWithDecodedLogs | undefined, ...args: any[]) => Promise<void>;
}

export class FunctionAssertion {
    // A before and an after assertion that will be called around the wrapper function.
    public condition: Condition;

    // The wrapper function that will be wrapped in assertions.
    public wrapperFunction: ContractWrapperFunction;

    constructor(wrapperFunction: ContractWrapperFunction, condition: Condition) {
        this.condition = condition;
        this.wrapperFunction = wrapperFunction;
    }

    /**
     * Runs the wrapped function and fails if the before or after assertions fail.
     * @param ...args The args to the contract wrapper function.
     */
    public async runAsync(...args: any[]): Promise<void> {
        await this.condition.before(...args);
        const result = await this.wrapperFunction.callAsync(...args);
        const receipt =
            this.wrapperFunction.awaitTransactionSuccessAsync !== undefined
                ? await this.wrapperFunction.awaitTransactionSuccessAsync(...args)
                : undefined;
        await this.condition.after(result, receipt, ...args);
    }
}
