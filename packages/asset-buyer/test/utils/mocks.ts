import { Web3ProviderEngine } from '@0x/subproviders';
import * as TypeMoq from 'typemoq';

import { AssetBuyer } from '../../src/asset_buyer';
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
}

export const orderProviderMock = () => {
    return TypeMoq.Mock.ofType(OrderProviderClass, TypeMoq.MockBehavior.Strict);
};

export const mockAvailableAssetDatas = (
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

const partiallyMockedAssetBuyer = (
    provider: Web3ProviderEngine,
    orderProvider: OrderProvider,
): TypeMoq.IMock<AssetBuyer> => {
    const rawAssetBuyer = new AssetBuyer(provider, orderProvider);
    const mockedAssetBuyer = TypeMoq.Mock.ofInstance(rawAssetBuyer, TypeMoq.MockBehavior.Loose, false);
    mockedAssetBuyer.callBase = true;
    return mockedAssetBuyer;
};

const mockGetOrdersAndAvailableAmounts = (
    mockedAssetBuyer: TypeMoq.IMock<AssetBuyer>,
    assetData: string,
    ordersAndFillableAmounts: OrdersAndFillableAmounts,
): void => {
    mockedAssetBuyer
        .setup(a => a.getOrdersAndFillableAmountsAsync(assetData, false))
        .returns(() => Promise.resolve(ordersAndFillableAmounts))
        .verifiable(TypeMoq.Times.once());
};

export const mockedAssetBuyerWithOrdersAndFillableAmounts = (
    provider: Web3ProviderEngine,
    orderProvider: OrderProvider,
    assetData: string,
    ordersAndFillableAmounts: OrdersAndFillableAmounts,
): TypeMoq.IMock<AssetBuyer> => {
    const mockedAssetBuyer = partiallyMockedAssetBuyer(provider, orderProvider);
    mockGetOrdersAndAvailableAmounts(mockedAssetBuyer, assetData, ordersAndFillableAmounts);
    return mockedAssetBuyer;
};
