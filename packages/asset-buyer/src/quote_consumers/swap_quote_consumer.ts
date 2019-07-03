import { ContractWrappers } from '@0x/contract-wrappers';
import { BigNumber, providerUtils } from '@0x/utils';
import { SupportedProvider, ZeroExProvider } from '@0x/web3-wrapper';
import * as _ from 'lodash';

import { constants } from '../constants';
import {
    CalldataInfo,
    DynamicSwapQuoteExecutionOpts,
    DynamicSwapQuoteGetOutputOpts,
    SmartContractParams,
    SmartContractParamsInfo,
    SwapQuote,
    SwapQuoteConsumerBase,
    SwapQuoteConsumerOpts,
    ValidSwapQuoteConsumer,
} from '../types';
import { assert } from '../utils/assert';
import { assetDataUtils } from '../utils/asset_data_utils';
import { swapQuoteConsumerUtils } from '../utils/swap_quote_consumer_utils';

import { ExchangeSwapQuoteConsumer } from './exchange_swap_quote_consumer';
import { ForwarderSwapQuoteConsumer } from './forwarder_swap_quote_consumer';

export class SwapQuoteConsumer implements SwapQuoteConsumerBase<SmartContractParams> {
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

    public async getCalldataOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<DynamicSwapQuoteGetOutputOpts>,
    ): Promise<CalldataInfo> {
        assert.isValidSwapQuote('quote', quote);
        const consumer = await this.getConsumerForSwapQuoteAsync(quote, opts);
        return consumer.getCalldataOrThrowAsync(quote, opts);
    }

    public async getSmartContractParamsOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<DynamicSwapQuoteGetOutputOpts>,
    ): Promise<SmartContractParamsInfo<SmartContractParams>> {
        assert.isValidSwapQuote('quote', quote);
        const consumer = await this.getConsumerForSwapQuoteAsync(quote, opts);
        return consumer.getSmartContractParamsOrThrowAsync(quote, opts);
    }

    public async executeSwapQuoteOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<DynamicSwapQuoteExecutionOpts>,
    ): Promise<string> {
        assert.isValidSwapQuote('quote', quote);
        const consumer = await this.getConsumerForSwapQuoteAsync(quote, opts);
        return consumer.executeSwapQuoteOrThrowAsync(quote, opts);
    }

    public async getConsumerForSwapQuoteAsync(
        quote: SwapQuote,
        opts: Partial<DynamicSwapQuoteGetOutputOpts>,
    ): Promise<ValidSwapQuoteConsumer> {
        const wethAssetData = assetDataUtils.getEtherTokenAssetData(this._contractWrappers);
        if (swapQuoteConsumerUtils.isValidForwarderSwapQuote(quote, wethAssetData)) {
            if (opts.takerAddress !== undefined) {
                assert.isETHAddressHex('takerAddress', opts.takerAddress);
            }
            const ethAmount = opts.ethAmount || quote.worstCaseQuoteInfo.totalTakerTokenAmount;
            const takerAddress = await swapQuoteConsumerUtils.getTakerAddressAsync(this.provider, opts);
            const takerEthAndWethBalance = takerAddress !== undefined ? await swapQuoteConsumerUtils.getEthAndWethBalanceAsync(
                this.provider,
                this._contractWrappers,
                takerAddress,
            ) : [constants.ZERO_AMOUNT, constants.ZERO_AMOUNT];
            // TODO(david): when considering if there is enough Eth balance, should account for gas costs.
            const isEnoughEthAndWethBalance = _.map(takerEthAndWethBalance, (balance: BigNumber) =>
                balance.isGreaterThanOrEqualTo(ethAmount),
            );
            if (isEnoughEthAndWethBalance[1]) {
                // should be more gas efficient to use exchange consumer, so if possible use it.
                return this._exchangeConsumer;
            } else if (isEnoughEthAndWethBalance[0] && !isEnoughEthAndWethBalance[1]) {
                return this._forwarderConsumer;
            }
            // Note: defaulting to forwarderConsumer if takerAddress is null or not enough balance of either wEth or Eth
            return this._forwarderConsumer;
        } else {
            return this._exchangeConsumer;
        }
    }
}
