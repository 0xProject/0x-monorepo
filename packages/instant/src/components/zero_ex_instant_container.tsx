import * as React from 'react';

import { LatestBuyQuoteOrderDetails } from '../containers/latest_buy_quote_order_details';
import { LatestError } from '../containers/latest_error';
import { SelectedAssetBuyOrderStateButtons } from '../containers/selected_asset_buy_order_state_buttons';
import { SelectedAssetInstantHeading } from '../containers/selected_asset_instant_heading';

import { SelectedAssetBuyOrderProgress } from '../containers/selected_asset_buy_order_progress';

import { ColorOption } from '../style/theme';

import { Container, Flex } from './ui';
export interface ZeroExInstantContainerProps {}

export const ZeroExInstantContainer: React.StatelessComponent<ZeroExInstantContainerProps> = props => (
    <Container width="350px">
        <Container zIndex={1} position="relative">
            <LatestError />
        </Container>
        <Container
            zIndex={2}
            position="relative"
            backgroundColor={ColorOption.white}
            borderRadius="3px"
            hasBoxShadow={true}
        >
            <Flex direction="column" justify="flex-start">
                <SelectedAssetInstantHeading />
                <SelectedAssetBuyOrderProgress />
                <LatestBuyQuoteOrderDetails />
                <Container padding="20px" width="100%">
                    <SelectedAssetBuyOrderStateButtons />
                </Container>
            </Flex>
        </Container>
    </Container>
);
