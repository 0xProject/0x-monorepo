import { AssetBuyer, AssetBuyerError, BuyQuote } from '@0x/asset-buyer';
import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption } from '../style/theme';
import { util } from '../util/util';
import { web3Wrapper } from '../util/web3_wrapper';

import { Button, Text } from './ui';

export interface BuyButtonProps {
    buyQuote?: BuyQuote;
    assetBuyer?: AssetBuyer;
    onAwaitingSignature: (buyQuote: BuyQuote) => void;
    onSignatureDenied: (buyQuote: BuyQuote, preventedError: Error) => void;
    onBuyProcessing: (buyQuote: BuyQuote, txnHash: string) => void;
    onBuySuccess: (buyQuote: BuyQuote, txnHash: string) => void;
    onBuyFailure: (buyQuote: BuyQuote, txnHash?: string) => void; // TODO: make this non-optional
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

        let txnHash: string | undefined;
        this.props.onAwaitingSignature(buyQuote);
        try {
            txnHash = await assetBuyer.executeBuyQuoteAsync(buyQuote);
        } catch (e) {
            if (e instanceof Error && e.message === AssetBuyerError.SignatureRequestDenied) {
                this.props.onSignatureDenied(buyQuote, e);
            } else {
                throw e;
            }
        }

        // Have to let TS know that txHash is definitely defined now
        if (!txnHash) {
            throw new Error('No txHash available');
        }

        this.props.onBuyProcessing(buyQuote, txnHash);
        try {
            await web3Wrapper.awaitTransactionSuccessAsync(txnHash);
        } catch (e) {
            if (e instanceof Error && e.message.startsWith('Transaction failed')) {
                this.props.onBuyFailure(buyQuote, txnHash);
                return;
            }
            throw e;
        }
        this.props.onBuySuccess(buyQuote, txnHash);
    };
}
