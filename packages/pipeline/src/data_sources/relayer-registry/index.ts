import axios from 'axios';

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

export class RelayerRegistrySource {
    private _url: string;

    constructor(url: string) {
        this._url = url;
    }

    public async getRelayerInfoAsync(): Promise<Map<string, RelayerResponse>> {
        const resp = await axios.get<Map<string, RelayerResponse>>(this._url);
        return resp.data;
    }
}
