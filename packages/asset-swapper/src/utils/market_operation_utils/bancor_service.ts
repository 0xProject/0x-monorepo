import { SupportedProvider } from '@0x/dev-utils';
import { BigNumber } from '@0x/utils';
import { SDK } from '@bancor/sdk';
import { Ethereum, getDecimals } from '@bancor/sdk/dist/blockchains/ethereum';
import { fromWei, toWei } from '@bancor/sdk/dist/helpers';
import { BlockchainType, Token } from '@bancor/sdk/dist/types';

import { BancorFillData, Quote } from './types';

/**
 * Converts an address to a Bancor Token type
 */
export function token(address: string, blockchainType: BlockchainType = BlockchainType.Ethereum): Token {
    return {
        blockchainType,
        blockchainId: address,
    };
}

export class BancorService {
    // Bancor recommends setting this value to 2% under the expected return amount
    public minReturnAmountBufferPercentage = 0.99;
    private _sdk?: SDK;

    constructor(public provider: SupportedProvider) {}

    public async getSDKAsync(): Promise<SDK> {
        if (!this._sdk) {
            this._sdk = await SDK.create({ ethereumNodeEndpoint: this.provider });
        }
        return this._sdk;
    }

    public async getQuoteAsync(
        fromToken: string,
        toToken: string,
        amount: BigNumber = new BigNumber(1),
    ): Promise<Quote<BancorFillData>> {
        const sdk = await this.getSDKAsync();
        const blockchain = sdk._core.blockchains[BlockchainType.Ethereum] as Ethereum;
        const sourceDecimals = await getDecimals(blockchain, fromToken);
        const { path, rate } = await sdk.pricing.getPathAndRate(
            token(fromToken),
            token(toToken),
            fromWei(amount.toString(), sourceDecimals),
        );
        const targetDecimals = await getDecimals(blockchain, toToken);
        const output = toWei(rate, targetDecimals);
        return {
            amount: new BigNumber(output).multipliedBy(this.minReturnAmountBufferPercentage).dp(0),
            fillData: {
                path: path.map(p => p.blockchainId),
                networkAddress: await this.getBancorNetworkAddressAsync(),
            },
        };
    }

    public async getBancorNetworkAddressAsync(): Promise<string> {
        const sdk = await this.getSDKAsync();
        const blockchain = sdk._core.blockchains[BlockchainType.Ethereum] as Ethereum;
        return blockchain.bancorNetwork._address;
    }
}
