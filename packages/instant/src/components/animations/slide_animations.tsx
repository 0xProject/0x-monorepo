import * as React from 'react';
import { Keyframes } from 'styled-components';

import { css, keyframes, styled } from '../../style/theme';

import { PositionAnimation, PositionAnimationSettings } from './position_animation';

export type SlideAnimationPhase = 'slideIn' | 'slideOut';
export interface SlideAnimationProps {
    position: string;
    phase: SlideAnimationPhase;
    slideIn: PositionAnimationSettings;
    slideOut: PositionAnimationSettings;
}

export const SlideAnimation: React.StatelessComponent<SlideAnimationProps> = props => {
    const propsToUse = props.phase === 'slideIn' ? props.slideIn : props.slideOut;
    return (
        <PositionAnimation position={props.position} {...propsToUse}>
            {props.children}
        </PositionAnimation>
    );
};
