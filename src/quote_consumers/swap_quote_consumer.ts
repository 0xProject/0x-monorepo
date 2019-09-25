import { ContractWrappers } from '@0x/contract-wrappers';
import { providerUtils } from '@0x/utils';
import { SupportedProvider, ZeroExProvider } from '@0x/web3-wrapper';
import * as _ from 'lodash';

import { constants } from '../constants';
import {
    CalldataInfo,
    ExtensionContractType,
    GetExtensionContractTypeOpts,
    SmartContractParams,
    SmartContractParamsInfo,
    SwapQuote,
    SwapQuoteConsumerBase,
    SwapQuoteConsumerOpts,
    SwapQuoteExecutionOpts,
    SwapQuoteGetOutputOpts,
} from '../types';
import { assert } from '../utils/assert';
import { swapQuoteConsumerUtils } from '../utils/swap_quote_consumer_utils';

import { ExchangeSwapQuoteConsumer } from './exchange_swap_quote_consumer';
import { ForwarderSwapQuoteConsumer } from './forwarder_swap_quote_consumer';

export class SwapQuoteConsumer implements SwapQuoteConsumerBase<SmartContractParams> {
    public readonly provider: ZeroExProvider;
    public readonly networkId: number;

    private readonly _exchangeConsumer: ExchangeSwapQuoteConsumer;
    private readonly _forwarderConsumer: ForwarderSwapQuoteConsumer;
    private readonly _contractWrappers: ContractWrappers;

    constructor(supportedProvider: SupportedProvider, options: Partial<SwapQuoteConsumerOpts> = {}) {
        const { networkId } = _.merge({}, constants.DEFAULT_SWAP_QUOTER_OPTS, options);
        assert.isNumber('networkId', networkId);

        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        this.provider = provider;
        this.networkId = networkId;

        this._exchangeConsumer = new ExchangeSwapQuoteConsumer(supportedProvider, options);
        this._forwarderConsumer = new ForwarderSwapQuoteConsumer(supportedProvider, options);
        this._contractWrappers = new ContractWrappers(this.provider, {
            networkId,
        });
    }

    /**
     * Given a SwapQuote, returns 'CalldataInfo' for a 0x exchange call. See type definition of CalldataInfo for more information.
     * @param quote An object that conforms to SwapQuote. See type definition for more information.
     * @param opts  Options for getting SmartContractParams. See type definition for more information.
     */
    public async getCalldataOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<SwapQuoteGetOutputOpts> = {},
    ): Promise<CalldataInfo> {
        assert.isValidSwapQuote('quote', quote);
        const consumer = await this._getConsumerForSwapQuoteAsync(opts);
        return consumer.getCalldataOrThrowAsync(quote, opts);
    }

    /**
     * Given a SwapQuote, returns 'SmartContractParamsInfo' for a 0x exchange call. See type definition of SmartContractParamsInfo for more information.
     * @param quote An object that conforms to SwapQuote. See type definition for more information.
     * @param opts  Options for getting SmartContractParams. See type definition for more information.
     */
    public async getSmartContractParamsOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<SwapQuoteGetOutputOpts> = {},
    ): Promise<SmartContractParamsInfo<SmartContractParams>> {
        assert.isValidSwapQuote('quote', quote);
        const consumer = await this._getConsumerForSwapQuoteAsync(opts);
        return consumer.getSmartContractParamsOrThrowAsync(quote, opts);
    }

    /**
     * Given a SwapQuote and desired rate (in takerAsset), attempt to execute the swap.
     * @param quote An object that conforms to SwapQuote. See type definition for more information.
     * @param opts  Options for getting CalldataInfo. See type definition for more information.
     */
    public async executeSwapQuoteOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<SwapQuoteExecutionOpts> = {},
    ): Promise<string> {
        assert.isValidSwapQuote('quote', quote);
        const consumer = await this._getConsumerForSwapQuoteAsync(opts);
        return consumer.executeSwapQuoteOrThrowAsync(quote, opts);
    }

    public async getOptimalExtensionContractTypeAsync(
        quote: SwapQuote,
        opts: Partial<GetExtensionContractTypeOpts> = {},
    ): Promise<ExtensionContractType> {
        return swapQuoteConsumerUtils.getExtensionContractTypeForSwapQuoteAsync(
            quote,
            this._contractWrappers,
            this.provider,
            opts,
        );
    }

    private async _getConsumerForSwapQuoteAsync(
        opts: Partial<SwapQuoteGetOutputOpts>,
    ): Promise<SwapQuoteConsumerBase<SmartContractParams>> {
        if (opts.useExtensionContract === ExtensionContractType.Forwarder) {
            return this._forwarderConsumer;
        }
        return this._exchangeConsumer;
    }
}
