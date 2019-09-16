import { APIOrder } from '@0x/connect';
import {
    AcceptedOrderInfo,
    OrderEvent,
    OrderEventKind,
    OrderInfo,
    RejectedOrderInfo,
    WSClient,
} from '@0x/mesh-rpc-client';
import { Asset, AssetPairsItem, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { OrderStore } from '../order_store';
import { AcceptedRejectedOrders, AddedRemovedOrders, MeshOrderProviderOpts } from '../types';
import { utils } from '../utils';

import { BaseOrderProvider } from './base_order_provider';

export class MeshOrderProvider extends BaseOrderProvider {
    private readonly _wsClient: WSClient;
    private _wsSubscriptionId?: string;

    /**
     * Converts the OrderEvent or OrderInfo from Mesh  into an APIOrder.
     * If the OrderInfo is a RejectedOrderInfo the remainingFillableTakerAssetAmount is
     * assumed to be 0.
     * @param orderEvent The `OrderEvent` from a Mesh subscription update
     */
    private static _orderInfoToAPIOrder(
        orderEvent: OrderEvent | AcceptedOrderInfo | RejectedOrderInfo | OrderInfo,
    ): APIOrder {
        const remainingFillableTakerAssetAmount = (orderEvent as OrderEvent).fillableTakerAssetAmount
            ? (orderEvent as OrderEvent).fillableTakerAssetAmount
            : new BigNumber(0);
        return {
            order: orderEvent.signedOrder,
            metaData: {
                orderHash: orderEvent.orderHash,
                remainingFillableTakerAssetAmount,
            },
        };
    }

    /**
     * Instantiates a [Mesh](https://github.com/0xProject/0x-mesh) Order Provider. This provider writes
     * all orders stored in Mesh to the OrderStore and subscribes all Mesh updates.
     * @param opts `MeshOrderProviderOpts` containing the websocketEndpoint and additional Mesh options
     * @param orderStore The `OrderStore` where orders are added and removed from
     */
    constructor(opts: MeshOrderProviderOpts, orderStore: OrderStore) {
        super(orderStore);
        this._wsClient = new WSClient(opts.websocketEndpoint, opts.wsOpts);
    }

    /**
     * Returns the available asset pairs. If no subscription to Mesh exists (and therefore no orders) it is
     * created and awaited on. Once the connection has been initialized the orders in the store are returned
     * as asset pairs.
     */
    public async getAvailableAssetDatasAsync(): Promise<AssetPairsItem[]> {
        await this._initializeIfRequiredAsync();
        const assetPairsItems: AssetPairsItem[] = [];
        const minAmount = new BigNumber(0);
        const maxAmount = new BigNumber(2).pow(256).minus(1);
        const precision = 18;
        for (const assetPairKey of this._orderStore.keys()) {
            const [assetA, assetB] = OrderStore.assetPairKeyToAssets(assetPairKey);
            const assetDataA: Asset = { assetData: assetA, minAmount, maxAmount, precision };
            const assetDataB: Asset = { assetData: assetB, minAmount, maxAmount, precision };
            assetPairsItems.push({ assetDataA, assetDataB });
            assetPairsItems.push({ assetDataA: assetDataB, assetDataB: assetDataA });
        }
        return assetPairsItems;
    }

    /**
     * Creates a subscription for all asset pairs in Mesh.
     * @param makerAssetData the Maker Asset Data
     * @param takerAssetData the Taker Asset Data
     */
    public async createSubscriptionForAssetPairAsync(_makerAssetData: string, _takerAssetData: string): Promise<void> {
        // Create the subscription first to get any updates while waiting for the request
        await this._initializeIfRequiredAsync();
    }

    /**
     * Submits the SignedOrder to the Mesh node
     * @param orders the set of signed orders to add
     */
    public async addOrdersAsync(orders: SignedOrder[]): Promise<AcceptedRejectedOrders> {
        const { accepted, rejected } = await utils.attemptAsync(() => this._wsClient.addOrdersAsync(orders));
        return {
            accepted: accepted.map(o => o.signedOrder),
            rejected: rejected.map(o => ({ order: o.signedOrder, message: o.status.message })),
        };
    }

    /**
     * Destroys the order provider, removing any subscriptions
     */
    public async destroyAsync(): Promise<void> {
        this._wsClient.destroy();
    }

    /**
     * Creates the order subscription unless one already exists. If one does not exist
     * it also handles the reconnection logic.
     */
    private async _initializeIfRequiredAsync(): Promise<void> {
        if (this._wsSubscriptionId) {
            return;
        }
        this._wsSubscriptionId = await this._wsClient.subscribeToOrdersAsync(this._handleOrderUpdates.bind(this));
        await this._fetchOrdersAndStoreAsync();
        // On Reconnnect sync all of the orders currently stored
        this._wsClient.onReconnected(() => {
            void this._syncOrdersInOrderStoreAsync();
        });
    }

    /**
     * Syncs the orders currently stored in the OrderStore. This is used when the connection to mesh
     * has reconnected. During this outage there are missed OrderEvents so all orders are re-validated
     * for every known asset pair.
     */
    private async _syncOrdersInOrderStoreAsync(): Promise<void> {
        for (const assetPairKey of this._orderStore.keys()) {
            const currentOrders = this._orderStore.getOrderSetForAssetPair(assetPairKey);
            const { rejected } = await utils.attemptAsync(() =>
                this._wsClient.addOrdersAsync(Array.from(currentOrders.values()).map(o => o.order)),
            );
            // Remove any rejected orders
            this._updateStore({
                assetPairKey,
                added: [],
                removed: rejected.map(o => MeshOrderProvider._orderInfoToAPIOrder(o)),
            });
        }
        await this._fetchOrdersAndStoreAsync();
    }

    /**
     * Fetches all of the Orders available in Mesh. All orders are then stored in the
     * OrderStore.
     */
    private async _fetchOrdersAndStoreAsync(): Promise<void> {
        const ordersByAssetPairKey: { [assetPairKey: string]: APIOrder[] } = {};
        // Fetch all orders in Mesh
        const orders = await utils.attemptAsync(() => this._wsClient.getOrdersAsync());
        for (const order of orders) {
            const { makerAssetData, takerAssetData } = order.signedOrder;
            const assetPairKey = OrderStore.getKeyForAssetPair(makerAssetData, takerAssetData);
            if (!ordersByAssetPairKey[assetPairKey]) {
                ordersByAssetPairKey[assetPairKey] = [];
            }
            ordersByAssetPairKey[assetPairKey].push(MeshOrderProvider._orderInfoToAPIOrder(order));
        }
        for (const assetPairKey of Object.keys(ordersByAssetPairKey)) {
            this._updateStore({
                added: ordersByAssetPairKey[assetPairKey],
                removed: [],
                assetPairKey,
            });
        }
    }

    /**
     * Handles the order events converting to APIOrders and either adding or removing based on its kind.
     * @param orderEvents The set of `OrderEvents` returned from a mesh subscription update
     */
    private _handleOrderUpdates(orderEvents: OrderEvent[]): void {
        const addedRemovedByAssetPairKey: { [assetPairKey: string]: AddedRemovedOrders } = {};
        for (const event of orderEvents) {
            const { makerAssetData, takerAssetData } = event.signedOrder;
            const assetPairKey = OrderStore.getKeyForAssetPair(makerAssetData, takerAssetData);
            if (!addedRemovedByAssetPairKey[assetPairKey]) {
                addedRemovedByAssetPairKey[assetPairKey] = { added: [], removed: [], assetPairKey };
            }
            const apiOrder = MeshOrderProvider._orderInfoToAPIOrder(event);
            switch (event.kind) {
                case OrderEventKind.Added: {
                    addedRemovedByAssetPairKey[assetPairKey].added.push(apiOrder);
                    break;
                }
                case OrderEventKind.Cancelled:
                case OrderEventKind.Expired:
                case OrderEventKind.FullyFilled:
                case OrderEventKind.Unfunded: {
                    addedRemovedByAssetPairKey[assetPairKey].removed.push(apiOrder);
                    break;
                }
                case OrderEventKind.FillabilityIncreased:
                case OrderEventKind.Filled: {
                    addedRemovedByAssetPairKey[assetPairKey].added.push(apiOrder);
                    break;
                }
                default:
                    break;
            }
        }
        for (const assetPairKey of Object.keys(addedRemovedByAssetPairKey)) {
            this._updateStore(addedRemovedByAssetPairKey[assetPairKey]);
        }
    }
}
