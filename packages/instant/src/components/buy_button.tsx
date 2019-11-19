import {
    affiliateFeeUtils,
    ExtensionContractType,
    MarketBuySwapQuote,
    SwapQuoteConsumer,
    SwapQuoteConsumerError,
    SwapQuoter,
} from '@0x/asset-swapper';
import { AssetProxyId } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';
import * as React from 'react';
import { oc } from 'ts-optchain';

import { WEB_3_WRAPPER_TRANSACTION_FAILED_ERROR_MSG_PREFIX } from '../constants';
import { ColorOption } from '../style/theme';
import { AffiliateInfo, Asset, ZeroExInstantError } from '../types';
import { analytics } from '../util/analytics';
import { errorReporter } from '../util/error_reporter';
import { gasPriceEstimator } from '../util/gas_price_estimator';
import { util } from '../util/util';

import { Button } from './ui/button';

export interface BuyButtonProps {
    accountAddress?: string;
    accountEthBalanceInWei?: BigNumber;
    swapQuote?: MarketBuySwapQuote;
    swapQuoter: SwapQuoter;
    swapQuoteConsumer: SwapQuoteConsumer;
    web3Wrapper: Web3Wrapper;
    affiliateInfo?: AffiliateInfo;
    selectedAsset?: Asset;
    onValidationPending: (swapQuote: MarketBuySwapQuote) => void;
    onValidationFail: (
        swapQuote: MarketBuySwapQuote,
        errorMessage: SwapQuoteConsumerError | ZeroExInstantError,
    ) => void;
    onSignatureDenied: (swapQuote: MarketBuySwapQuote) => void;
    onBuyProcessing: (
        swapQuote: MarketBuySwapQuote,
        txHash: string,
        startTimeUnix: number,
        expectedEndTimeUnix: number,
    ) => void;
    onBuySuccess: (swapQuote: MarketBuySwapQuote, txHash: string) => void;
    onBuyFailure: (swapQuote: MarketBuySwapQuote, txHash: string) => void;
}

export class BuyButton extends React.PureComponent<BuyButtonProps> {
    public static defaultProps = {
        onClick: util.boundNoop,
        onBuySuccess: util.boundNoop,
        onBuyFailure: util.boundNoop,
    };
    public render(): React.ReactNode {
        const { swapQuote, accountAddress, selectedAsset } = this.props;
        const shouldDisableButton = swapQuote === undefined || accountAddress === undefined;
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
            swapQuote,
            swapQuoteConsumer,
            affiliateInfo,
            accountAddress,
            accountEthBalanceInWei,
            web3Wrapper,
        } = this.props;
        if (swapQuote === undefined || accountAddress === undefined) {
            return;
        }
        this.props.onValidationPending(swapQuote);
        const ethNeededForBuy = affiliateFeeUtils.getTotalEthAmountWithAffiliateFee(swapQuote.worstCaseQuoteInfo, 0);
        // if we don't have a balance for the user, let the transaction through, it will be handled by the wallet
        const hasSufficientEth = accountEthBalanceInWei === undefined || accountEthBalanceInWei.gte(ethNeededForBuy);
        if (!hasSufficientEth) {
            analytics.trackBuyNotEnoughEth(swapQuote);
            this.props.onValidationFail(swapQuote, ZeroExInstantError.InsufficientETH);
            return;
        }
        let txHash: string | undefined;
        const gasInfo = await gasPriceEstimator.getGasInfoAsync();
        const feeRecipient = oc(affiliateInfo).feeRecipient();
        const feePercentage = oc(affiliateInfo).feePercentage();
        try {
            analytics.trackBuyStarted(swapQuote);
            txHash = await swapQuoteConsumer.executeSwapQuoteOrThrowAsync(swapQuote, {
                useExtensionContract: ExtensionContractType.Forwarder,
                extensionContractOpts: {
                    feeRecipient,
                    feePercentage,
                },
                takerAddress: accountAddress,
            });
        } catch (e) {
            if (e instanceof Error) {
                if (e.message === SwapQuoteConsumerError.TransactionValueTooLow) {
                    analytics.trackBuySimulationFailed(swapQuote);
                    this.props.onValidationFail(swapQuote, SwapQuoteConsumerError.TransactionValueTooLow);
                    return;
                } else if (e.message === SwapQuoteConsumerError.SignatureRequestDenied) {
                    analytics.trackBuySignatureDenied(swapQuote);
                    this.props.onSignatureDenied(swapQuote);
                    return;
                } else {
                    errorReporter.report(e);
                    analytics.trackBuyUnknownError(swapQuote, e.message);
                    this.props.onValidationFail(swapQuote, ZeroExInstantError.CouldNotSubmitTransaction);
                    return;
                }
            }
            // HACK(dekz): Wrappers no longer include decorators which map errors
            // like transaction deny
            if (e.message && e.message.includes('User denied transaction signature')) {
                analytics.trackBuySignatureDenied(swapQuote);
                this.props.onSignatureDenied(swapQuote);
                return;
            }
            throw e;
        }
        const startTimeUnix = new Date().getTime();
        const expectedEndTimeUnix = startTimeUnix + gasInfo.estimatedTimeMs;
        this.props.onBuyProcessing(swapQuote, txHash, startTimeUnix, expectedEndTimeUnix);
        try {
            analytics.trackBuyTxSubmitted(swapQuote, txHash, startTimeUnix, expectedEndTimeUnix);
            await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        } catch (e) {
            if (e instanceof Error && e.message.startsWith(WEB_3_WRAPPER_TRANSACTION_FAILED_ERROR_MSG_PREFIX)) {
                analytics.trackBuyTxFailed(swapQuote, txHash, startTimeUnix, expectedEndTimeUnix);
                this.props.onBuyFailure(swapQuote, txHash);
                return;
            }
            throw e;
        }
        analytics.trackBuyTxSucceeded(swapQuote, txHash, startTimeUnix, expectedEndTimeUnix);
        this.props.onBuySuccess(swapQuote, txHash);
    };
}
