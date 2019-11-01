import { APIOrder, HttpClient } from '@0x/connect';
import { AssetPairsItem, PaginatedCollection, SignedOrder } from '@0x/types';

import { OrderStore } from '../order_store';
import { AcceptedRejectedOrders, RejectedOrder } from '../types';
import { utils } from '../utils';

import { BaseOrderProvider } from './base_order_provider';
export const PER_PAGE_DEFAULT = 100;

export abstract class BaseSRAOrderProvider extends BaseOrderProvider {
    protected readonly _httpClient: HttpClient;
    protected readonly _chainId?: number;
    protected readonly _perPage: number;

    /**
     * This is an internal class for Websocket and Polling Order Providers
     */
    constructor(orderStore: OrderStore, httpEndpoint: string, perPage: number = PER_PAGE_DEFAULT, chainId?: number) {
        super(orderStore);
        this._httpClient = new HttpClient(httpEndpoint);
        this._perPage = perPage;
        this._chainId = chainId;
    }

    /**
     * Returns the availale Asset pairs from the SRA endpoint. This response is direct from the endpoint
     * so this call blocks until the response arrives.
     */
    public async getAvailableAssetDatasAsync(): Promise<AssetPairsItem[]> {
        const requestOpts = {
            perPage: this._perPage,
            chainId: this._chainId,
        };
        let recordsToReturn: AssetPairsItem[] = [];

        let hasMorePages = true;
        let page = 1;

        while (hasMorePages) {
            const { total, records, perPage } = await utils.attemptAsync<PaginatedCollection<AssetPairsItem>>(() =>
                this._httpClient.getAssetPairsAsync(requestOpts),
            );

            recordsToReturn = [...recordsToReturn, ...records];

            page += 1;
            const lastPage = Math.ceil(total / perPage);
            hasMorePages = page <= lastPage;
        }
        return recordsToReturn;
    }

    /**
     * Submits the SignedOrder to the SRA endpoint
     * @param orders the set of signed orders to add
     */
    public async addOrdersAsync(orders: SignedOrder[]): Promise<AcceptedRejectedOrders> {
        const accepted: SignedOrder[] = [];
        const rejected: RejectedOrder[] = [];
        for (const order of orders) {
            try {
                await this._httpClient.submitOrderAsync(order, { chainId: this._chainId });
                accepted.push(order);
            } catch (e) {
                rejected.push({ order, message: e.message });
            }
        }
        return { accepted, rejected };
    }

    protected async _fetchLatestOrdersAsync(makerAssetData: string, takerAssetData: string): Promise<APIOrder[]> {
        const [latestSellOrders, latestBuyOrders] = await Promise.all([
            this._getAllPaginatedOrdersAsync(makerAssetData, takerAssetData),
            this._getAllPaginatedOrdersAsync(takerAssetData, makerAssetData),
        ]);
        return [...latestSellOrders, ...latestBuyOrders];
    }

    protected async _getAllPaginatedOrdersAsync(makerAssetData: string, takerAssetData: string): Promise<APIOrder[]> {
        let recordsToReturn: APIOrder[] = [];
        const requestOpts = {
            makerAssetData,
            takerAssetData,
            perPage: this._perPage,
            chainId: this._chainId,
        };

        let hasMorePages = true;
        let page = 1;

        while (hasMorePages) {
            const { total, records, perPage } = await utils.attemptAsync(() =>
                this._httpClient.getOrdersAsync({
                    ...requestOpts,
                    page,
                }),
            );

            recordsToReturn = [...recordsToReturn, ...records];

            page += 1;
            const lastPage = Math.ceil(total / perPage);
            hasMorePages = page <= lastPage;
        }
        return recordsToReturn;
    }
}
