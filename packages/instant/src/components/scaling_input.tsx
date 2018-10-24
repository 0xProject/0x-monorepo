import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption } from '../style/theme';
import { util } from '../util/util';

import { Input } from './ui';

export enum ScalingInputPhase {
    FixedFontSize,
    ScalingFontSize,
}

export interface ScalingSettings {
    percentageToReduceFontSizePerCharacter: number;
    percentageToIncreaseWidthPerCharacter: number;
}

export interface ScalingInputProps {
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
}

export interface ScalingInputState {
    inputWidthPxAtPhaseChange?: number;
}

export interface ScalingInputSnapshot {
    inputWidthPx: number;
}

// These are magic numbers that were determined experimentally.
const defaultScalingSettings: ScalingSettings = {
    percentageToReduceFontSizePerCharacter: 0.125,
    percentageToIncreaseWidthPerCharacter: 0.06,
};

export class ScalingInput extends React.Component<ScalingInputProps, ScalingInputState> {
    public static defaultProps = {
        onChange: util.boundNoop,
        onFontSizeChange: util.boundNoop,
        maxLength: 7,
        scalingSettings: defaultScalingSettings,
    };
    public state = {
        inputWidthPxAtPhaseChange: undefined,
    };
    private readonly _inputRef = React.createRef();
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
    public getSnapshotBeforeUpdate(): ScalingInputSnapshot {
        return {
            inputWidthPx: this._getInputWidthInPx(),
        };
    }
    public componentDidUpdate(
        prevProps: ScalingInputProps,
        prevState: ScalingInputState,
        snapshot: ScalingInputSnapshot,
    ): void {
        const prevPhase = ScalingInput.getPhaseFromProps(prevProps);
        const curPhase = ScalingInput.getPhaseFromProps(this.props);
        const prevFontSize = ScalingInput.calculateFontSizeFromProps(prevProps, prevPhase);
        const curFontSize = ScalingInput.calculateFontSizeFromProps(this.props, curPhase);
        // if we went from anything else to end, fix to the current width as it shouldn't change as we grow
        if (prevPhase !== ScalingInputPhase.ScalingFontSize && curPhase === ScalingInputPhase.ScalingFontSize) {
            this.setState({
                inputWidthPxAtPhaseChange: snapshot.inputWidthPx,
            });
        }
        // if we end from end to to anything else, un-fix the width
        if (prevPhase === ScalingInputPhase.ScalingFontSize && curPhase !== ScalingInputPhase.ScalingFontSize) {
            this.setState({
                inputWidthPxAtPhaseChange: undefined,
            });
        }
        // If font size has changed, notify.
        if (prevFontSize !== curFontSize) {
            this.props.onFontSizeChange(curFontSize);
        }
    }
    public render(): React.ReactNode {
        const { fontColor, onChange, placeholder, value, maxLength } = this.props;
        const phase = ScalingInput.getPhaseFromProps(this.props);
        return (
            <Input
                ref={this._inputRef as any}
                fontColor={fontColor}
                onChange={onChange}
                value={value}
                placeholder={placeholder}
                fontSize={`${this._calculateFontSize(phase)}px`}
                width={this._calculateWidth(phase)}
                maxLength={maxLength}
            />
        );
    }
    private readonly _calculateWidth = (phase: ScalingInputPhase): string => {
        const { value, textLengthThreshold, scalingSettings } = this.props;
        if (_.isEmpty(value)) {
            return `${this.props.emptyInputWidthCh}ch`;
        }
        switch (phase) {
            case ScalingInputPhase.FixedFontSize:
                return `${value.length}ch`;
            case ScalingInputPhase.ScalingFontSize:
                const { inputWidthPxAtPhaseChange } = this.state;
                if (!_.isUndefined(inputWidthPxAtPhaseChange)) {
                    const charactersOverMax = value.length - textLengthThreshold;
                    const scalingFactor =
                        (scalingSettings.percentageToIncreaseWidthPerCharacter + 1) ** charactersOverMax;
                    const width = scalingFactor * inputWidthPxAtPhaseChange;
                    return `${width}px`;
                }
                return `${textLengthThreshold}ch`;
            default:
                return '1ch';
        }
    };
    private readonly _calculateFontSize = (phase: ScalingInputPhase): number => {
        return ScalingInput.calculateFontSizeFromProps(this.props, phase);
    };
    private readonly _getInputWidthInPx = (): number => {
        const ref = this._inputRef.current;
        if (!ref) {
            return 0;
        }
        return (ref as any).getBoundingClientRect().width;
    };
}
