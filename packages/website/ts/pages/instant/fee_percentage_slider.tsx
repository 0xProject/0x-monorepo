import Slider from 'rc-slider';
import * as React from 'react';
import styled from 'styled-components';
import 'ts/pages/instant/rc-slider.css';

import { colors } from 'ts/style/colors';

const SliderWithTooltip = (Slider as any).createSliderWithTooltip(Slider);
// tslint:disable-next-line:no-unused-expression

export interface FeePercentageSliderProps {
    value: number;
    isDisabled?: boolean;
    onChange: (value: number) => void;
}

export class FeePercentageSlider extends React.Component<FeePercentageSliderProps> {
    public render(): React.ReactNode {
        return (
            <StyledSlider
                min={0}
                max={0.05}
                step={0.0025}
                value={this.props.value}
                disabled={this.props.isDisabled}
                onChange={this.props.onChange}
                tipFormatter={this._feePercentageSliderFormatter}
                tipProps={{ placement: 'bottom', overlayStyle: { backgroundColor: '#fff', borderRadius: '4px' } }}
                trackStyle={{
                    backgroundColor: colors.brandLight,
                }}
                railStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
        return <Text>{`${(value * 100).toFixed(2)}%`}</Text>;
    };
}

const StyledSlider = styled(SliderWithTooltip)`
    .rc-slider-tooltip__inner {
        box-shadow: none !important;
        background-color: ${colors.white} !important;
        border-radius: 4px !important;
        padding: 3px 12px !important;
        height: auto !important;
        position: relative;
        top: 7px;
        &:after {
            border: solid transparent;
            content: ' ';
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

const Text = styled.span`
    color: #000000;
    font-size: 12px;
    line-height: 18px;
`;
