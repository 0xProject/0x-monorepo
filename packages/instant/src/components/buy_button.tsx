import { AssetBuyer, BuyQuote } from '@0x/asset-buyer';
import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption } from '../style/theme';
import { util } from '../util/util';
import { web3Wrapper } from '../util/web3_wrapper';

import { Button, Text } from './ui';

export interface BuyButtonProps {
    buyQuote?: BuyQuote;
    assetBuyer?: AssetBuyer;
    onClick: (buyQuote: BuyQuote) => void;
    onBuySuccess: (buyQuote: BuyQuote, txnHash: string) => void;
    onBuyFailure: (buyQuote: BuyQuote, tnxHash?: string) => void;
}

export class BuyButton extends React.Component<BuyButtonProps> {
    public static defaultProps = {
        onClick: util.boundNoop,
        onBuySuccess: util.boundNoop,
        onBuyFailure: util.boundNoop,
    };
    public render(): React.ReactNode {
        const shouldDisableButton = _.isUndefined(this.props.buyQuote);
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
        if (_.isUndefined(this.props.buyQuote) || _.isUndefined(this.props.assetBuyer)) {
            return;
        }
        this.props.onClick(this.props.buyQuote);
        let txnHash;
        try {
            txnHash = await this.props.assetBuyer.executeBuyQuoteAsync(this.props.buyQuote, {
                gasLimit: 5000000,
            });
            await web3Wrapper.awaitTransactionSuccessAsync(txnHash);
            this.props.onBuySuccess(this.props.buyQuote, txnHash);
        } catch (e) {
            console.log('error', e);
            this.props.onBuyFailure(this.props.buyQuote, txnHash);
        }
    };
}
