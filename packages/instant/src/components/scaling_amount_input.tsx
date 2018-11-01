// TODO: maybe store the state in here instead?
import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption } from '../style/theme';
import { util } from '../util/util';

import { ScalingInput } from './scaling_input';

export interface ScalingAmountInputProps {
    isDisabled: boolean;
    maxFontSizePx: number;
    textLengthThreshold: number;
    fontColor?: ColorOption;
    value?: string;
    onChange: (value: string) => void;
    onFontSizeChange: (fontSizePx: number) => void;
}

export class ScalingAmountInput extends React.Component<ScalingAmountInputProps> {
    public static defaultProps = {
        onChange: util.boundNoop,
        onFontSizeChange: util.boundNoop,
        isDisabled: false,
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
                value={value || ''}
                placeholder="0.00"
                emptyInputWidthCh={3.5}
                isDisabled={this.props.isDisabled}
            />
        );
    }
    private readonly _handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const value = event.target.value;
        this.props.onChange(value);
    };
}
