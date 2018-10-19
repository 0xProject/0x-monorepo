import { AssetBuyer, BuyQuote } from '@0x/asset-buyer';
import * as React from 'react';

import { AsyncProcessState } from '../types';

// TODO: better name?

import { BuyButton } from './buy_button';
import { RetryButton } from './retry_button';
import { Container } from './ui';

interface AssetButtonProps {
    assetBuyer?: AssetBuyer;
    buyQuote?: BuyQuote;
    buyOrderState: AsyncProcessState;
    onBuyClick: (buyQuote: BuyQuote) => void;
    onBuySuccess: (buyQuote: BuyQuote) => void;
    onBuyFailure: (buyQuote: BuyQuote) => void;
}

export class AssetButton extends React.Component<AssetButtonProps, {}> {
    public render(): React.ReactNode {
        return (
            <Container padding="20px" width="100%">
                {this._renderButton()}
            </Container>
        );
    }
    private _renderButton(): React.ReactNode {
        // TODO: figure out why buyOrderState is undefined in beginning, get rid of default
        switch (this.props.buyOrderState) {
            case AsyncProcessState.FAILURE:
                return (
                    <RetryButton
                        onClick={() => {
                            console.log('try again');
                        }}
                    />
                );
            case AsyncProcessState.SUCCESS:
                return <div />;
            default:
                return (
                    <BuyButton
                        buyQuote={this.props.buyQuote}
                        assetBuyer={this.props.assetBuyer}
                        onClick={this.props.onBuyClick}
                        onBuySuccess={this.props.onBuySuccess}
                        onBuyFailure={this.props.onBuyFailure}
                        text={'Buy'}
                    />
                );
        }
    }
}
