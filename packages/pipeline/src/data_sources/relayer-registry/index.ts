import { fetchSuccessfullyOrThrowAsync } from '../../utils';

export interface RelayerResponse {
    name: string;
    homepage_url: string;
    app_url: string;
    header_img: string;
    logo_img: string;
    networks: RelayerResponseNetwork[];
}

export interface RelayerResponseNetwork {
    networkId: number;
    sra_http_endpoint?: string;
    sra_ws_endpoint?: string;
    static_order_fields?: {
        fee_recipient_addresses?: string[];
        taker_addresses?: string[];
    };
}

export interface RelayerResponses {
    [uuid: string]: RelayerResponse;
}

/**
 * Get relayers from the relayer registry.
 */
export async function getRelayerInfoAsync(url: string): Promise<RelayerResponses> {
    return fetchSuccessfullyOrThrowAsync(url);
}
