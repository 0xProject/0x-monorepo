import * as React from 'react';

import { ColorOption } from '../style/theme';

import { BuyButton } from './buy_button';
import { InstantHeading } from './instant_heading';
import { OrderDetails } from './order_details';
import { TokenSelection } from './token_selection';
import { Animation, Container, Flex } from './ui';

export interface ZeroExInstantContainerProps {}

export const ZeroExInstantContainer: React.StatelessComponent<ZeroExInstantContainerProps> = props => (
    <Container
        hasBoxShadow={true}
        width="350px"
        backgroundColor={ColorOption.white}
        borderRadius="3px"
        overflow="hidden"
        position="relative"
    >
        <Flex direction="column" justify="flex-start">
            <InstantHeading />
            <OrderDetails />
            <OrderDetails />
            <BuyButton />
        </Flex>
        {/* <Container position="absolute" top="0px" left="0px" width="100%" height="100%">
            <Animation type="easeUpFromBottom">
                <Container height="100%" backgroundColor={ColorOption.darkGrey}>
                    <TokenSelection />
                </Container>
            </Animation>
        </Container> */}
    </Container>
);
