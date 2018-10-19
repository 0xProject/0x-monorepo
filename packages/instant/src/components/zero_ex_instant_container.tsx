import * as React from 'react';

import { LatestBuyQuoteOrderDetails } from '../containers/latest_buy_quote_order_details';
import { LatestError } from '../containers/latest_error';
import { SelectedAssetButton } from '../containers/selected_asset_button';
import { SelectedAssetInstantHeading } from '../containers/selected_asset_instant_heading';

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
                <LatestBuyQuoteOrderDetails />
                <Container padding="20px" width="100%">
                    <SelectedAssetButton />
                </Container>
            </Flex>
        </Container>
    </Container>
);
