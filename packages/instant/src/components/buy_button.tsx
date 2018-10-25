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
    onProcessingTransaction: (buyQuote: BuyQuote, txnHash: string) => void;
    onBuySuccess: (buyQuote: BuyQuote, txnHash: string) => void;
    onBuyFailure: (buyQuote: BuyQuote, tnxHash?: string) => void;
    onBuyPrevented: (buyQuote: BuyQuote, preventedError: Error) => void;
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
        this.props.onAwaitingSignature(buyQuote);
        let txnHash;
        try {
            txnHash = await assetBuyer.executeBuyQuoteAsync(buyQuote);
            this.props.onProcessingTransaction(buyQuote, txnHash);
            await web3Wrapper.awaitTransactionSuccessAsync(txnHash);
            this.props.onBuySuccess(buyQuote, txnHash);
        } catch (e) {
            console.log(e);
            if (e instanceof Error && e.message === AssetBuyerError.SignatureRequestDenied) {
                this.props.onBuyPrevented(buyQuote, e);
                return;
            }
            this.props.onBuyFailure(buyQuote, txnHash);
        }
    };
}
