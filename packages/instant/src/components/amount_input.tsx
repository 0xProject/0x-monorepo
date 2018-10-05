import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption } from '../style/theme';

import { Container, Input } from './ui';

export interface AmountInputProps {
    fontColor?: ColorOption;
    fontSize?: string;
    value?: BigNumber;
    onChange?: (value: BigNumber) => void;
}

export class AmountInput extends React.Component<AmountInputProps> {
    public render(): React.ReactNode {
        const { fontColor, fontSize, value } = this.props;
        return (
            <Container borderBottom="1px solid rgba(255,255,255,0.3)" display="inline-block">
                <Input
                    fontColor={fontColor}
                    fontSize={fontSize}
                    onChange={this._handleChange}
                    value={value ? value.toString() : undefined}
                    placeholder="0.00"
                    width="2em"
                />
            </Container>
        );
    }
    private readonly _handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const bigNumberValue = new BigNumber(event.target.value);
        if (!_.isUndefined(this.props.onChange)) {
            this.props.onChange(bigNumberValue);
        }
    }
}
