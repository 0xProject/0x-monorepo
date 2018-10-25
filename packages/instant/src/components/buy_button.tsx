import { AssetBuyer, AssetBuyerError, BuyQuote } from '@0x/asset-buyer';
import * as _ from 'lodash';
import * as React from 'react';

import { WEB_3_WRAPPER_TRANSACTION_FAILED_ERROR_MSG_PREFIX } from '../constants';
import { ColorOption } from '../style/theme';
import { util } from '../util/util';
import { web3Wrapper } from '../util/web3_wrapper';

import { Button, Text } from './ui';

export interface BuyButtonProps {
    buyQuote?: BuyQuote;
    assetBuyer?: AssetBuyer;
    onAwaitingSignature: (buyQuote: BuyQuote) => void;
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

        let txHash: string | undefined;
        this.props.onAwaitingSignature(buyQuote);
        try {
            txHash = await assetBuyer.executeBuyQuoteAsync(buyQuote);
        } catch (e) {
            if (e instanceof Error && e.message === AssetBuyerError.SignatureRequestDenied) {
                this.props.onSignatureDenied(buyQuote, e);
            } else {
                throw e;
            }
        }

        // Have to let TS know that txHash is definitely defined now
        if (!txHash) {
            throw new Error('No txHash available');
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
