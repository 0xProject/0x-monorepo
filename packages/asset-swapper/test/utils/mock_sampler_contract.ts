import { ContractFunctionObj } from '@0x/base-contract';
import { IERC20BridgeSamplerContract } from '@0x/contract-wrappers';
import { constants } from '@0x/contracts-test-utils';
import { Order } from '@0x/types';
import { BigNumber, hexUtils } from '@0x/utils';

export type GetOrderFillableAssetAmountResult = BigNumber[];
export type GetOrderFillableAssetAmountHandler = (
    orders: Order[],
    signatures: string[],
) => GetOrderFillableAssetAmountResult;

export type SampleResults = BigNumber[];
export type SampleSellsHandler = (
    takerToken: string,
    makerToken: string,
    takerTokenAmounts: BigNumber[],
) => SampleResults;
export type SampleBuysHandler = (
    takerToken: string,
    makerToken: string,
    makerTokenAmounts: BigNumber[],
) => SampleResults;

const DUMMY_PROVIDER = {
    sendAsync: (...args: any[]): any => {
        /* no-op */
    },
};

interface Handlers {
    getOrderFillableMakerAssetAmounts: GetOrderFillableAssetAmountHandler;
    getOrderFillableTakerAssetAmounts: GetOrderFillableAssetAmountHandler;
    sampleSellsFromKyberNetwork: SampleSellsHandler;
    sampleSellsFromEth2Dai: SampleSellsHandler;
    sampleSellsFromUniswap: SampleSellsHandler;
    sampleBuysFromEth2Dai: SampleBuysHandler;
    sampleBuysFromUniswap: SampleBuysHandler;
}

export class MockSamplerContract extends IERC20BridgeSamplerContract {
    private readonly _handlers: Partial<Handlers> = {};

    public constructor(handlers: Partial<Handlers> = {}) {
        super(constants.NULL_ADDRESS, DUMMY_PROVIDER);
        this._handlers = handlers;
    }

    public batchCall(callDatas: string[]): ContractFunctionObj<string[]> {
        return {
            ...super.batchCall(callDatas),
            callAsync: async (...callArgs: any[]) => callDatas.map(callData => this._callEncodedFunction(callData)),
        };
    }

    public getOrderFillableMakerAssetAmounts(
        orders: Order[],
        signatures: string[],
    ): ContractFunctionObj<GetOrderFillableAssetAmountResult> {
        return this._wrapCall(
            super.getOrderFillableMakerAssetAmounts,
            this._handlers.getOrderFillableMakerAssetAmounts,
            orders,
            signatures,
        );
    }

    public getOrderFillableTakerAssetAmounts(
        orders: Order[],
        signatures: string[],
    ): ContractFunctionObj<GetOrderFillableAssetAmountResult> {
        return this._wrapCall(
            super.getOrderFillableTakerAssetAmounts,
            this._handlers.getOrderFillableTakerAssetAmounts,
            orders,
            signatures,
        );
    }

    public sampleSellsFromKyberNetwork(
        takerToken: string,
        makerToken: string,
        takerAssetAmounts: BigNumber[],
    ): ContractFunctionObj<GetOrderFillableAssetAmountResult> {
        return this._wrapCall(
            super.sampleSellsFromKyberNetwork,
            this._handlers.sampleSellsFromKyberNetwork,
            takerToken,
            makerToken,
            takerAssetAmounts,
        );
    }

    public sampleSellsFromEth2Dai(
        takerToken: string,
        makerToken: string,
        takerAssetAmounts: BigNumber[],
    ): ContractFunctionObj<GetOrderFillableAssetAmountResult> {
        return this._wrapCall(
            super.sampleSellsFromEth2Dai,
            this._handlers.sampleSellsFromEth2Dai,
            takerToken,
            makerToken,
            takerAssetAmounts,
        );
    }

    public sampleSellsFromUniswap(
        takerToken: string,
        makerToken: string,
        takerAssetAmounts: BigNumber[],
    ): ContractFunctionObj<GetOrderFillableAssetAmountResult> {
        return this._wrapCall(
            super.sampleSellsFromUniswap,
            this._handlers.sampleSellsFromUniswap,
            takerToken,
            makerToken,
            takerAssetAmounts,
        );
    }

    public sampleBuysFromEth2Dai(
        takerToken: string,
        makerToken: string,
        makerAssetAmounts: BigNumber[],
    ): ContractFunctionObj<GetOrderFillableAssetAmountResult> {
        return this._wrapCall(
            super.sampleBuysFromEth2Dai,
            this._handlers.sampleBuysFromEth2Dai,
            takerToken,
            makerToken,
            makerAssetAmounts,
        );
    }

    public sampleBuysFromUniswap(
        takerToken: string,
        makerToken: string,
        makerAssetAmounts: BigNumber[],
    ): ContractFunctionObj<GetOrderFillableAssetAmountResult> {
        return this._wrapCall(
            super.sampleBuysFromUniswap,
            this._handlers.sampleBuysFromUniswap,
            takerToken,
            makerToken,
            makerAssetAmounts,
        );
    }

    private _callEncodedFunction(callData: string): string {
        // tslint:disable-next-line: custom-no-magic-numbers
        const selector = hexUtils.slice(callData, 0, 4);
        for (const [name, handler] of Object.entries(this._handlers)) {
            if (handler && this.getSelector(name) === selector) {
                const args = this.getABIDecodedTransactionData<any>(name, callData);
                const result = (handler as any)(...args);
                return this._lookupAbiEncoder(this.getFunctionSignature(name)).encodeReturnValues([result]);
            }
        }
        if (selector === this.getSelector('batchCall')) {
            const calls = this.getABIDecodedTransactionData<string[]>('batchCall', callData);
            const results = calls.map(cd => this._callEncodedFunction(cd));
            return this._lookupAbiEncoder(this.getFunctionSignature('batchCall')).encodeReturnValues([results]);
        }
        throw new Error(`Unkown selector: ${selector}`);
    }

    private _wrapCall<TArgs extends any[], TResult>(
        superFn: (this: MockSamplerContract, ...args: TArgs) => ContractFunctionObj<TResult>,
        handler?: (this: MockSamplerContract, ...args: TArgs) => TResult,
        // tslint:disable-next-line: trailing-comma
        ...args: TArgs
    ): ContractFunctionObj<TResult> {
        return {
            ...superFn.call(this, ...args),
            callAsync: async (...callArgs: any[]): Promise<TResult> => {
                if (!handler) {
                    throw new Error(`${superFn.name} handler undefined`);
                }
                return handler.call(this, ...args);
            },
        };
    }
}
