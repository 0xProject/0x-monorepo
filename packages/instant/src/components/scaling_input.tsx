import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption } from '../style/theme';
import { util } from '../util/util';

import { Input } from './ui';

export enum ScalingInputPhase {
    FixedFontSize,
    ScalingFontSize,
}

export interface ScalingInputProps {
    endWidthCh: number;
    maxFontSizePx: number;
    value: string;
    emptyInputWidthCh: number;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onFontSizeChange: (fontSizePx: number) => void;
    fontColor?: ColorOption;
    placeholder?: string;
    maxLength?: number;
}

export interface ScalingInputState {
    fixedWidthInPxIfExists?: number;
}

export interface ScalingInputSnapshot {
    inputWidthPx: number;
}
// This is a magic number that was determined experimentally.
const percentageToReduceByPerCharacter = 0.18;
export class ScalingInput extends React.Component<ScalingInputProps, ScalingInputState> {
    public static defaultProps = {
        onChange: util.boundNoop,
        onFontSizeChange: util.boundNoop,
        maxLength: 9,
    };
    public state = {
        fixedWidthInPxIfExists: undefined,
    };
    private readonly _inputRef = React.createRef();
    public static getPhase(endWidthCh: number, value: string): ScalingInputPhase {
        if (value.length <= endWidthCh) {
            return ScalingInputPhase.FixedFontSize;
        }
        return ScalingInputPhase.ScalingFontSize;
    }
    public static getPhaseFromProps(props: ScalingInputProps): ScalingInputPhase {
        const { value, endWidthCh } = props;
        return ScalingInput.getPhase(endWidthCh, value);
    }
    public static calculateFontSize(
        endWidthCh: number,
        maxFontSizePx: number,
        phase: ScalingInputPhase,
        value: string,
    ): number {
        if (phase !== ScalingInputPhase.ScalingFontSize) {
            return maxFontSizePx;
        }
        const charactersOverMax = value.length - endWidthCh;
        const scalingFactor = (1 - percentageToReduceByPerCharacter) ** charactersOverMax;
        const fontSize = scalingFactor * maxFontSizePx;
        return fontSize;
    }
    public static calculateFontSizeFromProps(props: ScalingInputProps, phase: ScalingInputPhase): number {
        const { endWidthCh, value, maxFontSizePx } = props;
        return ScalingInput.calculateFontSize(endWidthCh, maxFontSizePx, phase, value);
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
                fixedWidthInPxIfExists: snapshot.inputWidthPx,
            });
        }
        // if we end from end to to anything else, un-fix the width
        if (prevPhase === ScalingInputPhase.ScalingFontSize && curPhase !== ScalingInputPhase.ScalingFontSize) {
            this.setState({
                fixedWidthInPxIfExists: undefined,
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
        const { value, endWidthCh } = this.props;
        if (_.isEmpty(value)) {
            return `${this.props.emptyInputWidthCh}ch`;
        }
        if (!_.isUndefined(this.state.fixedWidthInPxIfExists)) {
            return `${this.state.fixedWidthInPxIfExists}px`;
        }
        switch (phase) {
            case ScalingInputPhase.FixedFontSize:
                return `${value.length}ch`;
            case ScalingInputPhase.ScalingFontSize:
                return `${endWidthCh}ch`;
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
