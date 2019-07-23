import { ContractWrappers } from '@0x/contract-wrappers';
import { providerUtils } from '@0x/utils';
import { SupportedProvider, ZeroExProvider } from '@0x/web3-wrapper';
import * as _ from 'lodash';

import { constants } from '../constants';
import {
    CalldataInfo,
    ConsumerType,
    ExchangeWrappersParams,
    ExchangeWrappersParamsInfo,
    SmartContractParams,
    SmartContractParamsInfo,
    SwapQuote,
    SwapQuoteConsumerBase,
    SwapQuoteConsumerOpts,
    SwapQuoteExecutionOpts,
    SwapQuoteGetExchangeWrappersParamsOpts,
    SwapQuoteGetOutputOpts,
} from '../types';
import { assert } from '../utils/assert';
import { swapQuoteConsumerUtils } from '../utils/swap_quote_consumer_utils';

import { ExchangeSwapQuoteConsumer } from './exchange_swap_quote_consumer';
import { ForwarderSwapQuoteConsumer } from './forwarder_swap_quote_consumer';

export class SwapQuoteConsumer implements SwapQuoteConsumerBase<SmartContractParams, ExchangeWrappersParams> {
    public readonly provider: ZeroExProvider;
    public readonly networkId: number;

    private readonly _contractWrappers: ContractWrappers;
    private readonly _exchangeConsumer: ExchangeSwapQuoteConsumer;
    private readonly _forwarderConsumer: ForwarderSwapQuoteConsumer;

    constructor(supportedProvider: SupportedProvider, options: Partial<SwapQuoteConsumerOpts> = {}) {
        const { networkId } = _.merge({}, constants.DEFAULT_SWAP_QUOTER_OPTS, options);
        assert.isNumber('networkId', networkId);

        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        this.provider = provider;
        this.networkId = networkId;
        this._contractWrappers = new ContractWrappers(this.provider, {
            networkId,
        });

        this._exchangeConsumer = new ExchangeSwapQuoteConsumer(supportedProvider, options);
        this._forwarderConsumer = new ForwarderSwapQuoteConsumer(supportedProvider, options);
    }

    public async getExchangeWrappersParamsOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<SwapQuoteGetExchangeWrappersParamsOpts>,
    ): Promise<ExchangeWrappersParamsInfo<ExchangeWrappersParams>> {
        return this._exchangeConsumer.getExchangeWrappersParamsOrThrowAsync(quote, opts);
    }

    public async getCalldataOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<SwapQuoteGetOutputOpts>,
    ): Promise<CalldataInfo> {
        assert.isValidSwapQuote('quote', quote);
        const consumer = await this._getConsumerForSwapQuoteAsync(quote, opts);
        return consumer.getCalldataOrThrowAsync(quote, opts);
    }

    public async getSmartContractParamsOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<SwapQuoteGetOutputOpts>,
    ): Promise<SmartContractParamsInfo<SmartContractParams>> {
        assert.isValidSwapQuote('quote', quote);
        const consumer = await this._getConsumerForSwapQuoteAsync(quote, opts);
        return consumer.getSmartContractParamsOrThrowAsync(quote, opts);
    }

    public async executeSwapQuoteOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<SwapQuoteExecutionOpts>,
    ): Promise<string> {
        assert.isValidSwapQuote('quote', quote);
        const consumer = await this._getConsumerForSwapQuoteAsync(quote, opts);
        return consumer.executeSwapQuoteOrThrowAsync(quote, opts);
    }

    private async _getConsumerForSwapQuoteAsync(
        quote: SwapQuote,
        opts: Partial<SwapQuoteGetOutputOpts>,
    ): Promise<SwapQuoteConsumerBase<SmartContractParams, ExchangeWrappersParams>> {
        if (opts.useConsumerType === ConsumerType.Exchange) {
            return this._exchangeConsumer;
        } else if (opts.useConsumerType === ConsumerType.Forwarder) {
            return this._forwarderConsumer;
        } else {
            return swapQuoteConsumerUtils.getConsumerForSwapQuoteAsync(
                quote,
                this._contractWrappers,
                this.provider,
                this._exchangeConsumer,
                this._forwarderConsumer,
                opts,
            );
        }
    }
}
