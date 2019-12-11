import { assert } from '@0x/assert';
import {
    APIOrder,
    OrdersChannel,
    ordersChannelFactory,
    OrdersChannelHandler,
    OrdersChannelSubscriptionOpts,
} from '@0x/connect';
import { BigNumber } from '@0x/utils';

import { OrderSet } from '../order_set';
import { OrderStore } from '../order_store';
import { AddedRemovedOrders, SRAWebsocketOrderProviderOpts } from '../types';
import { utils } from '../utils';

import { BaseSRAOrderProvider, PER_PAGE_DEFAULT } from './base_sra_order_provider';

export class SRAWebsocketOrderProvider extends BaseSRAOrderProvider {
    private readonly _websocketEndpoint: string;
    private readonly _wsSubscriptions: Map<string, OrdersChannelSubscriptionOpts> = new Map();
    private _ordersChannel?: OrdersChannel;
    private _isDestroyed = false;
    private _isConnecting = false;

    /**
     * Instantiates a HTTP and WS [Standard Relayer API](https://github.com/0xProject/standard-relayer-api) Order Provider
     * @param opts `SRAWebsocketOrderProviderOpts` containing the websocketEndpoint and the httpEndpoint to an SRA backend.
     * @param orderStore The `OrderStore` where orders are added and removed from
     */
    constructor(opts: SRAWebsocketOrderProviderOpts, orderStore: OrderStore) {
        super(orderStore, opts.httpEndpoint, PER_PAGE_DEFAULT);
        assert.isUri('websocketEndpoint', opts.websocketEndpoint);
        this._websocketEndpoint = opts.websocketEndpoint;
    }

    /**
     * Creates a websocket subscription and fetches the current orders from SRA. If a websocket
     * connection already exists this function is a noop.
     * @param makerAssetData the Maker Asset Data
     * @param takerAssetData the Taker Asset Data
     */
    public async createSubscriptionForAssetPairAsync(makerAssetData: string, takerAssetData: string): Promise<void> {
        // If we've previously been destroyed then reset
        this._isDestroyed = false;
        const assetPairKey = OrderStore.getKeyForAssetPair(makerAssetData, takerAssetData);
        if (this._wsSubscriptions.has(assetPairKey)) {
            return;
        }
        return this._fetchAndCreateSubscriptionAsync(makerAssetData, takerAssetData);
    }

    /**
     * Destroys the order provider, removing any subscriptions
     */
    public async destroyAsync(): Promise<void> {
        this._isDestroyed = true;
        this._wsSubscriptions.clear();
        if (this._ordersChannel) {
            this._ordersChannel.close();
            this._ordersChannel = undefined;
        }
    }

    /**
     * Creates a websocket subscription. If the inital websocket connnection
     * does not exist, it is created.
     * @param makerAssetData the Maker Asset Data
     * @param takerAssetData the Taker Asset Data
     */
    private async _createWebsocketSubscriptionAsync(makerAssetData: string, takerAssetData: string): Promise<void> {
        // Prevent creating multiple channels
        while (this._isConnecting && !this._ordersChannel) {
            await utils.delayAsync(100);
        }
        if (!this._ordersChannel) {
            this._isConnecting = true;
            try {
                this._ordersChannel = await this._createOrdersChannelAsync();
            } finally {
                this._isConnecting = false;
            }
        }
        const assetPairKey = OrderStore.getKeyForAssetPair(makerAssetData, takerAssetData);
        const subscriptionOpts = {
            makerAssetData,
            takerAssetData,
        };
        this._wsSubscriptions.set(assetPairKey, subscriptionOpts);
        // Subscribe to both sides of the book
        this._ordersChannel.subscribe(subscriptionOpts);
        this._ordersChannel.subscribe({
            ...subscriptionOpts,
            makerAssetData: takerAssetData,
            takerAssetData: makerAssetData,
        });
    }

    private async _fetchAndCreateSubscriptionAsync(makerAssetData: string, takerAssetData: string): Promise<void> {
        // Create the subscription first to get any updates while waiting for the request
        await this._createWebsocketSubscriptionAsync(makerAssetData, takerAssetData);
        // first time we have had this request, preload the local storage
        const orders = await this._fetchLatestOrdersAsync(makerAssetData, takerAssetData);
        const assetPairKey = OrderStore.getKeyForAssetPair(makerAssetData, takerAssetData);
        const currentOrders = await this._orderStore.getOrderSetForAssetPairAsync(assetPairKey);
        const newOrders = new OrderSet();
        await newOrders.addManyAsync(orders);
        const diff = await currentOrders.diffAsync(newOrders);
        await this._updateStoreAsync({
            added: diff.added,
            removed: diff.removed,
            assetPairKey,
        });
    }

    private async _syncOrdersInOrderStoreAsync(): Promise<void> {
        for (const assetPairKey of await this._orderStore.keysAsync()) {
            const [assetDataA, assetDataB] = OrderStore.assetPairKeyToAssets(assetPairKey);
            await this._fetchAndCreateSubscriptionAsync(assetDataA, assetDataB);
        }
    }

    /**
     * Creates a new websocket orders channel.
     */
    private async _createOrdersChannelAsync(): Promise<OrdersChannel> {
        const ordersChannelHandler: OrdersChannelHandler = {
            onUpdate: async (_channel, _opts, apiOrders) => this._handleOrderUpdatesAsync(apiOrders),
            // tslint:disable-next-line:no-empty
            onError: (_channel, _err) => {},
            onClose: async () => {
                // Do not reconnect if destroyed
                if (this._isDestroyed) {
                    return;
                }
                // Re-sync and create subscriptions
                await utils.attemptAsync<boolean>(async () => {
                    this._ordersChannel = undefined;
                    await this._syncOrdersInOrderStoreAsync();
                    return true;
                });
            },
        };
        try {
            return await ordersChannelFactory.createWebSocketOrdersChannelAsync(
                this._websocketEndpoint,
                ordersChannelHandler,
            );
        } catch (e) {
            throw new Error(`Creating websocket connection to ${this._websocketEndpoint}`);
        }
    }

    /**
     * Handles updates from the websocket, adding new orders and removing orders
     * which have remainingFillableTakerAssetAmount as 0.
     * @param orders the set of API Orders returned from the websocket channel
     */
    private async _handleOrderUpdatesAsync(orders: APIOrder[]): Promise<void> {
        const addedRemovedByKey: { [assetPairKey: string]: AddedRemovedOrders } = {};
        for (const order of orders) {
            const assetPairKey = OrderStore.getKeyForAssetPair(order.order.makerAssetData, order.order.takerAssetData);
            if (!addedRemovedByKey[assetPairKey]) {
                addedRemovedByKey[assetPairKey] = { added: [], removed: [], assetPairKey };
            }
            const addedRemoved = addedRemovedByKey[assetPairKey];
            // If we have the metadata informing us that the order cannot be filled for any amount we don't add it
            const remainingFillableTakerAssetAmount = (order.metaData as any).remainingFillableTakerAssetAmount;
            if (remainingFillableTakerAssetAmount && new BigNumber(remainingFillableTakerAssetAmount).eq(0)) {
                addedRemoved.removed.push(order);
            } else {
                addedRemoved.added.push(order);
            }
        }

        for (const assetPairKey of Object.keys(addedRemovedByKey)) {
            await this._updateStoreAsync(addedRemovedByKey[assetPairKey]);
        }
    }
}
