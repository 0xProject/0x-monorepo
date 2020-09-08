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

    public async getQuotesAsync(
        fromToken: string,
        toToken: string,
        amounts: BigNumber[],
    ): Promise<Array<Quote<BancorFillData>>> {
        const sdk = await this.getSDKAsync();
        const blockchain = sdk._core.blockchains[BlockchainType.Ethereum] as Ethereum;
        const sourceDecimals = await getDecimals(blockchain, fromToken);
        const quotes = await sdk.pricing.getPathAndRates(
            token(fromToken),
            token(toToken),
            amounts.map(amt => fromWei(amt.toString(), sourceDecimals)),
        );
        const targetDecimals = await getDecimals(blockchain, toToken);
        const networkAddress = await this.getBancorNetworkAddressAsync();

        return quotes.map(quote => {
            const { path, rate } = quote;
            const output = toWei(rate, targetDecimals);
            return {
                amount: new BigNumber(output).multipliedBy(this.minReturnAmountBufferPercentage).dp(0),
                fillData: {
                    path: path.map(p => p.blockchainId),
                    networkAddress,
                },
            };
        });
    }

    public async getBancorNetworkAddressAsync(): Promise<string> {
        const sdk = await this.getSDKAsync();
        const blockchain = sdk._core.blockchains[BlockchainType.Ethereum] as Ethereum;
        return blockchain.bancorNetwork._address;
    }

    public async getBancorTokenAddressAsync(): Promise<string> {
        const sdk = await this.getSDKAsync();
        const blockchain = sdk._core.blockchains[BlockchainType.Ethereum] as Ethereum;
        return blockchain.getAnchorToken().blockchainId;
    }
}
