import * as React from 'react';

import { ColorOption } from '../style/theme';

import { Container, Flex, Text } from './ui';

export interface OrderDetailsProps {}

export const OrderDetails: React.StatelessComponent<OrderDetailsProps> = props => (
    <Container padding="20px" width="100%">
        <Container marginBottom="10px">
            <Text
                letterSpacing="1px"
                fontColor={ColorOption.primaryColor}
                fontWeight={600}
                textTransform="uppercase"
                fontSize="14px"
            >
                Order Details
            </Text>
        </Container>
        <OrderDetailsRow name="Token Price" primaryValue=".013 ETH" secondaryValue="$24.32" />
        <OrderDetailsRow name="Fee" primaryValue=".005 ETH" secondaryValue="$1.04" />
        <OrderDetailsRow name="Total Cost" primaryValue="1.66 ETH" secondaryValue="$589.56" shouldEmphasize={true} />
    </Container>
);

OrderDetails.displayName = 'OrderDetails';

export interface OrderDetailsRowProps {
    name: string;
    primaryValue: string;
    secondaryValue: string;
    shouldEmphasize?: boolean;
}

export const OrderDetailsRow: React.StatelessComponent<OrderDetailsRowProps> = props => {
    const fontWeight = props.shouldEmphasize ? 700 : 400;
    return (
        <Container padding="10px 0px" borderTop="1px dashed" borderColor={ColorOption.feintGrey}>
            <Flex justify="space-between">
                <Text fontWeight={fontWeight} fontColor={ColorOption.grey}>
                    {props.name}
                </Text>
                <Container>
                    <Container marginRight="3px" display="inline-block">
                        <Text fontColor={ColorOption.lightGrey}>({props.secondaryValue}) </Text>
                    </Container>
                    <Text fontWeight={fontWeight} fontColor={ColorOption.grey}>
                        {props.primaryValue}
                    </Text>
                </Container>
            </Flex>
        </Container>
    );
};

OrderDetailsRow.defaultProps = {
    shouldEmphasize: false,
};

OrderDetailsRow.displayName = 'OrderDetailsRow';
