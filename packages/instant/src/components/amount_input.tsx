import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption } from '../style/theme';

import { Container, Input } from './ui';

export interface AmountInputProps {
    fontColor?: ColorOption;
    fontSize?: string;
    value?: BigNumber;
    onChange?: (value?: BigNumber) => void;
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
                    value={!_.isUndefined(value) ? value.toString() : ''}
                    placeholder="0.00"
                    width="2em"
                />
            </Container>
        );
    }
    private readonly _handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const value = event.target.value;
        let bigNumberValue;
        if (!_.isEmpty(value)) {
            try {
                bigNumberValue = new BigNumber(event.target.value);
            } catch {
                // We don't want to allow values that can't be a BigNumber, so don't even call onChange.
                return;
            }
        }
        if (!_.isUndefined(this.props.onChange)) {
            this.props.onChange(bigNumberValue);
        }
    };
}
