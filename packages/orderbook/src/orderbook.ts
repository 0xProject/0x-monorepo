import { assert } from '@0x/assert';
import { APIOrder } from '@0x/connect';
import { AssetPairsItem, SignedOrder } from '@0x/types';

import { BaseOrderProvider } from './order_provider/base_order_provider';
import { MeshOrderProvider } from './order_provider/mesh_order_provider';
import { SRAPollingOrderProvider } from './order_provider/sra_polling_order_provider';
import { SRAWebsocketOrderProvider } from './order_provider/sra_websocket_order_provider';
import { OrderStore } from './order_store';
import {
    AcceptedRejectedOrders,
    MeshOrderProviderOpts,
    SRAPollingOrderProviderOpts,
    SRAWebsocketOrderProviderOpts,
} from './types';

export class Orderbook {
    private readonly _orderProvider: BaseOrderProvider;
    private readonly _orderStore: OrderStore;
    /**
     * Creates an Orderbook with the SRA Websocket Provider. This Provider fetches orders via
     * the SRA http endpoint and then subscribes to the asset pair for future updates.
     * @param opts the `SRAWebsocketOrderProviderOpts`
     */
    public static getOrderbookForWebsocketProvider(opts: SRAWebsocketOrderProviderOpts): Orderbook {
        const orderStore = new OrderStore();
        return new Orderbook(new SRAWebsocketOrderProvider(opts, orderStore), orderStore);
    }
    /**
     * Creates an Orderbook with SRA Polling Provider. This Provider simply polls every interval.
     * @param opts the `SRAPollingOrderProviderOpts`
     */
    public static getOrderbookForPollingProvider(opts: SRAPollingOrderProviderOpts): Orderbook {
        const orderStore = new OrderStore();
        return new Orderbook(new SRAPollingOrderProvider(opts, orderStore), orderStore);
    }
    /**
     * Creates an Orderbook with a Mesh Order Provider. This Provider fetches ALL orders
     * and subscribes to updates on ALL orders.
     * @param opts the `MeshOrderProviderOpts`
     */
    public static getOrderbookForMeshProvider(opts: MeshOrderProviderOpts): Orderbook {
        const orderStore = new OrderStore();
        return new Orderbook(new MeshOrderProvider(opts, orderStore), orderStore);
    }
    /**
     * Creates an Orderbook with the order provider. All order updates are stored
     * in the `OrderStore`.
     * @param orderProvider the order provider, e.g SRAWebbsocketOrderProvider
     * @param orderStore the order store where orders are added and deleted
     */
    constructor(orderProvider: BaseOrderProvider, orderStore: OrderStore) {
        this._orderProvider = orderProvider;
        this._orderStore = orderStore;
    }
    /**
     * Returns all orders where the order.makerAssetData == makerAssetData and
     * order.takerAssetData == takerAssetData. This pair is then subscribed to
     * and all future updates will be stored. The first request
     * to `getOrdersAsync` might fetch the orders from the Order Provider and create a subscription.
     * Subsequent requests will be quick and up to date and synced with the Order Provider state.
     * @param makerAssetData the maker asset data
     * @param takerAssetData the taker asset data
     */
    public async getOrdersAsync(makerAssetData: string, takerAssetData: string): Promise<APIOrder[]> {
        assert.isString('makerAssetData', makerAssetData);
        assert.isString('takerAssetData', takerAssetData);
        const assetPairKey = OrderStore.getKeyForAssetPair(makerAssetData, takerAssetData);
        if (!this._orderStore.has(assetPairKey)) {
            await this._orderProvider.createSubscriptionForAssetPairAsync(makerAssetData, takerAssetData);
        }
        const orders = this._orderStore.values(assetPairKey);
        return orders.filter(
            o => o.order.makerAssetData === makerAssetData && o.order.takerAssetData === takerAssetData,
        );
    }
    /**
     * Returns all of the Available Asset Pairs for the provided Order Provider.
     */
    public async getAvailableAssetDatasAsync(): Promise<AssetPairsItem[]> {
        return this._orderProvider.getAvailableAssetDatasAsync();
    }
    /**
     * Adds the orders to the Order Provider. All accepted orders will be returned
     * and rejected orders will be returned with an message indicating a reason for its rejection
     * @param orders The set of Orders to add to the Order Provider
     */
    public async addOrdersAsync(orders: SignedOrder[]): Promise<AcceptedRejectedOrders> {
        return this._orderProvider.addOrdersAsync(orders);
    }
}
