import * as React from 'react';

import { ColorOption } from '../style/theme';

import { Container, Flex, Text } from './ui';

export interface ZeroExInstantContainerProps {}

export const ZeroExInstantContainer: React.StatelessComponent<ZeroExInstantContainerProps> = props => (
    <Flex direction="column" width="350px" justify="flex-start">
        <Container backgroundColor={ColorOption.primaryColor} padding="20px" width="100%">
            <Container marginBottom="5px">
                <Text
                    letterSpacing="1px"
                    fontColor={ColorOption.white}
                    opacity={0.7}
                    fontWeight={500}
                    textTransform="uppercase"
                    fontSize="12px"
                >
                    I want to buy
                </Text>
            </Container>
            <Flex direction="row" justify="space-between">
                <Container>
                    <Text fontSize="45px" fontColor={ColorOption.white} opacity={0.7} textTransform="uppercase">
                        0.00
                    </Text>
                    <Container display="inline-block" marginLeft="10px">
                        <Text fontSize="45px" fontColor={ColorOption.white} textTransform="uppercase">
                            rep
                        </Text>
                    </Container>
                </Container>
                <Flex direction="column" justify="space-between">
                    <Container marginBottom="5px">
                        <Text fontSize="16px" fontColor={ColorOption.white} fontWeight={500}>
                            0 ETH
                        </Text>
                    </Container>
                    <Text fontSize="16px" fontColor={ColorOption.white} opacity={0.7}>
                        $0.00
                    </Text>
                </Flex>
            </Flex>
        </Container>
        <Container padding="20px" backgroundColor={ColorOption.white} width="100%">
            <Text>hey</Text>
        </Container>
    </Flex>
);
