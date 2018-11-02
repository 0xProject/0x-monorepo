import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';

import { Maybe } from '../types';

import { ColorOption } from '../style/theme';
import { maybeBigNumberUtil } from '../util/maybe_big_number';
import { util } from '../util/util';

import { ScalingInput } from './scaling_input';

export interface ScalingAmountInputProps {
    isDisabled: boolean;
    maxFontSizePx: number;
    textLengthThreshold: number;
    fontColor?: ColorOption;
    value?: BigNumber;
    onAmountChange: (value?: BigNumber) => void;
    onFontSizeChange: (fontSizePx: number) => void;
}
interface ScalingAmountInputState {
    stringValue: string;
}

const { stringToMaybeBigNumber, areMaybeBigNumbersEqual } = maybeBigNumberUtil;
export class ScalingAmountInput extends React.Component<ScalingAmountInputProps, ScalingAmountInputState> {
    public static defaultProps = {
        onAmountChange: util.boundNoop,
        onFontSizeChange: util.boundNoop,
        isDisabled: false,
    };
    public constructor(props: ScalingAmountInputProps) {
        super(props);
        this.state = {
            stringValue: _.isUndefined(props.value) ? '' : props.value.toString(),
        };
    }
    public componentDidUpdate(): void {
        const parsedStateValue = stringToMaybeBigNumber(this.state.stringValue);
        const currentValue = this.props.value;

        if (!areMaybeBigNumbersEqual(parsedStateValue, currentValue)) {
            // we somehow got into the state in which the value passed in and the string value
            // in state have differed, reset state
            // we dont expect to ever get into this state, but let's make sure
            // we reset if we do since we're dealing with important numbers
            this.setState({
                stringValue: _.isUndefined(currentValue) ? '' : currentValue.toString(),
            });
        }
    }

    public render(): React.ReactNode {
        const { textLengthThreshold, fontColor, maxFontSizePx, onFontSizeChange } = this.props;
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

        // Trigger onAmountChange with a valid BigNumber, or undefined if the sanitizedValue is invalid or empty
        const bigNumberValue: Maybe<BigNumber> = _.isEmpty(sanitizedValue)
            ? undefined
            : stringToMaybeBigNumber(sanitizedValue);

        this.props.onAmountChange(bigNumberValue);
    };
}
