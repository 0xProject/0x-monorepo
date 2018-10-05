import { BigNumber } from '@0xproject/utils';
import * as React from 'react';

import { ColorOption } from '../style/theme';

import { Container, Flex, Input, Text } from './ui';

export interface AmountInputProps {
    fontColor?: ColorOption;
    fontSize?: string;
    value?: BigNumber;
    onChange?: (value: BigNumber) => void;
}

export const AmountInput: React.StatelessComponent<AmountInputProps> = props => (
    <Container borderBottom="1px solid rgba(255,255,255,0.3)" display="inline-block">
        <Input
            fontColor={props.fontColor}
            fontSize={props.fontSize}
            value={props.value ? props.value.toString() : undefined}
            placeholder="0.00"
            width="2em"
        />
    </Container>
);

AmountInput.defaultProps = {};
