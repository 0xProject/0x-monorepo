import * as React from 'react';

import { AvailableERC20TokenSelector } from '../containers/available_erc20_token_selector';
import { ConnectedAccountPaymentMethod } from '../containers/connected_account_payment_method';
import { CurrentStandardSlidingPanel } from '../containers/current_standard_sliding_panel';
import { LatestBuyQuoteOrderDetails } from '../containers/latest_buy_quote_order_details';
import { LatestError } from '../containers/latest_error';
import { SelectedAssetBuyOrderProgress } from '../containers/selected_asset_buy_order_progress';
import { SelectedAssetBuyOrderStateButtons } from '../containers/selected_asset_buy_order_state_buttons';
import { SelectedAssetInstantHeading } from '../containers/selected_asset_instant_heading';
import { ColorOption } from '../style/theme';
import { zIndex } from '../style/z_index';
import { OrderProcessState, SlideAnimationState } from '../types';

import { CSSReset } from './css_reset';
import { SlidingPanel } from './sliding_panel';
import { Container } from './ui/container';
import { Flex } from './ui/flex';

export interface ZeroExInstantContainerProps {
    orderProcessState: OrderProcessState;
}
export interface ZeroExInstantContainerState {
    tokenSelectionPanelAnimationState: SlideAnimationState;
}

export class ZeroExInstantContainer extends React.Component<ZeroExInstantContainerProps, ZeroExInstantContainerState> {
    public state = {
        tokenSelectionPanelAnimationState: 'none' as SlideAnimationState,
    };
    public render(): React.ReactNode {
        return (
            <React.Fragment>
                <CSSReset />
                <Container
                    width={{ default: '350px', sm: '100%' }}
                    height={{ default: 'auto', sm: '100%' }}
                    position="relative"
                >
                    <Container position="relative">
                        <LatestError />
                    </Container>
                    <Container
                        zIndex={zIndex.mainContainer}
                        position="relative"
                        backgroundColor={ColorOption.white}
                        borderRadius="3px"
                        hasBoxShadow={true}
                        overflow="hidden"
                        height="100%"
                    >
                        <Flex direction="column" justify="flex-start" height="100%">
                            <SelectedAssetInstantHeading onSelectAssetClick={this._handleSymbolClick} />
                            {this._renderPaymentMethodOrBuyOrderProgress()}
                            <LatestBuyQuoteOrderDetails />
                            <Container padding="20px" width="100%">
                                <SelectedAssetBuyOrderStateButtons />
                            </Container>
                        </Flex>
                        <SlidingPanel
                            animationState={this.state.tokenSelectionPanelAnimationState}
                            onClose={this._handlePanelClose}
                        >
                            <AvailableERC20TokenSelector onTokenSelect={this._handlePanelClose} />
                        </SlidingPanel>
                        <CurrentStandardSlidingPanel />
                    </Container>
                </Container>
            </React.Fragment>
        );
    }
    private readonly _handleSymbolClick = (): void => {
        this.setState({
            tokenSelectionPanelAnimationState: 'slidIn',
        });
    };
    private readonly _handlePanelClose = (): void => {
        this.setState({
            tokenSelectionPanelAnimationState: 'slidOut',
        });
    };
    private readonly _renderPaymentMethodOrBuyOrderProgress = (): React.ReactNode => {
        const { orderProcessState } = this.props;
        if (
            orderProcessState === OrderProcessState.Processing ||
            orderProcessState === OrderProcessState.Success ||
            orderProcessState === OrderProcessState.Failure
        ) {
            return <SelectedAssetBuyOrderProgress />;
        } else {
            return <ConnectedAccountPaymentMethod />;
        }
        return null;
    };
}
