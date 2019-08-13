import { AcceptedRejectedOrders, Orderbook } from '@0x/orderbook';
import { Web3ProviderEngine } from '@0x/subproviders';
import { APIOrder, AssetPairsItem, SignedOrder } from '@0x/types';
import * as TypeMoq from 'typemoq';

import { SwapQuoter } from '../../src/swap_quoter';
import { OrdersAndFillableAmounts } from '../../src/types';

class OrderbookClass extends Orderbook {
    // tslint:disable-next-line:prefer-function-over-method
    public async getOrdersAsync(_makerAssetData: string, _takerAssetData: string): Promise<APIOrder[]> {
        return Promise.resolve([]);
    }
    // tslint:disable-next-line:prefer-function-over-method
    public async getAvailableAssetDatasAsync(): Promise<AssetPairsItem[]> {
        return Promise.resolve([]);
    }
    // tslint:disable-next-line:prefer-function-over-method
    public async addOrdersAsync(_orders: SignedOrder[]): Promise<AcceptedRejectedOrders> {
        return Promise.resolve({ accepted: [], rejected: [] });
    }
}
export const orderbookMock = () => {
    return TypeMoq.Mock.ofType(OrderbookClass, TypeMoq.MockBehavior.Strict);
};

export const mockAvailableAssetDatas = (
    mockOrderbook: TypeMoq.IMock<OrderbookClass>,
    availableAssetDatas: AssetPairsItem[],
) => {
    mockOrderbook
        .setup(op => op.getAvailableAssetDatasAsync())
        .returns(() => {
            return Promise.resolve(availableAssetDatas);
        })
        .verifiable(TypeMoq.Times.once());
    mockOrderbook
        .setup(o => (o as any)._orderProvider)
        .returns(() => undefined)
        .verifiable(TypeMoq.Times.atLeast(0));
    mockOrderbook
        .setup(o => (o as any)._orderStore)
        .returns(() => undefined)
        .verifiable(TypeMoq.Times.atLeast(0));
};

const partiallyMockedSwapQuoter = (provider: Web3ProviderEngine, orderbook: Orderbook): TypeMoq.IMock<SwapQuoter> => {
    const rawSwapQuoter = new SwapQuoter(provider, orderbook);
    const mockedSwapQuoter = TypeMoq.Mock.ofInstance(rawSwapQuoter, TypeMoq.MockBehavior.Loose, false);
    mockedSwapQuoter.callBase = true;
    return mockedSwapQuoter;
};

const mockGetOrdersAndAvailableAmounts = (
    mockedSwapQuoter: TypeMoq.IMock<SwapQuoter>,
    makerAssetData: string,
    takerAssetData: string,
    ordersAndFillableAmounts: OrdersAndFillableAmounts,
): void => {
    mockedSwapQuoter
        .setup(a => a.getOrdersAndFillableAmountsAsync(makerAssetData, takerAssetData))
        .returns(() => Promise.resolve(ordersAndFillableAmounts))
        .verifiable(TypeMoq.Times.once());
};

export const mockedSwapQuoterWithOrdersAndFillableAmounts = (
    provider: Web3ProviderEngine,
    orderbook: Orderbook,
    makerAssetData: string,
    takerAssetData: string,
    ordersAndFillableAmounts: OrdersAndFillableAmounts,
): TypeMoq.IMock<SwapQuoter> => {
    const mockedAssetQuoter = partiallyMockedSwapQuoter(provider, orderbook);
    mockGetOrdersAndAvailableAmounts(mockedAssetQuoter, makerAssetData, takerAssetData, ordersAndFillableAmounts);
    return mockedAssetQuoter;
};
