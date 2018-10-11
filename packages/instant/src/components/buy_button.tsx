import { BuyQuote } from '@0xproject/asset-buyer';
import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption } from '../style/theme';
import { assetBuyer } from '../util/asset_buyer';
import { web3Wrapper } from '../util/web3_wrapper';

import { Button, Container, Text } from './ui';

export interface BuyButtonProps {
    buyQuote?: BuyQuote;
    onClick: (buyQuote: BuyQuote) => void;
    onBuySuccess: (buyQuote: BuyQuote) => void;
    onBuyFailure: (buyQuote: BuyQuote) => void;
    text: string;
}

const boundNoop = _.noop.bind(_);

export class BuyButton extends React.Component<BuyButtonProps> {
    public static defaultProps = {
        onClick: boundNoop,
        onBuySuccess: boundNoop,
        onBuyFailure: boundNoop,
    };
    public render(): React.ReactNode {
        const shouldDisableButton = _.isUndefined(this.props.buyQuote);
        return (
            <Container padding="20px" width="100%">
                <Button width="100%" onClick={this._handleClick} isDisabled={shouldDisableButton}>
                    <Text fontColor={ColorOption.white} fontWeight={600} fontSize="20px">
                        {this.props.text}
                    </Text>
                </Button>
            </Container>
        );
    }
    private readonly _handleClick = async () => {
        // The button is disabled when there is no buy quote anyway.
        if (_.isUndefined(this.props.buyQuote)) {
            return;
        }
        this.props.onClick(this.props.buyQuote);
        try {
            const txnHash = await assetBuyer.executeBuyQuoteAsync(this.props.buyQuote, {
                // HACK: There is a calculation issue in asset-buyer. ETH is refunded anyway so just over-estimate.
                ethAmount: this.props.buyQuote.worstCaseQuoteInfo.totalEthAmount.mul(2),
            });
            await web3Wrapper.awaitTransactionSuccessAsync(txnHash);
        } catch {
            this.props.onBuyFailure(this.props.buyQuote);
        }
        this.props.onBuySuccess(this.props.buyQuote);
    };
}
