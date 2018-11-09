import * as React from 'react';

import { AvailableERC20TokenSelector } from '../containers/available_erc20_token_selector';
import { LatestBuyQuoteOrderDetails } from '../containers/latest_buy_quote_order_details';
import { LatestError } from '../containers/latest_error';
import { SelectedAssetBuyOrderProgress } from '../containers/selected_asset_buy_order_progress';
import { SelectedAssetBuyOrderStateButtons } from '../containers/selected_asset_buy_order_state_buttons';
import { SelectedAssetInstantHeading } from '../containers/selected_asset_instant_heading';
import { ColorOption } from '../style/theme';
import { zIndex } from '../style/z_index';

import { SlideAnimationState } from './animations/slide_animation';
import { CSSReset } from './css_reset';
import { SlidingPanel } from './sliding_panel';
import { Container } from './ui/container';
import { Flex } from './ui/flex';

export interface ZeroExInstantContainerProps {}
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
                            <SelectedAssetBuyOrderProgress />
                            <LatestBuyQuoteOrderDetails />
                            <Container padding="20px" width="100%">
                                <SelectedAssetBuyOrderStateButtons />
                            </Container>
                        </Flex>
                        <SlidingPanel
                            title="Select Token"
                            animationState={this.state.tokenSelectionPanelAnimationState}
                            onClose={this._handlePanelClose}
                        >
                            <AvailableERC20TokenSelector onTokenSelect={this._handlePanelClose} />
                        </SlidingPanel>
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
}
