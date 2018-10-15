import * as React from 'react';

import { ColorOption } from '../style/theme';

import { BuyButton } from './buy_button';
import { InstantHeading } from './instant_heading';
import { OrderDetails } from './order_details';
import { SlidingError } from './sliding_error';
import { Container, Flex } from './ui';

export interface ZeroExInstantContainerProps {}

export const ZeroExInstantContainer: React.StatelessComponent<ZeroExInstantContainerProps> = props => (
    <Container width="350px">
        <Container
            zIndex={2}
            position="relative"
            backgroundColor={ColorOption.white}
            borderRadius="3px"
            hasBoxShadow={true}
        >
            <Flex direction="column" justify="flex-start">
                <InstantHeading />
                <OrderDetails />
                <BuyButton />
            </Flex>
        </Container>
    </Container>
);
