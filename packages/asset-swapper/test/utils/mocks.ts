import { Web3ProviderEngine } from '@0x/subproviders';
import * as TypeMoq from 'typemoq';

import { SwapQuoter } from '../../src/swap_quoter';
import { OrderProvider, OrderProviderResponse, OrdersAndFillableAmounts } from '../../src/types';

// tslint:disable:promise-function-async

// Implementing dummy class for using in mocks, see https://github.com/florinn/typemoq/issues/3
class OrderProviderClass implements OrderProvider {
    // tslint:disable-next-line:prefer-function-over-method
    public async getOrdersAsync(): Promise<OrderProviderResponse> {
        return Promise.resolve({ orders: [] });
    }
    // tslint:disable-next-line:prefer-function-over-method
    public async getAvailableMakerAssetDatasAsync(takerAssetData: string): Promise<string[]> {
        return Promise.resolve([]);
    }
    // tslint:disable-next-line:prefer-function-over-method
    public async getAvailableTakerAssetDatasAsync(makerAssetData: string): Promise<string[]> {
        return Promise.resolve([]);
    }
}

export const orderProviderMock = () => {
    return TypeMoq.Mock.ofType(OrderProviderClass, TypeMoq.MockBehavior.Strict);
};

export const mockAvailableMakerAssetDatas = (
    mockOrderProvider: TypeMoq.IMock<OrderProviderClass>,
    assetData: string,
    availableAssetDatas: string[],
) => {
    mockOrderProvider
        .setup(op => op.getAvailableMakerAssetDatasAsync(TypeMoq.It.isValue(assetData)))
        .returns(() => {
            return Promise.resolve(availableAssetDatas);
        })
        .verifiable(TypeMoq.Times.once());
};

export const mockAvailableTakerAssetDatas = (
    mockOrderProvider: TypeMoq.IMock<OrderProviderClass>,
    assetData: string,
    availableAssetDatas: string[],
) => {
    mockOrderProvider
        .setup(op => op.getAvailableTakerAssetDatasAsync(TypeMoq.It.isValue(assetData)))
        .returns(() => {
            return Promise.resolve(availableAssetDatas);
        })
        .verifiable(TypeMoq.Times.once());
};

const partiallyMockedSwapQuoter = (
    provider: Web3ProviderEngine,
    orderProvider: OrderProvider,
): TypeMoq.IMock<SwapQuoter> => {
    const rawSwapQuoter = new SwapQuoter(provider, orderProvider);
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
        .setup(a => a.getOrdersAndFillableAmountsAsync(makerAssetData, takerAssetData, false))
        .returns(() => Promise.resolve(ordersAndFillableAmounts))
        .verifiable(TypeMoq.Times.once());
};

export const mockedSwapQuoterWithOrdersAndFillableAmounts = (
    provider: Web3ProviderEngine,
    orderProvider: OrderProvider,
    makerAssetData: string,
    takerAssetData: string,
    ordersAndFillableAmounts: OrdersAndFillableAmounts,
): TypeMoq.IMock<SwapQuoter> => {
    const mockedAssetQuoter = partiallyMockedSwapQuoter(provider, orderProvider);
    mockGetOrdersAndAvailableAmounts(mockedAssetQuoter, makerAssetData, takerAssetData, ordersAndFillableAmounts);
    return mockedAssetQuoter;
};
