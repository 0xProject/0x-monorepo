import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption } from '../style/theme';

import { Container } from './ui/container';
import { Dropdown } from './ui/dropdown';
import { Text } from './ui/text';

export interface PaymentMethodProps {}

export class PaymentMethod extends React.Component<PaymentMethodProps> {
    public render(): React.ReactNode {
        return (
            <Container padding="20px" width="100%">
                <Container marginBottom="10px">
                    <Text
                        letterSpacing="1px"
                        fontColor={ColorOption.primaryColor}
                        fontWeight={600}
                        textTransform="uppercase"
                        fontSize="14px"
                    >
                        Payment Method
                    </Text>
                </Container>
                <Dropdown value="0x00000000000000" label="25.33 ETH" />
            </Container>
        );
    }
}
