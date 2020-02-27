import { SupportedProvider, ZeroExProvider } from '@0x/web3-wrapper';
import { CalldataInfo, ExtensionContractType, GetExtensionContractTypeOpts, SwapQuote, SwapQuoteConsumerBase, SwapQuoteConsumerOpts, SwapQuoteExecutionOpts, SwapQuoteGetOutputOpts } from '../types';
export declare class SwapQuoteConsumer implements SwapQuoteConsumerBase {
    readonly provider: ZeroExProvider;
    readonly chainId: number;
    private readonly _exchangeConsumer;
    private readonly _forwarderConsumer;
    private readonly _contractAddresses;
    static getSwapQuoteConsumer(supportedProvider: SupportedProvider, options?: Partial<SwapQuoteConsumerOpts>): SwapQuoteConsumer;
    constructor(supportedProvider: SupportedProvider, options?: Partial<SwapQuoteConsumerOpts>);
    /**
     * Given a SwapQuote, returns 'CalldataInfo' for a 0x extesion or exchange call. See type definition of CalldataInfo for more information.
     * @param quote An object that conforms to SwapQuote. See type definition for more information.
     * @param opts  Options for getting SmartContractParams. See type definition for more information.
     */
    getCalldataOrThrowAsync(quote: SwapQuote, opts?: Partial<SwapQuoteGetOutputOpts>): Promise<CalldataInfo>;
    /**
     * Given a SwapQuote and desired rate (in takerAsset), attempt to execute the swap with 0x extension or exchange contract.
     * @param quote An object that conforms to SwapQuote. See type definition for more information.
     * @param opts  Options for getting CalldataInfo. See type definition for more information.
     */
    executeSwapQuoteOrThrowAsync(quote: SwapQuote, opts?: Partial<SwapQuoteExecutionOpts>): Promise<string>;
    /**
     * Given a SwapQuote, returns optimal 0x protocol interface (extension or no extension) to perform the swap.
     * @param quote An object that conforms to SwapQuote. See type definition for more information.
     * @param opts  Options for getting optimal exteion contract to fill quote. See type definition for more information.
     */
    getOptimalExtensionContractTypeAsync(quote: SwapQuote, opts?: Partial<GetExtensionContractTypeOpts>): Promise<ExtensionContractType>;
    private _getConsumerForSwapQuoteAsync;
}
//# sourceMappingURL=swap_quote_consumer.d.ts.map