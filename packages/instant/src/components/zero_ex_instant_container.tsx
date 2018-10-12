import * as React from 'react';

import { LatestBuyQuoteOrderDetails } from '../containers/latest_buy_quote_order_details';
import { SelectedAssetBuyButton } from '../containers/selected_asset_buy_button';
import { SelectedAssetInstantHeading } from '../containers/selected_asset_instant_heading';

import { ColorOption } from '../style/theme';

import { Container, Flex } from './ui';

export interface ZeroExInstantContainerProps {}

export const ZeroExInstantContainer: React.StatelessComponent<ZeroExInstantContainerProps> = props => (
    <Container hasBoxShadow={true} width="350px" backgroundColor={ColorOption.white} borderRadius="3px">
        <Flex direction="column" justify="flex-start">
            <SelectedAssetInstantHeading />
            <LatestBuyQuoteOrderDetails />
            <SelectedAssetBuyButton />
        </Flex>
    </Container>
);
