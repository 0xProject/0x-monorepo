import { AssetProxyId } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';
import * as React from 'react';
import { oc } from 'ts-optchain';

import { WEB_3_WRAPPER_TRANSACTION_FAILED_ERROR_MSG_PREFIX } from '../constants';
import { ColorOption } from '../style/theme';
import { AffiliateInfo, Asset, ZeroExAPIQuoteResponse, ZeroExInstantError } from '../types';
import { affiliateFeeUtils } from '../util/affiliate_fee_utils';
import { analytics } from '../util/analytics';
import { errorReporter } from '../util/error_reporter';
import { gasPriceEstimator } from '../util/gas_price_estimator';
import { util } from '../util/util';

import { Button } from './ui/button';

export interface BuyButtonProps {
    accountAddress?: string;
    accountEthBalanceInWei?: BigNumber;
    quote?: ZeroExAPIQuoteResponse;
    web3Wrapper: Web3Wrapper;
    affiliateInfo?: AffiliateInfo;
    selectedAsset?: Asset;
    onValidationPending: (quote: ZeroExAPIQuoteResponse) => void;
    onValidationFail: (
        quote: ZeroExAPIQuoteResponse,
        errorMessage: ZeroExInstantError, // TODO
    ) => void;
    onSignatureDenied: (quote: ZeroExAPIQuoteResponse) => void;
    onBuyProcessing: (
        quote: ZeroExAPIQuoteResponse,
        txHash: string,
        startTimeUnix: number,
        expectedEndTimeUnix: number,
    ) => void;
    onBuySuccess: (quote: ZeroExAPIQuoteResponse, txHash: string) => void;
    onBuyFailure: (quote: ZeroExAPIQuoteResponse, txHash: string) => void;
}

export class BuyButton extends React.PureComponent<BuyButtonProps> {
    public static defaultProps = {
        onClick: util.boundNoop,
        onBuySuccess: util.boundNoop,
        onBuyFailure: util.boundNoop,
    };
    public render(): React.ReactNode {
        const { quote, accountAddress, selectedAsset } = this.props;
        const shouldDisableButton = quote === undefined || accountAddress === undefined;
        const buttonText =
            selectedAsset !== undefined && selectedAsset.metaData.assetProxyId === AssetProxyId.ERC20
                ? `Buy ${selectedAsset.metaData.symbol.toUpperCase()}`
                : 'Buy Now';
        return (
            <Button
                width="100%"
                onClick={this._handleClick}
                isDisabled={shouldDisableButton}
                fontColor={ColorOption.white}
            >
                {buttonText}
            </Button>
        );
    }
    private readonly _handleClick = async () => {
        // The button is disabled when there is no buy quote anyway.
        const {
            quote,
            affiliateInfo,
            accountAddress,
            accountEthBalanceInWei,
            web3Wrapper,
        } = this.props;
        if (quote === undefined || accountAddress === undefined) {
            return;
        }
        this.props.onValidationPending(quote);
        const ethNeededForBuy = affiliateFeeUtils.getTotalEthAmountWithAffiliateFee(quote, 0);
        // if we don't have a balance for the user, let the transaction through, it will be handled by the wallet
        const hasSufficientEth = accountEthBalanceInWei === undefined || accountEthBalanceInWei.gte(ethNeededForBuy);
        if (!hasSufficientEth) {
            analytics.trackBuyNotEnoughEth(quote);
            this.props.onValidationFail(quote, ZeroExInstantError.InsufficientETH);
            return;
        }
        let txHash: string | undefined;
        const gasInfo = await gasPriceEstimator.getGasInfoAsync();
        try {
            analytics.trackBuyStarted(quote);
            txHash = await web3Wrapper.sendTransactionAsync({
                from: accountAddress,
                to: quote.to,
                value: quote.value,
                data: quote.data,
                gasPrice: quote.gasPrice,
                gas: quote.gas,
            });
        } catch (e) {
            if (e instanceof Error) {
                // TODO
                // if (e.message === SwapQuoteConsumerError.TransactionValueTooLow) {
                //     analytics.trackBuySimulationFailed(swapQuote);
                //     this.props.onValidationFail(swapQuote, SwapQuoteConsumerError.TransactionValueTooLow);
                //     return;
                // } else if (e.message === SwapQuoteConsumerError.SignatureRequestDenied) {
                //     analytics.trackBuySignatureDenied(swapQuote);
                //     this.props.onSignatureDenied(swapQuote);
                //     return;
                // } else {
                //     errorReporter.report(e);
                //     analytics.trackBuyUnknownError(swapQuote, e.message);
                //     this.props.onValidationFail(swapQuote, ZeroExInstantError.CouldNotSubmitTransaction);
                //     return;
                // }
            }
            // HACK(dekz): Wrappers no longer include decorators which map errors
            // like transaction deny
            // if (e.message && e.message.includes('User denied transaction signature')) {
            //     analytics.trackBuySignatureDenied(swapQuote);
            //     this.props.onSignatureDenied(swapQuote);
            //     return;
            // }
            throw e;
        }
        const startTimeUnix = new Date().getTime();
        const expectedEndTimeUnix = startTimeUnix + gasInfo.estimatedTimeMs;
        this.props.onBuyProcessing(quote, txHash, startTimeUnix, expectedEndTimeUnix);
        try {
            analytics.trackBuyTxSubmitted(quote, txHash, startTimeUnix, expectedEndTimeUnix);
            await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        } catch (e) {
            if (e instanceof Error && e.message.startsWith(WEB_3_WRAPPER_TRANSACTION_FAILED_ERROR_MSG_PREFIX)) {
                analytics.trackBuyTxFailed(quote, txHash, startTimeUnix, expectedEndTimeUnix);
                this.props.onBuyFailure(quote, txHash);
                return;
            }
            throw e;
        }
        analytics.trackBuyTxSucceeded(quote, txHash, startTimeUnix, expectedEndTimeUnix);
        this.props.onBuySuccess(quote, txHash);
    };
}
