import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption } from '../style/theme';
import { util } from '../util/util';

import { ScalingInput } from './scaling_input';
import { Container, Text } from './ui';

export interface AmountInputProps {
    fontColor?: ColorOption;
    fontSize?: string;
    value?: BigNumber;
    onChange: (value?: BigNumber) => void;
}

export class AmountInput extends React.Component<AmountInputProps> {
    public static defaultProps = {
        onChange: util.boundNoop,
    };
    public render(): React.ReactNode {
        const { fontColor, fontSize, value } = this.props;
        return (
            <Container borderBottom="1px solid rgba(255,255,255,0.3)" display="inline-block">
                <ScalingInput
                    startWidthCh={3.5}
                    endWidthCh={6}
                    startFontSizePx={45}
                    fontColor={fontColor}
                    onChange={this._handleChange}
                    value={!_.isUndefined(value) ? value.toString() : ''}
                    placeholder="0.00"
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
        this.props.onChange(bigNumberValue);
    };
}
