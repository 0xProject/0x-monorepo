import * as React from 'react';

import { ColorOption } from '../style/theme';

import { Container, Flex, Text } from './ui';

export interface ZeroExInstantContainerProps {}

export const ZeroExInstantContainer: React.StatelessComponent<ZeroExInstantContainerProps> = props => (
    <Container width="350px" borderRadius="3px">
        <Flex direction="column">
            <Container backgroundColor={ColorOption.primaryColor} padding="20px">
                <Text
                    letterSpacing="1px"
                    fontColor={ColorOption.white}
                    opacity={0.7}
                    fontWeight={600}
                    textTransform="uppercase"
                >
                    I want to buy
                </Text>
                <Flex direction="row" justify="space-between">
                    <Container>
                        <Text textTransform="uppercase">0.00</Text>
                        <Text textTransform="uppercase"> rep </Text>
                    </Container>
                    <Flex direction="column">
                        <Text> 0 ETH </Text>
                        <Text> $0.00 </Text>
                    </Flex>
                </Flex>
            </Container>
            <Container padding="20px" backgroundColor={ColorOption.white}>
                <Text>hey</Text>
            </Container>
        </Flex>
    </Container>
);
