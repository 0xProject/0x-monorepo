import { AssetBuyer, AssetBuyerError, BuyQuote } from '@0x/asset-buyer';
import * as _ from 'lodash';
import * as React from 'react';

import { WEB_3_WRAPPER_TRANSACTION_FAILED_ERROR_MSG_PREFIX } from '../constants';
import { ColorOption } from '../style/theme';
import { ZeroExInstantError } from '../types';
import { getBestAddress } from '../util/address';
import { balanceUtil } from '../util/balance';
import { util } from '../util/util';
import { web3Wrapper } from '../util/web3_wrapper';

import { Button, Text } from './ui';

export interface BuyButtonProps {
    buyQuote?: BuyQuote;
    assetBuyer?: AssetBuyer;
    onValidationPending: (buyQuote: BuyQuote) => void;
    onValidationFail: (buyQuote: BuyQuote, errorMessage: AssetBuyerError | ZeroExInstantError) => void;
    onSignatureDenied: (buyQuote: BuyQuote, preventedError: Error) => void;
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

        const hasSufficentEth = await balanceUtil.hasSufficentEth(takerAddress, buyQuote, web3Wrapper);
        if (!hasSufficentEth) {
            this.props.onValidationFail(buyQuote, ZeroExInstantError.InsufficientETH);
            return;
        }

        let txHash: string | undefined;
        try {
            txHash = await assetBuyer.executeBuyQuoteAsync(buyQuote, { takerAddress });
        } catch (e) {
            if (e instanceof Error) {
                if (e.message === AssetBuyerError.SignatureRequestDenied) {
                    this.props.onSignatureDenied(buyQuote, e);
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
