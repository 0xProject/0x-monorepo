import { AcceptedRejectedOrders, Orderbook } from '@0x/orderbook';
import { Web3ProviderEngine } from '@0x/subproviders';
import { APIOrder, AssetPairsItem, SignedOrder } from '@0x/types';
import * as TypeMoq from 'typemoq';

import { SwapQuoter } from '../../src/swap_quoter';
import { PrunedSignedOrder } from '../../src/types';

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
        .setup(async op => op.getAvailableAssetDatasAsync())
        .returns(async () => Promise.resolve(availableAssetDatas))
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

const mockGetPrunedSignedOrdersAsync = (
    mockedSwapQuoter: TypeMoq.IMock<SwapQuoter>,
    makerAssetData: string,
    takerAssetData: string,
    prunedOrders: PrunedSignedOrder[],
): void => {
    mockedSwapQuoter
        .setup(async a => a.getPrunedSignedOrdersAsync(makerAssetData, takerAssetData))
        .returns(async () => Promise.resolve(prunedOrders))
        .verifiable(TypeMoq.Times.once());
};

export const mockedSwapQuoterWithPrunedSignedOrders = (
    provider: Web3ProviderEngine,
    orderbook: Orderbook,
    makerAssetData: string,
    takerAssetData: string,
    prunedOrders: PrunedSignedOrder[],
): TypeMoq.IMock<SwapQuoter> => {
    const mockedAssetQuoter = partiallyMockedSwapQuoter(provider, orderbook);
    mockGetPrunedSignedOrdersAsync(mockedAssetQuoter, makerAssetData, takerAssetData, prunedOrders);
    return mockedAssetQuoter;
};
