import { ContractAddresses } from '@0x/contract-addresses';
import { SupportedProvider, ZeroExProvider } from '@0x/web3-wrapper';
import { CalldataInfo, SwapQuote, SwapQuoteConsumerBase, SwapQuoteConsumerOpts, SwapQuoteExecutionOpts, SwapQuoteGetOutputOpts } from '../types';
export declare class ExchangeSwapQuoteConsumer implements SwapQuoteConsumerBase {
    readonly provider: ZeroExProvider;
    readonly chainId: number;
    private readonly _exchangeContract;
    constructor(supportedProvider: SupportedProvider, contractAddresses: ContractAddresses, options?: Partial<SwapQuoteConsumerOpts>);
    getCalldataOrThrowAsync(quote: SwapQuote, _opts?: Partial<SwapQuoteGetOutputOpts>): Promise<CalldataInfo>;
    executeSwapQuoteOrThrowAsync(quote: SwapQuote, opts: Partial<SwapQuoteExecutionOpts>): Promise<string>;
}
//# sourceMappingURL=exchange_swap_quote_consumer.d.ts.map