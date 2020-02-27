import { ContractAddresses } from '@0x/contract-addresses';
import { SupportedProvider, ZeroExProvider } from '@0x/web3-wrapper';
import { CalldataInfo, SwapQuote, SwapQuoteConsumerBase, SwapQuoteConsumerOpts, SwapQuoteExecutionOpts, SwapQuoteGetOutputOpts } from '../types';
export declare class ForwarderSwapQuoteConsumer implements SwapQuoteConsumerBase {
    readonly provider: ZeroExProvider;
    readonly chainId: number;
    private readonly _contractAddresses;
    private readonly _forwarder;
    constructor(supportedProvider: SupportedProvider, contractAddresses: ContractAddresses, options?: Partial<SwapQuoteConsumerOpts>);
    /**
     * Given a SwapQuote, returns 'CalldataInfo' for a forwarder extension call. See type definition of CalldataInfo for more information.
     * @param quote An object that conforms to SwapQuote. See type definition for more information.
     * @param opts  Options for getting CalldataInfo. See type definition for more information.
     */
    getCalldataOrThrowAsync(quote: SwapQuote, opts?: Partial<SwapQuoteGetOutputOpts>): Promise<CalldataInfo>;
    /**
     * Given a SwapQuote and desired rate (in Eth), attempt to execute the swap.
     * @param quote An object that conforms to SwapQuote. See type definition for more information.
     * @param opts  Options for getting CalldataInfo. See type definition for more information.
     */
    executeSwapQuoteOrThrowAsync(quote: SwapQuote, opts: Partial<SwapQuoteExecutionOpts>): Promise<string>;
    private _getEtherTokenAssetDataOrThrow;
}
//# sourceMappingURL=forwarder_swap_quote_consumer.d.ts.map