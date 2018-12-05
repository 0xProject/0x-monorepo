import axios from 'axios';

export interface ZeroExTrustedTokenMeta {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
}

export interface MetamaskTrustedTokenMeta {
    address: string;
    name: string;
    erc20: boolean;
    symbol: string;
    decimals: number;
}

export class TrustedTokenSource<T> {
    private readonly _url: string;

    constructor(url: string) {
        this._url = url;
    }

    public async getTrustedTokenMetaAsync(): Promise<T> {
        const resp = await axios.get<T>(this._url);
        return resp.data;
    }
}
