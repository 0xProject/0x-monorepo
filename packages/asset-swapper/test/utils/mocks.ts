import { constants as devConstants } from '@0x/contracts-test-utils';
import { AcceptedRejectedOrders, Orderbook } from '@0x/orderbook';
import { Web3ProviderEngine } from '@0x/subproviders';
import { APIOrder, AssetPairsItem, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as TypeMoq from 'typemoq';

import { SwapQuoter } from '../../src/swap_quoter';
import { SignedOrderWithFillableAmounts } from '../../src/types';
import { ProtocolFeeUtils } from '../../src/utils/protocol_fee_utils';

const PROTOCOL_FEE_MULTIPLIER = 150000;

// tslint:disable: max-classes-per-file

class OrderbookClass extends Orderbook {
    // tslint:disable-next-line:prefer-function-over-method
    public async getOrdersAsync(_makerAssetData: string, _takerAssetData: string): Promise<APIOrder[]> {
        return [];
    }
    // tslint:disable-next-line:prefer-function-over-method
    public async getAvailableAssetDatasAsync(): Promise<AssetPairsItem[]> {
        return [];
    }
    // tslint:disable-next-line:prefer-function-over-method
    public async addOrdersAsync(_orders: SignedOrder[]): Promise<AcceptedRejectedOrders> {
        return { accepted: [], rejected: [] };
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
        .returns(async () => availableAssetDatas)
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

class ProtocolFeeUtilsClass extends ProtocolFeeUtils {
    // tslint:disable-next-line:prefer-function-over-method
    public async getProtocolFeeMultiplierAsync(): Promise<BigNumber> {
        return new BigNumber(PROTOCOL_FEE_MULTIPLIER);
    }
    // tslint:disable-next-line:prefer-function-over-method
    public async getGasPriceEstimationOrThrowAsync(_shouldHardRefresh?: boolean): Promise<BigNumber> {
        return new BigNumber(devConstants.DEFAULT_GAS_PRICE);
    }
}

export const protocolFeeUtilsMock = (): TypeMoq.IMock<ProtocolFeeUtils> => {
    const mockProtocolFeeUtils = TypeMoq.Mock.ofType(ProtocolFeeUtilsClass, TypeMoq.MockBehavior.Loose);
    mockProtocolFeeUtils.callBase = true;
    return mockProtocolFeeUtils;
};

const mockGetSignedOrdersWithFillableAmountsAsyncAsync = (
    mockedSwapQuoter: TypeMoq.IMock<SwapQuoter>,
    makerAssetData: string,
    takerAssetData: string,
    signedOrders: SignedOrderWithFillableAmounts[],
): void => {
    mockedSwapQuoter
        .setup(async a => a.getSignedOrdersWithFillableAmountsAsync(makerAssetData, takerAssetData))
        .returns(async () => signedOrders)
        .verifiable(TypeMoq.Times.once());
};

export const mockedSwapQuoterWithFillableAmounts = (
    provider: Web3ProviderEngine,
    orderbook: Orderbook,
    makerAssetData: string,
    takerAssetData: string,
    signedOrders: SignedOrderWithFillableAmounts[],
): TypeMoq.IMock<SwapQuoter> => {
    const mockedAssetQuoter = partiallyMockedSwapQuoter(provider, orderbook);
    mockGetSignedOrdersWithFillableAmountsAsyncAsync(mockedAssetQuoter, makerAssetData, takerAssetData, signedOrders);
    return mockedAssetQuoter;
};
