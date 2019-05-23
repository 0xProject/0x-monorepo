import { AssetProxyId } from '@0x/types';
import * as React from 'react';

import PoweredByLogo from '../assets/powered_by_0x.svg';
import { ZERO_EX_SITE_URL } from '../constants';
import { AvailableERC20TokenSelector } from '../containers/available_erc20_token_selector';
import { ConnectedBuyOrderProgressOrPaymentMethod } from '../containers/connected_buy_order_progress_or_payment_method';
import { CurrentStandardSlidingPanel } from '../containers/current_standard_sliding_panel';
import { LatestBuyQuoteOrderDetails } from '../containers/latest_buy_quote_order_details';
import { LatestError } from '../containers/latest_error';
import { SelectedAssetBuyOrderStateButtons } from '../containers/selected_asset_buy_order_state_buttons';
import { SelectedAssetInstantHeading } from '../containers/selected_asset_instant_heading';
import { ColorOption } from '../style/theme';
import { zIndex } from '../style/z_index';
import { Asset, SlideAnimationState } from '../types';
import { analytics, TokenSelectorClosedVia } from '../util/analytics';

import { CSSReset } from './css_reset';
import { SlidingPanel } from './sliding_panel';
import { Container } from './ui/container';
import { Flex } from './ui/flex';

export interface ZeroExInstantContainerProps {}
export interface ZeroExInstantContainerState {
    tokenSelectionPanelAnimationState: SlideAnimationState;
}

export class ZeroExInstantContainer extends React.PureComponent<
    ZeroExInstantContainerProps,
    ZeroExInstantContainerState
> {
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
                        borderRadius={{ default: '3px', sm: '0px' }}
                        hasBoxShadow={true}
                        overflow="hidden"
                        height="100%"
                    >
                        <Flex direction="column" justify="flex-start" height="100%">
                            <SelectedAssetInstantHeading onSelectAssetClick={this._handleSymbolClick} />
                            <ConnectedBuyOrderProgressOrPaymentMethod />
                            <LatestBuyQuoteOrderDetails />
                            <Container padding="20px" width="100%">
                                <SelectedAssetBuyOrderStateButtons />
                            </Container>
                        </Flex>
                        <SlidingPanel
                            animationState={this.state.tokenSelectionPanelAnimationState}
                            onClose={this._handlePanelCloseClickedX}
                            onAnimationEnd={this._handleSlidingPanelAnimationEnd}
                        >
                            <AvailableERC20TokenSelector onTokenSelect={this._handlePanelCloseAfterChose} />
                        </SlidingPanel>
                        <CurrentStandardSlidingPanel />
                    </Container>
                    <Container
                        display={{ sm: 'none', default: 'block' }}
                        marginTop="10px"
                        marginLeft="auto"
                        marginRight="auto"
                        width="108px"
                    >
                        <a href={ZERO_EX_SITE_URL} target="_blank">
                            <PoweredByLogo />
                        </a>
                    </Container>
                </Container>
            </React.Fragment>
        );
    }
    private readonly _handleSymbolClick = (asset?: Asset): void => {
        // TODO: If ERC721 link open sea or allow to choose another ERC721?
        if (asset === undefined || asset.metaData.assetProxyId === AssetProxyId.ERC20) {
            analytics.trackTokenSelectorOpened();
            this.setState({
                tokenSelectionPanelAnimationState: 'slidIn',
            });
        }
    };
    private readonly _handlePanelCloseClickedX = (): void => {
        this._handlePanelClose(TokenSelectorClosedVia.ClickedX);
    };
    private readonly _handlePanelCloseAfterChose = (): void => {
        this._handlePanelClose(TokenSelectorClosedVia.TokenChose);
    };
    private readonly _handlePanelClose = (closedVia: TokenSelectorClosedVia): void => {
        analytics.trackTokenSelectorClosed(closedVia);
        this.setState({
            tokenSelectionPanelAnimationState: 'slidOut',
        });
    };
    private readonly _handleSlidingPanelAnimationEnd = (): void => {
        if (this.state.tokenSelectionPanelAnimationState === 'slidOut') {
            // When the slidOut animation completes, don't keep the panel mounted.
            // Performance optimization
            this.setState({ tokenSelectionPanelAnimationState: 'none' });
        }
    };
}
