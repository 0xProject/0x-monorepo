import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption } from '../style/theme';

import { PaymentMethodDropdown } from './payment_method_dropdown';
import { Container } from './ui/container';
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
                <PaymentMethodDropdown />
            </Container>
        );
    }
}
