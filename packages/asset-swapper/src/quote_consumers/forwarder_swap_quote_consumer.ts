import { ContractAddresses } from '@0x/contract-addresses';
import { ForwarderContract } from '@0x/contract-wrappers';
import { assetDataUtils } from '@0x/order-utils';
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
import { affiliateFeeUtils } from '../utils/affiliate_fee_utils';
import { assert } from '../utils/assert';
import { swapQuoteConsumerUtils } from '../utils/swap_quote_consumer_utils';

export class ForwarderSwapQuoteConsumer implements SwapQuoteConsumerBase {
    public readonly provider: ZeroExProvider;
    public readonly chainId: number;

    private readonly _contractAddresses: ContractAddresses;
    private readonly _forwarder: ForwarderContract;

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
        this._contractAddresses = contractAddresses;
        this._forwarder = new ForwarderContract(contractAddresses.forwarder, supportedProvider);
    }

    /**
     * Given a SwapQuote, returns 'CalldataInfo' for a forwarder extension call. See type definition of CalldataInfo for more information.
     * @param quote An object that conforms to SwapQuote. See type definition for more information.
     * @param opts  Options for getting CalldataInfo. See type definition for more information.
     */
    public async getCalldataOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<SwapQuoteGetOutputOpts> = {},
    ): Promise<CalldataInfo> {
        assert.isValidForwarderSwapQuote('quote', quote, this._getEtherTokenAssetDataOrThrow());
        const { extensionContractOpts } = { ...constants.DEFAULT_FORWARDER_SWAP_QUOTE_GET_OPTS, ...opts };
        assert.isValidForwarderExtensionContractOpts('extensionContractOpts', extensionContractOpts);
        const { feeRecipient, feePercentage } = extensionContractOpts;
        const { orders, worstCaseQuoteInfo } = quote;

        const normalizedFeeRecipientAddress = feeRecipient.toLowerCase();
        const signatures = _.map(orders, o => o.signature);
        const ethAmountWithFees = affiliateFeeUtils.getTotalEthAmountWithAffiliateFee(
            worstCaseQuoteInfo,
            feePercentage,
        );
        const feeAmount = affiliateFeeUtils.getFeeAmount(worstCaseQuoteInfo, feePercentage);

        let calldataHexString;
        if (quote.type === MarketOperation.Buy) {
            calldataHexString = this._forwarder
                .marketBuyOrdersWithEth(
                    orders,
                    quote.makerAssetFillAmount,
                    signatures,
                    [feeAmount],
                    [normalizedFeeRecipientAddress],
                )
                .getABIEncodedTransactionData();
        } else {
            calldataHexString = this._forwarder
                .marketSellOrdersWithEth(orders, signatures, [feeAmount], [normalizedFeeRecipientAddress])
                .getABIEncodedTransactionData();
        }

        return {
            calldataHexString,
            toAddress: this._forwarder.address,
            ethAmount: ethAmountWithFees,
        };
    }

    /**
     * Given a SwapQuote and desired rate (in Eth), attempt to execute the swap.
     * @param quote An object that conforms to SwapQuote. See type definition for more information.
     * @param opts  Options for getting CalldataInfo. See type definition for more information.
     */
    public async executeSwapQuoteOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<SwapQuoteExecutionOpts>,
    ): Promise<string> {
        assert.isValidForwarderSwapQuote('quote', quote, this._getEtherTokenAssetDataOrThrow());

        const { ethAmount: providedEthAmount, takerAddress, gasLimit, extensionContractOpts } = {
            ...constants.DEFAULT_FORWARDER_SWAP_QUOTE_EXECUTE_OPTS,
            ...opts,
        };

        assert.isValidForwarderExtensionContractOpts('extensionContractOpts', extensionContractOpts);

        const { feeRecipient, feePercentage } = extensionContractOpts;

        if (providedEthAmount !== undefined) {
            assert.isBigNumber('ethAmount', providedEthAmount);
        }
        if (takerAddress !== undefined) {
            assert.isETHAddressHex('takerAddress', takerAddress);
        }
        if (gasLimit !== undefined) {
            assert.isNumber('gasLimit', gasLimit);
        }
        const { orders, gasPrice } = quote; // tslint:disable-line:no-unused-variable
        const signatures = orders.map(o => o.signature);

        // get taker address
        const finalTakerAddress = await swapQuoteConsumerUtils.getTakerAddressOrThrowAsync(this.provider, opts);
        // if no ethAmount is provided, default to the worst totalTakerAssetAmount
        const ethAmountWithFees =
            providedEthAmount ||
            affiliateFeeUtils.getTotalEthAmountWithAffiliateFee(quote.worstCaseQuoteInfo, feePercentage);
        const feeAmount = affiliateFeeUtils.getFeeAmount(quote.worstCaseQuoteInfo, feePercentage);
        let txHash: string;
        if (quote.type === MarketOperation.Buy) {
            const { makerAssetFillAmount } = quote;
            txHash = await this._forwarder
                .marketBuyOrdersWithEth(orders, makerAssetFillAmount, signatures, [feeAmount], [feeRecipient])
                .sendTransactionAsync({
                    from: finalTakerAddress,
                    gas: gasLimit,
                    gasPrice,
                    value: ethAmountWithFees,
                });
        } else {
            txHash = await this._forwarder
                .marketSellOrdersWithEth(orders, signatures, [feeAmount], [feeRecipient])
                .sendTransactionAsync({
                    from: finalTakerAddress,
                    gas: gasLimit,
                    gasPrice,
                    value: ethAmountWithFees,
                });
        }
        // TODO(dorothy-zbornak): Handle signature request denied
        // (see contract-wrappers/decorators)
        // and ForwarderRevertErrors.CompleteBuyFailed.
        return txHash;
    }

    private _getEtherTokenAssetDataOrThrow(): string {
        return assetDataUtils.encodeERC20AssetData(this._contractAddresses.etherToken);
    }
}
