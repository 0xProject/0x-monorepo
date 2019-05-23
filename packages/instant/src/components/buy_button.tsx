import { AssetBuyer, AssetBuyerError, BuyQuote } from '@0x/asset-buyer';
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
    buyQuote?: BuyQuote;
    assetBuyer: AssetBuyer;
    web3Wrapper: Web3Wrapper;
    affiliateInfo?: AffiliateInfo;
    selectedAsset?: Asset;
    onValidationPending: (buyQuote: BuyQuote) => void;
    onValidationFail: (buyQuote: BuyQuote, errorMessage: AssetBuyerError | ZeroExInstantError) => void;
    onSignatureDenied: (buyQuote: BuyQuote) => void;
    onBuyProcessing: (buyQuote: BuyQuote, txHash: string, startTimeUnix: number, expectedEndTimeUnix: number) => void;
    onBuySuccess: (buyQuote: BuyQuote, txHash: string) => void;
    onBuyFailure: (buyQuote: BuyQuote, txHash: string) => void;
}

export class BuyButton extends React.PureComponent<BuyButtonProps> {
    public static defaultProps = {
        onClick: util.boundNoop,
        onBuySuccess: util.boundNoop,
        onBuyFailure: util.boundNoop,
    };
    public render(): React.ReactNode {
        const { buyQuote, accountAddress, selectedAsset } = this.props;
        const shouldDisableButton = buyQuote === undefined || accountAddress === undefined;
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
        const { buyQuote, assetBuyer, affiliateInfo, accountAddress, accountEthBalanceInWei, web3Wrapper } = this.props;
        if (buyQuote === undefined || accountAddress === undefined) {
            return;
        }
        this.props.onValidationPending(buyQuote);
        const ethNeededForBuy = buyQuote.worstCaseQuoteInfo.totalEthAmount;
        // if we don't have a balance for the user, let the transaction through, it will be handled by the wallet
        const hasSufficientEth = accountEthBalanceInWei === undefined || accountEthBalanceInWei.gte(ethNeededForBuy);
        if (!hasSufficientEth) {
            analytics.trackBuyNotEnoughEth(buyQuote);
            this.props.onValidationFail(buyQuote, ZeroExInstantError.InsufficientETH);
            return;
        }
        let txHash: string | undefined;
        const gasInfo = await gasPriceEstimator.getGasInfoAsync();
        const feeRecipient = oc(affiliateInfo).feeRecipient();
        try {
            analytics.trackBuyStarted(buyQuote);
            txHash = await assetBuyer.executeBuyQuoteAsync(buyQuote, {
                feeRecipient,
                takerAddress: accountAddress,
                gasPrice: gasInfo.gasPriceInWei,
            });
        } catch (e) {
            if (e instanceof Error) {
                if (e.message === AssetBuyerError.TransactionValueTooLow) {
                    analytics.trackBuySimulationFailed(buyQuote);
                    this.props.onValidationFail(buyQuote, AssetBuyerError.TransactionValueTooLow);
                    return;
                } else if (e.message === AssetBuyerError.SignatureRequestDenied) {
                    analytics.trackBuySignatureDenied(buyQuote);
                    this.props.onSignatureDenied(buyQuote);
                    return;
                } else {
                    errorReporter.report(e);
                    analytics.trackBuyUnknownError(buyQuote, e.message);
                    this.props.onValidationFail(buyQuote, ZeroExInstantError.CouldNotSubmitTransaction);
                    return;
                }
            }
            throw e;
        }
        const startTimeUnix = new Date().getTime();
        const expectedEndTimeUnix = startTimeUnix + gasInfo.estimatedTimeMs;
        this.props.onBuyProcessing(buyQuote, txHash, startTimeUnix, expectedEndTimeUnix);
        try {
            analytics.trackBuyTxSubmitted(buyQuote, txHash, startTimeUnix, expectedEndTimeUnix);
            await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        } catch (e) {
            if (e instanceof Error && e.message.startsWith(WEB_3_WRAPPER_TRANSACTION_FAILED_ERROR_MSG_PREFIX)) {
                analytics.trackBuyTxFailed(buyQuote, txHash, startTimeUnix, expectedEndTimeUnix);
                this.props.onBuyFailure(buyQuote, txHash);
                return;
            }
            throw e;
        }
        analytics.trackBuyTxSucceeded(buyQuote, txHash, startTimeUnix, expectedEndTimeUnix);
        this.props.onBuySuccess(buyQuote, txHash);
    };
}
