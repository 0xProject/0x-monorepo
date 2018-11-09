import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption } from '../style/theme';
import { Network } from '../types';

import { PaymentMethodDropdown } from './payment_method_dropdown';
import { Circle } from './ui/circle';
import { Container } from './ui/container';
import { Flex } from './ui/flex';
import { Text } from './ui/text';

export interface PaymentMethodProps {}

export const PaymentMethod: React.StatelessComponent<PaymentMethodProps> = () => (
    <Container padding="20px" width="100%">
        <Container marginBottom="10px">
            <Flex justify="space-between">
                <Text
                    letterSpacing="1px"
                    fontColor={ColorOption.primaryColor}
                    fontWeight={600}
                    textTransform="uppercase"
                    fontSize="14px"
                >
                    Payment Method
                </Text>
                <Flex>
                    <Circle color={ColorOption.green} diameter={8} />
                    <Container marginLeft="3px">
                        <Text fontColor={ColorOption.darkGrey} fontSize="12px">
                            MetaMask
                        </Text>
                    </Container>
                </Flex>
            </Flex>
        </Container>
        <PaymentMethodDropdown
            accountAddress="0xa1b2c3d4e5f6g7h8j9k10"
            accountEthBalanceInWei={new BigNumber(10500000000000000000)}
            network={Network.Mainnet}
        />
    </Container>
);
