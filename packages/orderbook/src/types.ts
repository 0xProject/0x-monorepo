import { APIOrder, SignedOrder } from '@0x/connect';
import { WSOpts } from '@0x/mesh-rpc-client';

export interface AddedRemovedOrders {
    assetPairKey: string;
    added: APIOrder[];
    removed: APIOrder[];
}

export interface RejectedOrder {
    message: string;
    order: SignedOrder;
}
export interface AcceptedRejectedOrders {
    accepted: SignedOrder[];
    rejected: RejectedOrder[];
}

export type AddedRemovedListeners = (addedRemoved: AddedRemovedOrders) => void;

/**
 * Constructor options for a SRA Websocket Order Provider
 */
export interface SRAWebsocketOrderProviderOpts {
    // The http endpoint to the SRA service, e.g https://sra.0x.org/v2
    httpEndpoint: string;
    // The websocket endpoint to the SRA service, e.g wss://ws.sra.0x.org/
    websocketEndpoint: string;
    // The network Id
    networkId?: number;
}

/**
 * Constructor options for a SRA Polling Order Provider
 */
export interface SRAPollingOrderProviderOpts {
    // The http endpoint to the SRA service, e.g https://sra.0x.org/v2
    httpEndpoint: string;
    // The interval between polling for each subscription
    pollingIntervalMs: number;
    // The amount of records to request per request to the SRA endpoint
    perPage?: number;
    // The network Id
    networkId?: number;
}

/**
 * Constructor options for a Mesh Order Provider
 */
export interface MeshOrderProviderOpts {
    // The websocket endpoint for the Mesh service
    websocketEndpoint: string;
    // Additional options to configure the Mesh client, e.g reconnectAfter
    wsOpts?: WSOpts;
}

export interface OrderProviderRequest {
    // The assetData representing the desired maker asset
    makerAssetData: string;
    // The assetData representing the desired taker asset
    takerAssetData: string;
}
