/// <reference types="web3-provider-engine" />
import { AcceptedRejectedOrders, Orderbook } from '@0x/orderbook';
import { Web3ProviderEngine } from '@0x/subproviders';
import { APIOrder, AssetPairsItem, SignedOrder } from '@0x/types';
import * as TypeMoq from 'typemoq';
import { SwapQuoter } from '../../src/swap_quoter';
import { SignedOrderWithFillableAmounts } from '../../src/types';
import { ProtocolFeeUtils } from '../../src/utils/protocol_fee_utils';
declare class OrderbookClass extends Orderbook {
    getOrdersAsync(_makerAssetData: string, _takerAssetData: string): Promise<APIOrder[]>;
    getAvailableAssetDatasAsync(): Promise<AssetPairsItem[]>;
    addOrdersAsync(_orders: SignedOrder[]): Promise<AcceptedRejectedOrders>;
}
export declare const orderbookMock: () => TypeMoq.IMock<OrderbookClass>;
export declare const mockAvailableAssetDatas: (mockOrderbook: TypeMoq.IMock<OrderbookClass>, availableAssetDatas: AssetPairsItem[]) => void;
export declare const protocolFeeUtilsMock: () => TypeMoq.IMock<ProtocolFeeUtils>;
export declare const mockedSwapQuoterWithFillableAmounts: (provider: Web3ProviderEngine, orderbook: Orderbook, makerAssetData: string, takerAssetData: string, signedOrders: SignedOrderWithFillableAmounts[]) => TypeMoq.IMock<SwapQuoter>;
export {};
//# sourceMappingURL=mocks.d.ts.map