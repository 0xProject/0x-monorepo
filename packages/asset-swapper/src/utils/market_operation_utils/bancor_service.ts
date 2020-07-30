import { BigNumber } from '@0x/utils';
import { SDK } from '@bancor/sdk';
import { BlockchainType, Token } from '@bancor/sdk/dist/types';

import { BancorQuoteData } from './types';

function token(address: string, blockchainType: BlockchainType = BlockchainType.Ethereum): Token {
    return {
        blockchainType,
        blockchainId: address,
    };
}

export class BancorService {
    // Bancor recommends setting this value to 2% under the expected return amount
    public minReturnAmountBufferPercentage = 0.98;
    private _sdk?: SDK;

    constructor(public ethereumNodeEndpoint: string) {}

    public async getSDKAsync(): Promise<SDK> {
        if (!this._sdk) {
            this._sdk = await SDK.create({ ethereumNodeEndpoint: this.ethereumNodeEndpoint });
        }
        return this._sdk;
    }

    public async getQuoteAsync(fromToken: string, toToken: string, amount: BigNumber): Promise<BancorQuoteData> {
        const sdk = await this.getSDKAsync();
        const { path, rate } = await sdk.pricing.getPathAndRate(token(fromToken), token(toToken), amount.toString());
        return {
            fillData: { path: path.map(p => p.blockchainId) }, // ethereum token addresses
            amount: new BigNumber(rate).multipliedBy(this.minReturnAmountBufferPercentage),
        };
    }
}
