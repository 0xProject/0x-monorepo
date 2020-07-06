import { Order, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { SupportedProvider } from 'ethereum-types';
import { CreateOrderOpts } from './types';
export declare const orderFactory: {
    createOrderFromPartial(partialOrder: Partial<Order>): Order;
    createSignedOrderFromPartial(partialSignedOrder: Partial<SignedOrder>): SignedOrder;
    createOrder(makerAddress: string, makerAssetAmount: BigNumber, makerAssetData: string, takerAssetAmount: BigNumber, takerAssetData: string, exchangeAddress: string, chainId: number, createOrderOpts?: CreateOrderOpts): Order;
    createSignedOrderAsync(supportedProvider: SupportedProvider, makerAddress: string, makerAssetAmount: BigNumber, makerAssetData: string, takerAssetAmount: BigNumber, takerAssetData: string, exchangeAddress: string, createOrderOpts?: CreateOrderOpts | undefined): Promise<SignedOrder>;
};
//# sourceMappingURL=order_factory.d.ts.map