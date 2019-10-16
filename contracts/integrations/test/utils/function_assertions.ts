import { PromiseWithTransactionHash } from '@0x/base-contract';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';

export interface ContractGetterFunction<TCallArgs extends any[]> {
    callAsync: (...args: TCallArgs) => Promise<any>;
    getABIEncodedTransactionData: (...args: TCallArgs) => string;
}

export interface ContractWrapperFunction<TAwaitArgs extends any[], TCallArgs extends any[]>
    extends ContractGetterFunction<TCallArgs> {
    awaitTransactionSuccessAsync?: (
        ...args: TAwaitArgs
    ) => PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>;
}

export interface Condition {
    before: (...args: any[]) => Promise<any>;
    after: (beforeInfo: any, result: Result, ...args: any[]) => Promise<any>;
}

export class FunctionAssertion<TAwaitArgs extends any[], TCallArgs extends any[]> {
    // A before and an after assertion that will be called around the wrapper function.
    public condition: Condition;

    // The wrapper function that will be wrapped in assertions.
    public wrapperFunction: ContractWrapperFunction<TAwaitArgs, TCallArgs>;

    constructor(wrapperFunction: ContractWrapperFunction<TAwaitArgs, TCallArgs>, condition: Condition) {
        this.condition = condition;
        this.wrapperFunction = wrapperFunction;
    }

    /**
     * Runs the wrapped function and fails if the before or after assertions fail.
     * @param ...args The args to the contract wrapper function.
     */
    public async runAsync(args: TAwaitArgs & TCallArgs): Promise<{ beforeInfo: any; afterInfo: any }> {
        // Call the before condition.
        const beforeInfo = await this.condition.before(...args);

        // Initialize the callResult so that the default success value is true.
        let callResult: Result = { success: true };

        // Try to make the call to the function. If it is successful, pass the
        // result and receipt to the after condition.
        try {
            callResult.data = await this.wrapperFunction.callAsync(...args);
            callResult.receipt =
                this.wrapperFunction.awaitTransactionSuccessAsync !== undefined
                    ? await this.wrapperFunction.awaitTransactionSuccessAsync(...args)
                    : undefined;
        } catch (error) {
            callResult.data = error;
            callResult.success = false;
            callResult.receipt = undefined;
        }

        // Call the after condition.
        const afterInfo = await this.condition.after(beforeInfo, callResult, ...args);

        return {
            beforeInfo,
            afterInfo,
        };
    }
}
