import { ContractAddresses } from '@0x/contract-addresses';
import { CollapsedFill, OptimizedMarketOrder, OrderDomain } from './types';
export declare class CreateOrderUtils {
    private readonly _contractAddress;
    constructor(contractAddress: ContractAddresses);
    createSellOrdersFromPath(orderDomain: OrderDomain, inputToken: string, outputToken: string, path: CollapsedFill[], bridgeSlippage: number): OptimizedMarketOrder[];
    createBuyOrdersFromPath(orderDomain: OrderDomain, inputToken: string, outputToken: string, path: CollapsedFill[], bridgeSlippage: number): OptimizedMarketOrder[];
    private _getBridgeAddressFromSource;
}
//# sourceMappingURL=create_order.d.ts.map