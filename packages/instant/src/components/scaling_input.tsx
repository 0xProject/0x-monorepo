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
    startFontSizePx: number;
    value?: string;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    fontColor?: ColorOption;
    placeholder?: string;
}
// Magic value obtained via trial-and-error
const scalingRateToMaintainSameWidth = 0.1;
export class ScalingInput extends React.Component<ScalingInputProps> {
    public static defaultProps = {
        onChange: util.boundNoop,
    };
    public render(): React.ReactNode {
        const { fontColor, onChange, placeholder, value } = this.props;
        const phase = this._getPhase();
        return (
            <Input
                fontColor={fontColor}
                onChange={onChange}
                value={value}
                placeholder={placeholder}
                fontSize={this._calculateFontSize(phase)}
                width={this._calculateWidth(phase)}
            />
        );
    }
    private readonly _calculateFontSize = (phase: ScalingInputPhase): string => {
        const { value, endWidthCh, startFontSizePx } = this.props;
        if (_.isUndefined(value) || phase !== ScalingInputPhase.End) {
            return `${startFontSizePx}px`;
        }
        const charactersOverMax = value.length - endWidthCh;
        const pixelsToReduceFontSizeBy = charactersOverMax * 2;
        const newFontSizePx = startFontSizePx - pixelsToReduceFontSizeBy;
        return `${newFontSizePx}px`;
    };
    private readonly _calculateWidth = (phase: ScalingInputPhase): string => {
        const { value, startWidthCh, endWidthCh } = this.props;
        if (_.isUndefined(value)) {
            return `${startWidthCh}ch`;
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
    private readonly _getPhase = (): ScalingInputPhase => {
        const { value, startWidthCh, endWidthCh } = this.props;
        if (_.isUndefined(value) || value.length <= this.props.startWidthCh) {
            return ScalingInputPhase.Start;
        }
        if (value.length > startWidthCh && value.length <= endWidthCh) {
            return ScalingInputPhase.Scaling;
        }
        return ScalingInputPhase.End;
    };
}
