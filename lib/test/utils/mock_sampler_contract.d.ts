import { ContractFunctionObj } from '@0x/base-contract';
import { IERC20BridgeSamplerContract } from '@0x/contract-wrappers';
import { Order } from '@0x/types';
import { BigNumber } from '@0x/utils';
export declare type GetOrderFillableAssetAmountResult = BigNumber[];
export declare type GetOrderFillableAssetAmountHandler = (orders: Order[], signatures: string[]) => GetOrderFillableAssetAmountResult;
export declare type SampleResults = BigNumber[];
export declare type SampleSellsHandler = (takerToken: string, makerToken: string, takerTokenAmounts: BigNumber[]) => SampleResults;
export declare type SampleBuysHandler = (takerToken: string, makerToken: string, makerTokenAmounts: BigNumber[]) => SampleResults;
interface Handlers {
    getOrderFillableMakerAssetAmounts: GetOrderFillableAssetAmountHandler;
    getOrderFillableTakerAssetAmounts: GetOrderFillableAssetAmountHandler;
    sampleSellsFromKyberNetwork: SampleSellsHandler;
    sampleSellsFromEth2Dai: SampleSellsHandler;
    sampleSellsFromUniswap: SampleSellsHandler;
    sampleBuysFromEth2Dai: SampleBuysHandler;
    sampleBuysFromUniswap: SampleBuysHandler;
}
export declare class MockSamplerContract extends IERC20BridgeSamplerContract {
    private readonly _handlers;
    constructor(handlers?: Partial<Handlers>);
    batchCall(callDatas: string[]): ContractFunctionObj<string[]>;
    getOrderFillableMakerAssetAmounts(orders: Order[], signatures: string[]): ContractFunctionObj<GetOrderFillableAssetAmountResult>;
    getOrderFillableTakerAssetAmounts(orders: Order[], signatures: string[]): ContractFunctionObj<GetOrderFillableAssetAmountResult>;
    sampleSellsFromKyberNetwork(takerToken: string, makerToken: string, takerAssetAmounts: BigNumber[]): ContractFunctionObj<GetOrderFillableAssetAmountResult>;
    sampleSellsFromEth2Dai(takerToken: string, makerToken: string, takerAssetAmounts: BigNumber[]): ContractFunctionObj<GetOrderFillableAssetAmountResult>;
    sampleSellsFromUniswap(takerToken: string, makerToken: string, takerAssetAmounts: BigNumber[]): ContractFunctionObj<GetOrderFillableAssetAmountResult>;
    sampleBuysFromEth2Dai(takerToken: string, makerToken: string, makerAssetAmounts: BigNumber[]): ContractFunctionObj<GetOrderFillableAssetAmountResult>;
    sampleBuysFromUniswap(takerToken: string, makerToken: string, makerAssetAmounts: BigNumber[]): ContractFunctionObj<GetOrderFillableAssetAmountResult>;
    private _callEncodedFunction;
    private _wrapCall;
}
export {};
//# sourceMappingURL=mock_sampler_contract.d.ts.map