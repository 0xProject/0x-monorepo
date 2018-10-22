import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { ColorOption } from '../style/theme';
import { util } from '../util/util';

import { Container, Input } from './ui';

export enum ScalingInputPhase {
    Start,
    Scaling,
    End,
}

export interface ScalingInputProps {
    startWidthCh: number;
    endWidthCh: number;
    maxFontSizePx: number;
    value?: string;
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
const percentageToReduceByPerCharacter = 0.15;
export class ScalingInput extends React.Component<ScalingInputProps, ScalingInputState> {
    public static defaultProps = {
        onChange: util.boundNoop,
        onFontSizeChange: util.boundNoop,
        maxLength: 10,
    };
    public state = {
        fixedWidthInPxIfExists: undefined,
    };
    private _inputRef = React.createRef();
    public static getPhase(startWidthCh: number, endWidthCh: number, value?: string): ScalingInputPhase {
        if (_.isUndefined(value) || value.length <= startWidthCh) {
            return ScalingInputPhase.Start;
        }
        if (value.length > startWidthCh && value.length <= endWidthCh) {
            return ScalingInputPhase.Scaling;
        }
        return ScalingInputPhase.End;
    }
    public static getPhaseFromProps(props: ScalingInputProps): ScalingInputPhase {
        const { value, startWidthCh, endWidthCh } = props;
        return ScalingInput.getPhase(startWidthCh, endWidthCh, value);
    }
    public static calculateFontSize(props: ScalingInputProps): number {
        const { startWidthCh, endWidthCh, value, maxFontSizePx } = props;
        const phase = ScalingInput.getPhase(startWidthCh, endWidthCh, value);
        if (_.isUndefined(value) || phase !== ScalingInputPhase.End) {
            return maxFontSizePx;
        }
        const charactersOverMax = value.length - endWidthCh;
        const scalingFactor = (1 - percentageToReduceByPerCharacter) ** charactersOverMax;
        const fontSize = scalingFactor * maxFontSizePx;
        return fontSize;
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
        const prevFontSize = ScalingInput.calculateFontSize(prevProps);
        const curFontSize = ScalingInput.calculateFontSize(this.props);
        // if we went from anything else to end, fix to the current width as it shouldn't change as we grow
        if (prevPhase !== ScalingInputPhase.End && curPhase === ScalingInputPhase.End) {
            this.setState({
                fixedWidthInPxIfExists: snapshot.inputWidthPx,
            });
        }
        // if we end from end to to anything else, un-fix the width
        if (prevPhase === ScalingInputPhase.End && curPhase !== ScalingInputPhase.End) {
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
                fontSize={`${ScalingInput.calculateFontSize(this.props)}px`}
                width={this._calculateWidth()}
                maxLength={maxLength}
            />
        );
    }
    private readonly _calculateWidth = (): string => {
        const phase = ScalingInput.getPhaseFromProps(this.props);
        const { value, startWidthCh, endWidthCh } = this.props;
        if (_.isUndefined(value)) {
            return `${startWidthCh}ch`;
        }
        if (!_.isUndefined(this.state.fixedWidthInPxIfExists)) {
            return `${this.state.fixedWidthInPxIfExists}px`;
        }
        switch (phase) {
            case ScalingInputPhase.Start:
                return `${startWidthCh}ch`;
            case ScalingInputPhase.Scaling:
                return `${value.length}ch`;
            case ScalingInputPhase.End:
                return `${endWidthCh}ch`;
            default:
                return `${startWidthCh}ch`;
        }
    };
    private readonly _getInputWidthInPx = (): number => {
        const ref = this._inputRef.current;
        if (!ref) {
            return 0;
        }
        return (ref as any).getBoundingClientRect().width;
    };
}
