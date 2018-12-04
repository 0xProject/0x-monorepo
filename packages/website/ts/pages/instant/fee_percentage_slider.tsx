import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import * as React from 'react';

import { Text } from 'ts/components/ui/text';
import { colors } from 'ts/style/colors';
import { injectGlobal } from 'ts/style/theme';

const SliderWithTooltip = (Slider as any).createSliderWithTooltip(Slider);
// tslint:disable-next-line:no-unused-expression
injectGlobal`
    .rc-slider-tooltip-inner {
        box-shadow: none !important;
        background-color: ${colors.white} !important;
        border-radius: 4px !important;
        padding: 3px 12px !important;
        height: auto !important;
        position: relative;
        top: 7px;
        &: after {
            border: solid transparent;
            content: " ";
            height: 0;
            width: 0;
            position: absolute;
            pointer-events: none;
            border-width: 6px;
            bottom: 100%;
            left: 100%;
            border-bottom-color: ${colors.white};
            margin-left: -60%;
        }
    }
`;

export interface FeePercentageSliderProps {
    value: number;
    onChange: (value: number) => void;
}

export class FeePercentageSlider extends React.Component<FeePercentageSliderProps> {
    public render(): React.ReactNode {
        return (
            <SliderWithTooltip
                min={0}
                max={0.05}
                step={0.0025}
                value={this.props.value}
                onChange={this.props.onChange}
                tipFormatter={this._feePercentageSliderFormatter}
                tipProps={{ placement: 'bottom' }}
                trackStyle={{
                    backgroundColor: '#b4b4b4',
                }}
                railStyle={{
                    backgroundColor: '#696969',
                }}
                handleStyle={{
                    border: 'none',
                    boxShadow: 'none',
                }}
                activeDotStyle={{
                    boxShadow: 'none',
                    border: 'none',
                }}
            />
        );
    }
    private readonly _feePercentageSliderFormatter = (value: number): React.ReactNode => {
        return <Text fontColor={colors.black} fontSize="14px" fontWeight={700}>{`${(value * 100).toFixed(2)}%`}</Text>;
    };
}
