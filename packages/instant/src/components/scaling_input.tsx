import { ObjectMap } from '@0x/types';
import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption } from '../style/theme';
import { util } from '../util/util';

import { Input } from './ui/input';

export enum ScalingInputPhase {
    FixedFontSize,
    ScalingFontSize,
}

export interface ScalingSettings {
    percentageToReduceFontSizePerCharacter: number;
    // 1ch = the width of the 0 chararacter.
    // Allow to customize 'char' length for different characters.
    characterWidthOverrides: ObjectMap<number>;
    // How much room to leave to the right of the scaling input.
    additionalInputSpaceInCh: number;
}

export interface ScalingInputProps {
    type?: string;
    textLengthThreshold: number;
    maxFontSizePx: number;
    value: string;
    emptyInputWidthCh: number;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onFontSizeChange: (fontSizePx: number) => void;
    fontColor?: ColorOption;
    placeholder?: string;
    maxLength?: number;
    scalingSettings: ScalingSettings;
    isDisabled: boolean;
    hasAutofocus: boolean;
}

export interface ScalingInputSnapshot {
    inputWidthPx: number;
}

// These are magic numbers that were determined experimentally.
const defaultScalingSettings: ScalingSettings = {
    percentageToReduceFontSizePerCharacter: 0.1,
    characterWidthOverrides: {
        '1': 0.7,
        '.': 0.4,
    },
    additionalInputSpaceInCh: 0.4,
};

export class ScalingInput extends React.PureComponent<ScalingInputProps> {
    public static defaultProps = {
        onChange: util.boundNoop,
        onFontSizeChange: util.boundNoop,
        maxLength: 9,
        scalingSettings: defaultScalingSettings,
        isDisabled: false,
        hasAutofocus: false,
    };
    private readonly _inputRef = React.createRef<HTMLInputElement>();
    public static getPhase(textLengthThreshold: number, value: string): ScalingInputPhase {
        if (value.length <= textLengthThreshold) {
            return ScalingInputPhase.FixedFontSize;
        }
        return ScalingInputPhase.ScalingFontSize;
    }
    public static getPhaseFromProps(props: ScalingInputProps): ScalingInputPhase {
        const { value, textLengthThreshold } = props;
        return ScalingInput.getPhase(textLengthThreshold, value);
    }
    public static calculateFontSize(
        textLengthThreshold: number,
        maxFontSizePx: number,
        phase: ScalingInputPhase,
        value: string,
        percentageToReduceFontSizePerCharacter: number,
    ): number {
        if (phase !== ScalingInputPhase.ScalingFontSize) {
            return maxFontSizePx;
        }
        const charactersOverMax = value.length - textLengthThreshold;
        const scalingFactor = (1 - percentageToReduceFontSizePerCharacter) ** charactersOverMax;
        const fontSize = scalingFactor * maxFontSizePx;
        return fontSize;
    }
    public static calculateFontSizeFromProps(props: ScalingInputProps, phase: ScalingInputPhase): number {
        const { textLengthThreshold, value, maxFontSizePx, scalingSettings } = props;
        return ScalingInput.calculateFontSize(
            textLengthThreshold,
            maxFontSizePx,
            phase,
            value,
            scalingSettings.percentageToReduceFontSizePerCharacter,
        );
    }
    public componentDidMount(): void {
        // Trigger an initial notification of the calculated fontSize.
        const currentPhase = ScalingInput.getPhaseFromProps(this.props);
        const currentFontSize = ScalingInput.calculateFontSizeFromProps(this.props, currentPhase);
        this.props.onFontSizeChange(currentFontSize);
    }
    public componentDidUpdate(prevProps: ScalingInputProps): void {
        const prevPhase = ScalingInput.getPhaseFromProps(prevProps);
        const curPhase = ScalingInput.getPhaseFromProps(this.props);
        const prevFontSize = ScalingInput.calculateFontSizeFromProps(prevProps, prevPhase);
        const curFontSize = ScalingInput.calculateFontSizeFromProps(this.props, curPhase);
        // If font size has changed, notify.
        if (prevFontSize !== curFontSize) {
            this.props.onFontSizeChange(curFontSize);
        }
    }
    public render(): React.ReactNode {
        const { type, hasAutofocus, isDisabled, fontColor, placeholder, value, maxLength } = this.props;
        const phase = ScalingInput.getPhaseFromProps(this.props);
        return (
            <Input
                type={type}
                ref={this._inputRef as any}
                fontColor={fontColor}
                onChange={this._handleChange}
                value={value}
                placeholder={placeholder}
                fontSize={`${this._calculateFontSize(phase)}px`}
                width={this._calculateWidth(phase)}
                maxLength={maxLength}
                disabled={isDisabled}
                autoFocus={hasAutofocus}
            />
        );
    }
    private readonly _calculateWidth = (phase: ScalingInputPhase): string => {
        const { value, scalingSettings } = this.props;
        if (_.isEmpty(value)) {
            return `${this.props.emptyInputWidthCh}ch`;
        }
        const lengthInCh = _.reduce(
            value.split(''),
            (sum, char) => {
                const widthOverride = scalingSettings.characterWidthOverrides[char];
                if (widthOverride !== undefined) {
                    // tslint is confused
                    // tslint:disable-next-line:restrict-plus-operands
                    return sum + widthOverride;
                }
                return sum + 1;
            },
            scalingSettings.additionalInputSpaceInCh,
        );
        return `${lengthInCh}ch`;
    };
    private readonly _calculateFontSize = (phase: ScalingInputPhase): number => {
        return ScalingInput.calculateFontSizeFromProps(this.props, phase);
    };
    private readonly _handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const value = event.target.value;
        const { maxLength } = this.props;
        if (value !== undefined && maxLength !== undefined && value.length > maxLength) {
            return;
        }
        this.props.onChange(event);
    };
}
