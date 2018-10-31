import { AssetBuyer, AssetBuyerError, BuyQuote } from '@0x/asset-buyer';
import * as _ from 'lodash';
import * as React from 'react';

import { DEFAULT_GAS_PRICE, WEB_3_WRAPPER_TRANSACTION_FAILED_ERROR_MSG_PREFIX } from '../constants';
import { ColorOption } from '../style/theme';
import { ZeroExInstantError } from '../types';
import { getBestAddress } from '../util/address';
import { balanceUtil } from '../util/balance';
import { gasPriceEstimator } from '../util/gas_price_estimator';
import { util } from '../util/util';
import { web3Wrapper } from '../util/web3_wrapper';

import { Button, Text } from './ui';

export interface BuyButtonProps {
    buyQuote?: BuyQuote;
    assetBuyer?: AssetBuyer;
    onValidationPending: (buyQuote: BuyQuote) => void;
    onValidationFail: (buyQuote: BuyQuote, errorMessage: AssetBuyerError | ZeroExInstantError) => void;
    onSignatureDenied: (buyQuote: BuyQuote) => void;
    onBuyProcessing: (buyQuote: BuyQuote, txHash: string) => void;
    onBuySuccess: (buyQuote: BuyQuote, txHash: string) => void;
    onBuyFailure: (buyQuote: BuyQuote, txHash: string) => void;
}

export class BuyButton extends React.Component<BuyButtonProps> {
    public static defaultProps = {
        onClick: util.boundNoop,
        onBuySuccess: util.boundNoop,
        onBuyFailure: util.boundNoop,
    };
    public render(): React.ReactNode {
        const shouldDisableButton = _.isUndefined(this.props.buyQuote) || _.isUndefined(this.props.assetBuyer);
        return (
            <Button width="100%" onClick={this._handleClick} isDisabled={shouldDisableButton}>
                <Text fontColor={ColorOption.white} fontWeight={600} fontSize="20px">
                    Buy
                </Text>
            </Button>
        );
    }
    private readonly _handleClick = async () => {
        // The button is disabled when there is no buy quote anyway.
        const { buyQuote, assetBuyer } = this.props;
        if (_.isUndefined(buyQuote) || _.isUndefined(assetBuyer)) {
            return;
        }

        this.props.onValidationPending(buyQuote);
        const takerAddress = await getBestAddress();

        const hasSufficientEth = await balanceUtil.hasSufficientEth(takerAddress, buyQuote, web3Wrapper);
        if (!hasSufficientEth) {
            this.props.onValidationFail(buyQuote, ZeroExInstantError.InsufficientETH);
            return;
        }

        let txHash: string | undefined;
        const gasPrice = await gasPriceEstimator.getFastAmountInWeiAsync();
        try {
            txHash = await assetBuyer.executeBuyQuoteAsync(buyQuote, { takerAddress, gasPrice });
        } catch (e) {
            if (e instanceof Error) {
                if (e.message === AssetBuyerError.SignatureRequestDenied) {
                    this.props.onSignatureDenied(buyQuote);
                    return;
                } else if (e.message === AssetBuyerError.TransactionValueTooLow) {
                    this.props.onValidationFail(buyQuote, AssetBuyerError.TransactionValueTooLow);
                    return;
                }
            }
            throw e;
        }

        this.props.onBuyProcessing(buyQuote, txHash);
        try {
            await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        } catch (e) {
            if (e instanceof Error && e.message.startsWith(WEB_3_WRAPPER_TRANSACTION_FAILED_ERROR_MSG_PREFIX)) {
                this.props.onBuyFailure(buyQuote, txHash);
                return;
            }
            throw e;
        }
        this.props.onBuySuccess(buyQuote, txHash);
    };
}
