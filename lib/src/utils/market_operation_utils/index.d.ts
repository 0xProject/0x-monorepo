import { ContractAddresses } from '@0x/contract-addresses';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { DexOrderSampler } from './sampler';
import { GetMarketOrdersOpts, OptimizedMarketOrder, OrderDomain } from './types';
export { DexOrderSampler } from './sampler';
export declare class MarketOperationUtils {
    private readonly _sampler;
    private readonly _orderDomain;
    private readonly _createOrderUtils;
    private readonly _wethAddress;
    constructor(_sampler: DexOrderSampler, contractAddresses: ContractAddresses, _orderDomain: OrderDomain);
    /**
     * gets the orders required for a market sell operation by (potentially) merging native orders with
     * generated bridge orders.
     * @param nativeOrders Native orders.
     * @param takerAmount Amount of taker asset to sell.
     * @param opts Options object.
     * @return orders.
     */
    getMarketSellOrdersAsync(nativeOrders: SignedOrder[], takerAmount: BigNumber, opts?: Partial<GetMarketOrdersOpts>): Promise<OptimizedMarketOrder[]>;
    /**
     * gets the orders required for a market buy operation by (potentially) merging native orders with
     * generated bridge orders.
     * @param nativeOrders Native orders.
     * @param makerAmount Amount of maker asset to buy.
     * @param opts Options object.
     * @return orders.
     */
    getMarketBuyOrdersAsync(nativeOrders: SignedOrder[], makerAmount: BigNumber, opts?: Partial<GetMarketOrdersOpts>): Promise<OptimizedMarketOrder[]>;
    /**
     * gets the orders required for a batch of market buy operations by (potentially) merging native orders with
     * generated bridge orders.
     * @param batchNativeOrders Batch of Native orders.
     * @param makerAmounts Array amount of maker asset to buy for each batch.
     * @param opts Options object.
     * @return orders.
     */
    getBatchMarketBuyOrdersAsync(batchNativeOrders: SignedOrder[][], makerAmounts: BigNumber[], opts?: Partial<GetMarketOrdersOpts>): Promise<Array<OptimizedMarketOrder[] | undefined>>;
    private _createBuyOrdersPathFromSamplerResultIfExists;
}
//# sourceMappingURL=index.d.ts.map