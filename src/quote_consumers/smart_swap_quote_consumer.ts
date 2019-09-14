import { ContractWrappers } from '@0x/contract-wrappers';
import { SupportedProvider } from '@0x/web3-wrapper';

import {
    CalldataInfo,
    SmartContractParams,
    SmartContractParamsInfo,
    SmartSwapQuoteExecutionOpts,
    SmartSwapQuoteGetOutputOpts,
    SwapQuote,
    SwapQuoteConsumerOpts,
} from '../types';
import { swapQuoteConsumerUtils } from '../utils/swap_quote_consumer_utils';

import { SwapQuoteConsumer } from './swap_quote_consumer';

export class SmartSwapQuoteConsumer extends SwapQuoteConsumer {

    private readonly _contractWrappers: ContractWrappers;

    constructor(supportedProvider: SupportedProvider, options: Partial<SwapQuoteConsumerOpts> = {}) {
        super(supportedProvider, options);
        this._contractWrappers = new ContractWrappers(this.provider, {
            networkId: this.networkId,
        });
    }

   /**
    * Given a SwapQuote, returns 'CalldataInfo' for a 0x exchange call. See type definition of CalldataInfo for more information.
    * @param quote An object that conforms to SwapQuote. See type definition for more information.
    * @param opts  Options for getting SmartContractParams. See type definition for more information.
    */
    public async getCalldataOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<SmartSwapQuoteGetOutputOpts> = {},
    ): Promise<CalldataInfo> {
        const useExtensionContract = await swapQuoteConsumerUtils.getExtensionContractTypeForSwapQuoteAsync(quote, this._contractWrappers, this.provider, opts);
        return super.getCalldataOrThrowAsync(quote, { useExtensionContract });
    }

    /**
     * Given a SwapQuote, returns 'SmartContractParamsInfo' for a 0x exchange call. See type definition of SmartContractParamsInfo for more information.
     * @param quote An object that conforms to SwapQuote. See type definition for more information.
     * @param opts  Options for getting SmartContractParams. See type definition for more information.
     */
    public async getSmartContractParamsOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<SmartSwapQuoteGetOutputOpts> = {},
    ): Promise<SmartContractParamsInfo<SmartContractParams>> {
        const useExtensionContract = await swapQuoteConsumerUtils.getExtensionContractTypeForSwapQuoteAsync(quote, this._contractWrappers, this.provider, opts);
        return super.getSmartContractParamsOrThrowAsync(quote, { useExtensionContract });
    }

    /**
     * Given a SwapQuote and desired rate (in takerAsset), attempt to execute the swap.
     * @param quote An object that conforms to SwapQuote. See type definition for more information.
     * @param opts  Options for getting CalldataInfo. See type definition for more information.
     */
    public async executeSwapQuoteOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<SmartSwapQuoteExecutionOpts> = {},
    ): Promise<string> {
        const useExtensionContract = await swapQuoteConsumerUtils.getExtensionContractTypeForSwapQuoteAsync(quote, this._contractWrappers, this.provider, opts);
        return super.executeSwapQuoteOrThrowAsync(quote, { useExtensionContract });
    }
}
