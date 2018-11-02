import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption } from '../style/theme';
import { MaybeBigNumber } from '../types';
import { util } from '../util/util';

import { ScalingInput } from './scaling_input';

export interface ScalingAmountInputProps {
    isDisabled: boolean;
    maxFontSizePx: number;
    textLengthThreshold: number;
    fontColor?: ColorOption;
    value?: BigNumber;
    onChange: (value?: BigNumber) => void;
    onFontSizeChange: (fontSizePx: number) => void;
}
interface ScalingAmountInputState {
    stringValue: string;
}

const stringToMaybeBigNumber = (stringValue: string): MaybeBigNumber => {
    let maybeBigNumber: MaybeBigNumber;
    try {
        maybeBigNumber = new BigNumber(stringValue);
    } catch {
        maybeBigNumber = undefined;
    }
    return _.isNaN(maybeBigNumber) ? undefined : maybeBigNumber;
};

const areMaybeBigNumbersEqual = (val1: MaybeBigNumber, val2: MaybeBigNumber): boolean => {
    if (!_.isUndefined(val1) && !_.isUndefined(val2)) {
        return val1.equals(val2);
    }
    return _.isUndefined(val1) && _.isUndefined(val2);
};

export class ScalingAmountInput extends React.Component<ScalingAmountInputProps, ScalingAmountInputState> {
    public static defaultProps = {
        onChange: util.boundNoop,
        onFontSizeChange: util.boundNoop,
        isDisabled: false,
    };
    public constructor(props: ScalingAmountInputProps) {
        super(props);
        this.state = {
            stringValue: _.isUndefined(props.value) ? '' : props.value.toString(),
        };
    }
    public componentDidUpdate(prevProps: ScalingAmountInputProps): void {
        const parsedStateValue = stringToMaybeBigNumber(this.state.stringValue);
        const currentValue = this.props.value;

        if (!areMaybeBigNumbersEqual(parsedStateValue, currentValue)) {
            // we somehow got into the state in which the value passed in and the string value
            // in state have differed, reset state
            this.setState({
                stringValue: _.isUndefined(currentValue) ? '' : currentValue.toString(),
            });
        }
    }

    public render(): React.ReactNode {
        const { textLengthThreshold, fontColor, maxFontSizePx, value, onFontSizeChange } = this.props;
        return (
            <ScalingInput
                maxFontSizePx={maxFontSizePx}
                textLengthThreshold={textLengthThreshold}
                onFontSizeChange={onFontSizeChange}
                fontColor={fontColor}
                onChange={this._handleChange}
                value={this.state.stringValue}
                placeholder="0.00"
                emptyInputWidthCh={3.5}
                isDisabled={this.props.isDisabled}
            />
        );
    }
    private readonly _handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const sanitizedValue = event.target.value.replace(/[^0-9.]/g, ''); // only allow numbers and "."
        this.setState({
            stringValue: sanitizedValue,
        });

        // Trigger onChange with a valid BigNumber, or undefined if the sanitizedValue is invalid or empty
        const bigNumberValue: MaybeBigNumber = _.isEmpty(sanitizedValue)
            ? undefined
            : stringToMaybeBigNumber(sanitizedValue);

        this.props.onChange(bigNumberValue);
    };
}
