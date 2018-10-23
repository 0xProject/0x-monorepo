import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption } from '../style/theme';
import { util } from '../util/util';

import { ScalingInput } from './scaling_input';

export interface ScalingAmountInputProps {
    maxFontSizePx: number;
    textLengthThreshold: number;
    fontColor?: ColorOption;
    value?: BigNumber;
    onChange: (value?: BigNumber, fontSize?: number) => void;
    onFontSizeChange: (fontSizePx: number) => void;
}

export class ScalingAmountInput extends React.Component<ScalingAmountInputProps> {
    public static defaultProps = {
        onChange: util.boundNoop,
        onFontSizeChange: util.boundNoop,
    };
    public render(): React.ReactNode {
        const { textLengthThreshold, fontColor, maxFontSizePx, value, onFontSizeChange } = this.props;
        return (
            <ScalingInput
                maxFontSizePx={maxFontSizePx}
                textLengthThreshold={textLengthThreshold}
                onFontSizeChange={onFontSizeChange}
                fontColor={fontColor}
                onChange={this._handleChange}
                value={!_.isUndefined(value) ? value.toString() : ''}
                placeholder="0.00"
                emptyInputWidthCh={3.5}
            />
        );
    }
    private readonly _handleChange = (event: React.ChangeEvent<HTMLInputElement>, fontSize?: number): void => {
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
        this.props.onChange(bigNumberValue, fontSize);
    };
}
