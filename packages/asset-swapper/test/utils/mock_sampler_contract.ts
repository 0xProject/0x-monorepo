import { ContractTxFunctionObj } from '@0x/base-contract';
import { constants } from '@0x/contracts-test-utils';
import { Order } from '@0x/types';
import { BigNumber, hexUtils } from '@0x/utils';

import { ERC20BridgeSamplerContract } from '../../src/wrappers';

export type GetOrderFillableAssetAmountResult = BigNumber[];
export type GetOrderFillableAssetAmountHandler = (
    orders: Order[],
    signatures: string[],
    devUtilsAddress: string,
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
export type SampleSellsKyberHandler = (
    reserveId: string,
    takerToken: string,
    makerToken: string,
    takerTokenAmounts: BigNumber[],
) => [string, SampleResults];
export type SampleBuysKyberHandler = (
    reserveId: string,
    takerToken: string,
    makerToken: string,
    makerTokenAmounts: BigNumber[],
) => [string, SampleResults];
export type SampleBuysMultihopHandler = (path: string[], takerTokenAmounts: BigNumber[]) => SampleResults;
export type SampleSellsLPHandler = (
    registryAddress: string,
    takerToken: string,
    makerToken: string,
    takerTokenAmounts: BigNumber[],
) => [SampleResults, string];
export type SampleSellsMultihopHandler = (path: string[], takerTokenAmounts: BigNumber[]) => SampleResults;
export type SampleSellsMBHandler = (
    multiBridgeAddress: string,
    takerToken: string,
    intermediateToken: string,
    makerToken: string,
    takerTokenAmounts: BigNumber[],
) => SampleResults;

const DUMMY_PROVIDER = {
    sendAsync: (..._args: any[]): any => {
        /* no-op */
    },
};

interface Handlers {
    getOrderFillableMakerAssetAmounts: GetOrderFillableAssetAmountHandler;
    getOrderFillableTakerAssetAmounts: GetOrderFillableAssetAmountHandler;
    sampleSellsFromKyberNetwork: SampleSellsKyberHandler;
    sampleSellsFromLiquidityProviderRegistry: SampleSellsLPHandler;
    sampleSellsFromMultiBridge: SampleSellsMBHandler;
    sampleSellsFromEth2Dai: SampleSellsHandler;
    sampleSellsFromUniswap: SampleSellsHandler;
    sampleSellsFromUniswapV2: SampleSellsMultihopHandler;
    sampleBuysFromEth2Dai: SampleBuysHandler;
    sampleBuysFromUniswap: SampleBuysHandler;
    sampleBuysFromUniswapV2: SampleBuysMultihopHandler;
    sampleBuysFromLiquidityProviderRegistry: SampleSellsLPHandler;
}

// tslint:disable: no-unbound-method

export class MockSamplerContract extends ERC20BridgeSamplerContract {
    private readonly _handlers: Partial<Handlers> = {};

    public constructor(handlers: Partial<Handlers> = {}) {
        super(constants.NULL_ADDRESS, DUMMY_PROVIDER);
        this._handlers = handlers;
    }

    public batchCall(callDatas: string[]): ContractTxFunctionObj<string[]> {
        return {
            ...super.batchCall(callDatas),
            callAsync: async (..._callArgs: any[]) => callDatas.map(callData => this._callEncodedFunction(callData)),
        };
    }

    public getOrderFillableMakerAssetAmounts(
        orders: Order[],
        signatures: string[],
    ): ContractTxFunctionObj<GetOrderFillableAssetAmountResult> {
        return this._wrapCall(
            super.getOrderFillableMakerAssetAmounts,
            this._handlers.getOrderFillableMakerAssetAmounts,
            orders,
            signatures,
            constants.NULL_ADDRESS,
        );
    }

    public getOrderFillableTakerAssetAmounts(
        orders: Order[],
        signatures: string[],
    ): ContractTxFunctionObj<GetOrderFillableAssetAmountResult> {
        return this._wrapCall(
            super.getOrderFillableTakerAssetAmounts,
            this._handlers.getOrderFillableTakerAssetAmounts,
            orders,
            signatures,
            constants.NULL_ADDRESS,
        );
    }

    public sampleSellsFromKyberNetwork(
        reserveId: string,
        takerToken: string,
        makerToken: string,
        takerAssetAmounts: BigNumber[],
    ): ContractTxFunctionObj<[string, BigNumber[]]> {
        return this._wrapCall(
            super.sampleSellsFromKyberNetwork,
            this._handlers.sampleSellsFromKyberNetwork,
            reserveId,
            takerToken,
            makerToken,
            takerAssetAmounts,
        );
    }

    public sampleSellsFromEth2Dai(
        takerToken: string,
        makerToken: string,
        takerAssetAmounts: BigNumber[],
    ): ContractTxFunctionObj<BigNumber[]> {
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
    ): ContractTxFunctionObj<BigNumber[]> {
        return this._wrapCall(
            super.sampleSellsFromUniswap,
            this._handlers.sampleSellsFromUniswap,
            takerToken,
            makerToken,
            takerAssetAmounts,
        );
    }

    public sampleSellsFromUniswapV2(
        path: string[],
        takerAssetAmounts: BigNumber[],
    ): ContractTxFunctionObj<BigNumber[]> {
        return this._wrapCall(
            super.sampleSellsFromUniswapV2,
            this._handlers.sampleSellsFromUniswapV2,
            path,
            takerAssetAmounts,
        );
    }

    public sampleSellsFromLiquidityProviderRegistry(
        registryAddress: string,
        takerToken: string,
        makerToken: string,
        takerAssetAmounts: BigNumber[],
    ): ContractTxFunctionObj<[BigNumber[], string]> {
        return this._wrapCall(
            super.sampleSellsFromLiquidityProviderRegistry,
            this._handlers.sampleSellsFromLiquidityProviderRegistry,
            registryAddress,
            takerToken,
            makerToken,
            takerAssetAmounts,
        );
    }

    public sampleSellsFromMultiBridge(
        multiBridgeAddress: string,
        takerToken: string,
        intermediateToken: string,
        makerToken: string,
        takerAssetAmounts: BigNumber[],
    ): ContractTxFunctionObj<BigNumber[]> {
        return this._wrapCall(
            super.sampleSellsFromMultiBridge,
            this._handlers.sampleSellsFromMultiBridge,
            multiBridgeAddress,
            takerToken,
            intermediateToken,
            makerToken,
            takerAssetAmounts,
        );
    }

    public sampleBuysFromEth2Dai(
        takerToken: string,
        makerToken: string,
        makerAssetAmounts: BigNumber[],
    ): ContractTxFunctionObj<BigNumber[]> {
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
    ): ContractTxFunctionObj<BigNumber[]> {
        return this._wrapCall(
            super.sampleBuysFromUniswap,
            this._handlers.sampleBuysFromUniswap,
            takerToken,
            makerToken,
            makerAssetAmounts,
        );
    }

    public sampleBuysFromUniswapV2(path: string[], makerAssetAmounts: BigNumber[]): ContractTxFunctionObj<BigNumber[]> {
        return this._wrapCall(
            super.sampleBuysFromUniswapV2,
            this._handlers.sampleBuysFromUniswapV2,
            path,
            makerAssetAmounts,
        );
    }

    private _callEncodedFunction(callData: string): string {
        if (callData === '0x') {
            return callData;
        }
        // tslint:disable-next-line: custom-no-magic-numbers
        const selector = hexUtils.slice(callData, 0, 4);
        for (const [name, handler] of Object.entries(this._handlers)) {
            if (handler && this.getSelector(name) === selector) {
                const args = this.getABIDecodedTransactionData<any>(name, callData);
                const result = (handler as any)(...args);
                const encoder = this._lookupAbiEncoder(this.getFunctionSignature(name));
                if (encoder.getReturnValueDataItem().components!.length === 1) {
                    return encoder.encodeReturnValues([result]);
                } else {
                    return encoder.encodeReturnValues(result);
                }
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
        superFn: (this: MockSamplerContract, ...args: TArgs) => ContractTxFunctionObj<TResult>,
        handler?: (this: MockSamplerContract, ...args: TArgs) => TResult,
        // tslint:disable-next-line: trailing-comma
        ...args: TArgs
    ): ContractTxFunctionObj<TResult> {
        return {
            ...superFn.call(this, ...args),
            callAsync: async (..._callArgs: any[]): Promise<TResult> => {
                if (!handler) {
                    throw new Error(`${superFn.name} handler undefined`);
                }
                return handler.call(this, ...args);
            },
        };
    }
}
