import * as React from 'react';

import { SelectedAssetBuyButton } from '../containers/selected_asset_buy_button';
import { SelectedAssetInstantHeading } from '../containers/selected_asset_instant_heading';

import { ColorOption } from '../style/theme';

import { BuyButton } from './buy_button';
import { InstantHeading } from './instant_heading';
import { OrderDetails } from './order_details';
import { Container, Flex } from './ui';

export interface ZeroExInstantContainerProps {}

export const ZeroExInstantContainer: React.StatelessComponent<ZeroExInstantContainerProps> = props => (
    <Container hasBoxShadow={true} width="350px" backgroundColor={ColorOption.white} borderRadius="3px">
        <Flex direction="column" justify="flex-start">
            <SelectedAssetInstantHeading />
            <OrderDetails />
            <SelectedAssetBuyButton />
        </Flex>
    </Container>
);
