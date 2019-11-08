import { Asset, AssetPairsItem, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { OrderStore } from '../order_store';
import { AcceptedRejectedOrders } from '../types';
import { utils } from '../utils';

import { BaseOrderProvider, DEFAULT_TOKEN_PRECISION } from './base_order_provider';

export class CustomOrderProvider extends BaseOrderProvider {
    constructor(orders: SignedOrder[], orderStore: OrderStore) {
        super(orderStore);
        void this.addOrdersAsync(orders);
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async createSubscriptionForAssetPairAsync(_makerAssetData: string, _takerAssetData: string): Promise<void> {
        // Do nothing
    }

    public async getAvailableAssetDatasAsync(): Promise<AssetPairsItem[]> {
        const assetPairsItems: AssetPairsItem[] = [];
        const minAmount = new BigNumber(0);
        const maxAmount = new BigNumber(2).pow(256).minus(1);
        const precision = DEFAULT_TOKEN_PRECISION;
        for (const assetPairKey of this._orderStore.keys()) {
            const [assetA, assetB] = OrderStore.assetPairKeyToAssets(assetPairKey);
            const assetDataA: Asset = { assetData: assetA, minAmount, maxAmount, precision };
            const assetDataB: Asset = { assetData: assetB, minAmount, maxAmount, precision };
            assetPairsItems.push({ assetDataA, assetDataB });
            assetPairsItems.push({ assetDataA: assetDataB, assetDataB: assetDataA });
        }
        return assetPairsItems;
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async destroyAsync(): Promise<void> {
        // Do nothing
    }

    public async addOrdersAsync(orders: SignedOrder[]): Promise<AcceptedRejectedOrders> {
        for (const order of orders) {
            const orderSet = this._orderStore.getOrderSetForAssets(order.makerAssetData, order.takerAssetData);
            await orderSet.addAsync({
                order,
                metaData: {
                    remainingFillableTakerAssetAmount: order.takerAssetAmount,
                    orderHash: await utils.getOrderHashAsync(order),
                },
            });
        }
        return { accepted: orders, rejected: [] };
    }
}
