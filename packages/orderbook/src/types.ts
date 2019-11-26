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
    // The http endpoint to the SRA service, e.g https://sra.0x.org/v3
    httpEndpoint: string;
    // The websocket endpoint to the SRA service, e.g wss://ws.sra.0x.org/
    websocketEndpoint: string;
}

/**
 * Constructor options for a SRA Polling Order Provider
 */
export interface SRAPollingOrderProviderOpts {
    // The http endpoint to the SRA service, e.g https://sra.0x.org/v3
    httpEndpoint: string;
    // The interval between polling for each subscription
    pollingIntervalMs: number;
    // The amount of records to request per request to the SRA endpoint
    perPage?: number;
    // The chain Id
    chainId?: number;
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
