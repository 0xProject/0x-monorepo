import * as React from 'react';

import { LatestBuyQuoteOrderDetails } from '../containers/latest_buy_quote_order_details';
import { LatestError } from '../containers/latest_error';
import { SelectedAssetBuyOrderStateButtons } from '../containers/selected_asset_buy_order_state_buttons';
import { SelectedAssetInstantHeading } from '../containers/selected_asset_instant_heading';
import { ColorOption } from '../style/theme';
import { zIndex } from '../style/z_index';

import { Panel } from './panel';
import { Container, Flex } from './ui';

export interface ZeroExInstantContainerProps {}

export const ZeroExInstantContainer: React.StatelessComponent<ZeroExInstantContainerProps> = props => (
    <Container width="350px" position="relative">
        <Container zIndex={zIndex.errorPopup} position="relative">
            <LatestError />
        </Container>
        <Container
            zIndex={zIndex.mainContainer}
            position="relative"
            backgroundColor={ColorOption.white}
            borderRadius="3px"
            hasBoxShadow={true}
            overflow="hidden"
        >
            <Flex direction="column" justify="flex-start">
                <SelectedAssetInstantHeading />
                <LatestBuyQuoteOrderDetails />
                <Container padding="20px" width="100%">
                    <SelectedAssetBuyOrderStateButtons />
                </Container>
            </Flex>
            {/* <Container position="absolute" left="0px" bottom="0px" width="100%" height="100%">
                <SlideAnimationHelper direction="up" downY="200px">
                    <Panel> Hey </Panel>
                </SlideAnimationHelper>
            </Container> */}
        </Container>
    </Container>
);
