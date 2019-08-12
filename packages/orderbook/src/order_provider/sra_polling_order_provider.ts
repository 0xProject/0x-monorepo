import { assert } from '@0x/assert';

import { OrderSet } from '../order_set';
import { OrderStore } from '../order_store';
import { SRAPollingOrderProviderOpts } from '../types';

import { BaseSRAOrderProvider } from './base_sra_order_provider';

const RECORD_COUNT = 100;

export class SRAPollingOrderProvider extends BaseSRAOrderProvider {
    private readonly _httpPollingIntervalId: Map<string, number> = new Map();
    private readonly _pollingIntervalMs: number;

    /**
     * Instantiates a HTTP [Standard Relayer API](https://github.com/0xProject/standard-relayer-api)
     * Polling Order Provider
     * @param opts `SRAPollingOrderProviderOpts` containing the httpEndpoint to an SRA backend and polling options
     * @param orderStore The `OrderStore` where orders are added and removed from
     */
    constructor(opts: SRAPollingOrderProviderOpts, orderStore: OrderStore) {
        super(orderStore, opts.httpEndpoint, opts.perPage || RECORD_COUNT, opts.networkId);
        assert.isNumber('pollingIntervalMs', opts.pollingIntervalMs);
        this._pollingIntervalMs = opts.pollingIntervalMs;
    }

    /**
     * Creates a http polling subscription and fetches the current orders from SRA.
     * @param makerAssetData the maker asset Data
     * @param takerAssetData the taker asset Data
     */
    public async createSubscriptionForAssetPairAsync(makerAssetData: string, takerAssetData: string): Promise<void> {
        const assetPairKey = OrderStore.getKeyForAssetPair(makerAssetData, takerAssetData);
        // Do nothing if we already have a polling interval or websocket created for this asset pair
        if (this._httpPollingIntervalId.has(assetPairKey)) {
            return;
        }
        await this._fetchAndCreatePollingAsync(makerAssetData, takerAssetData);
    }

    /**
     * Destroys the order provider, removing any subscriptions
     */
    public async destroyAsync(): Promise<void> {
        for (const [assetPairKey, id] of this._httpPollingIntervalId) {
            clearInterval(id);
            this._httpPollingIntervalId.delete(assetPairKey);
        }
    }

    /**
     * Fetches all of the orders for both sides of the orderbook and stores. A polling subscription
     * is created performing this action every pollingIntervalMs
     */
    private async _fetchAndCreatePollingAsync(makerAssetData: string, takerAssetData: string): Promise<void> {
        const assetPairKey = OrderStore.getKeyForAssetPair(makerAssetData, takerAssetData);
        // first time we have had this request, preload the local storage
        const orders = await this._fetchLatestOrdersAsync(makerAssetData, takerAssetData);
        // Set the OrderSet for the polling to diff against
        this._updateStore({ added: orders, removed: [], assetPairKey });
        // Create a HTTP polling subscription
        const pollingIntervalId = this._createPollingSubscription(makerAssetData, takerAssetData);
        this._httpPollingIntervalId.set(assetPairKey, pollingIntervalId);
    }

    /**
     * Creates the polling interval fetching the orders, calculating the diff and updating the store
     */
    private _createPollingSubscription(makerAssetData: string, takerAssetData: string): any {
        const assetPairKey = OrderStore.getKeyForAssetPair(makerAssetData, takerAssetData);
        const pollingIntervalId = setInterval(async () => {
            const previousOrderSet = this._orderStore.getOrderSetForAssetPair(assetPairKey);
            const orders = await this._fetchLatestOrdersAsync(makerAssetData, takerAssetData);
            const diff = previousOrderSet.diff(new OrderSet(orders));
            this._updateStore({ ...diff, assetPairKey });
        }, this._pollingIntervalMs);
        return pollingIntervalId;
    }
}
