import { ContractAddresses } from '@0x/contract-addresses';
import { ExchangeContract } from '@0x/contract-wrappers';
import { providerUtils } from '@0x/utils';
import { SupportedProvider, ZeroExProvider } from '@0x/web3-wrapper';
import * as _ from 'lodash';

import { constants } from '../constants';
import {
    CalldataInfo,
    MarketOperation,
    SwapQuote,
    SwapQuoteConsumerBase,
    SwapQuoteConsumerOpts,
    SwapQuoteExecutionOpts,
    SwapQuoteGetOutputOpts,
} from '../types';
import { assert } from '../utils/assert';
import { swapQuoteConsumerUtils } from '../utils/swap_quote_consumer_utils';

export class ExchangeSwapQuoteConsumer implements SwapQuoteConsumerBase {
    public readonly provider: ZeroExProvider;
    public readonly chainId: number;

    private readonly _exchangeContract: ExchangeContract;

    constructor(
        supportedProvider: SupportedProvider,
        contractAddresses: ContractAddresses,
        options: Partial<SwapQuoteConsumerOpts> = {},
    ) {
        const { chainId } = _.merge({}, constants.DEFAULT_SWAP_QUOTER_OPTS, options);
        assert.isNumber('chainId', chainId);
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        this.provider = provider;
        this.chainId = chainId;
        this._exchangeContract = new ExchangeContract(contractAddresses.exchange, supportedProvider);
    }

    public async getCalldataOrThrowAsync(
        quote: SwapQuote,
        _opts: Partial<SwapQuoteGetOutputOpts> = {},
    ): Promise<CalldataInfo> {
        assert.isValidSwapQuote('quote', quote);
        const { orders } = quote;
        const signatures = _.map(orders, o => o.signature);

        let calldataHexString;
        if (quote.type === MarketOperation.Buy) {
            calldataHexString = this._exchangeContract
                .marketBuyOrdersFillOrKill(orders, quote.makerAssetFillAmount, signatures)
                .getABIEncodedTransactionData();
        } else {
            calldataHexString = this._exchangeContract
                .marketSellOrdersFillOrKill(orders, quote.takerAssetFillAmount, signatures)
                .getABIEncodedTransactionData();
        }

        return {
            calldataHexString,
            ethAmount: quote.worstCaseQuoteInfo.protocolFeeInWeiAmount,
            toAddress: this._exchangeContract.address,
        };
    }

    public async executeSwapQuoteOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<SwapQuoteExecutionOpts>,
    ): Promise<string> {
        assert.isValidSwapQuote('quote', quote);

        const { takerAddress, gasLimit, ethAmount } = opts;

        if (takerAddress !== undefined) {
            assert.isETHAddressHex('takerAddress', takerAddress);
        }
        if (gasLimit !== undefined) {
            assert.isNumber('gasLimit', gasLimit);
        }
        if (ethAmount !== undefined) {
            assert.isBigNumber('ethAmount', ethAmount);
        }
        const { orders, gasPrice } = quote;
        const signatures = orders.map(o => o.signature);

        const finalTakerAddress = await swapQuoteConsumerUtils.getTakerAddressOrThrowAsync(this.provider, opts);
        const value = ethAmount || quote.worstCaseQuoteInfo.protocolFeeInWeiAmount;
        let txHash: string;
        if (quote.type === MarketOperation.Buy) {
            const { makerAssetFillAmount } = quote;
            txHash = await this._exchangeContract
                .marketBuyOrdersFillOrKill(orders, makerAssetFillAmount, signatures)
                .sendTransactionAsync({
                    from: finalTakerAddress,
                    gas: gasLimit,
                    gasPrice,
                    value,
                });
        } else {
            const { takerAssetFillAmount } = quote;
            txHash = await this._exchangeContract
                .marketSellOrdersFillOrKill(orders, takerAssetFillAmount, signatures)
                .sendTransactionAsync({
                    from: finalTakerAddress,
                    gas: gasLimit,
                    gasPrice,
                    value,
                });
        }
        // TODO(dorothy-zbornak): Handle signature request denied
        // (see contract-wrappers/decorators)
        // and ExchangeRevertErrors.IncompleteFillError.
        return txHash;
    }
}
