import * as React from 'react';
import { Keyframes } from 'styled-components';

import { css, keyframes, styled } from '../../style/theme';

import { PositionAnimation, PositionAnimationProps } from './position_animation';

export type SlideAnimationPhase = 'slideIn' | 'slideOut';
export interface SlideAnimationProps {
    phase: SlideAnimationPhase;
    slideIn: PositionAnimationProps;
    slideOut: PositionAnimationProps;
}

export const SlideAnimation: React.StatelessComponent<SlideAnimationProps> = props => {
    const propsToUse = props.phase === 'slideIn' ? props.slideIn : props.slideOut;
    return <PositionAnimation {...propsToUse}>{props.children}</PositionAnimation>;
};
