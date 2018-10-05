import * as React from 'react';

import { ColorOption } from '../style/theme';

import { InstantHeading } from './instant_heading';
import { OrderDetails } from './order_details';
import { Container, Flex, Text } from './ui';

export interface ZeroExInstantContainerProps {}

export const ZeroExInstantContainer: React.StatelessComponent<ZeroExInstantContainerProps> = props => (
    <Flex direction="column" width="350px" justify="flex-start">
        <InstantHeading />
        <OrderDetails />
    </Flex>
);
