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

    public static async createAsync(provider: SupportedProvider): Promise<BancorService> {
        const sdk = await SDK.create({ ethereumNodeEndpoint: provider });
        const service = new BancorService(sdk);
        return service;
    }

    constructor(public sdk: SDK) {}

    public async getQuotesAsync(
        fromToken: string,
        toToken: string,
        amounts: BigNumber[],
    ): Promise<Array<Quote<BancorFillData>>> {
        const sdk = this.sdk;
        const blockchain = sdk._core.blockchains[BlockchainType.Ethereum] as Ethereum;
        const sourceDecimals = await getDecimals(blockchain, fromToken);
        const quotes = await sdk.pricing.getPathAndRates(
            token(fromToken),
            token(toToken),
            amounts.map(amt => fromWei(amt.toString(), sourceDecimals)),
        );
        const targetDecimals = await getDecimals(blockchain, toToken);
        const networkAddress = this.getBancorNetworkAddress();

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

    public getBancorNetworkAddress(): string {
        const blockchain = this.sdk._core.blockchains[BlockchainType.Ethereum] as Ethereum;
        return blockchain.bancorNetwork._address;
    }
}
