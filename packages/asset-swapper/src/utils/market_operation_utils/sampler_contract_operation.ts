import { ContractFunctionObj } from '@0x/base-contract';
import { BigNumber } from '@0x/utils';

import { ERC20BridgeSamplerContract } from '../../wrappers';

import { ERC20BridgeSource, FillData, SourceInfo, SourceQuoteOperation } from './types';

export type Parameters<T> = T extends (...args: infer TArgs) => any ? TArgs : never;

export interface SamplerContractCall<
    TFunc extends (...args: any[]) => ContractFunctionObj<any>,
    TFillData extends FillData = FillData
> {
    contract: ERC20BridgeSamplerContract;
    function: TFunc;
    params: Parameters<TFunc>;
    callback?: (callResults: string, fillData: TFillData) => BigNumber[];
}

export class SamplerContractOperation<
    TFunc extends (...args: any[]) => ContractFunctionObj<any>,
    TFillData extends FillData = FillData
> implements SourceQuoteOperation<TFillData> {
    public readonly source: ERC20BridgeSource;
    public fillData: TFillData;
    private readonly _samplerContract: ERC20BridgeSamplerContract;
    private readonly _samplerFunction: TFunc;
    private readonly _params: Parameters<TFunc>;
    private readonly _callback?: (callResults: string, fillData: TFillData) => BigNumber[];

    constructor(opts: SourceInfo<TFillData> & SamplerContractCall<TFunc, TFillData>) {
        this.source = opts.source;
        this.fillData = opts.fillData || ({} as TFillData); // tslint:disable-line:no-object-literal-type-assertion
        this._samplerContract = opts.contract;
        this._samplerFunction = opts.function;
        this._params = opts.params;
        this._callback = opts.callback;
    }

    public encodeCall(): string {
        return this._samplerFunction
            .bind(this._samplerContract)(...this._params)
            .getABIEncodedTransactionData();
    }
    public handleCallResults(callResults: string): BigNumber[] {
        if (this._callback !== undefined) {
            return this._callback(callResults, this.fillData);
        } else {
            return this._samplerContract.getABIDecodedReturnData<BigNumber[]>(this._samplerFunction.name, callResults);
        }
    }
}
