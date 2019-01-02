import * as React from 'react';

import { OptionallyScreenSpecific } from '../../style/media';
import { SlideAnimationState } from '../../types';

import { PositionAnimation, PositionAnimationSettings } from './position_animation';

export interface SlideAnimationProps {
    animationState: SlideAnimationState;
    slideInSettings: OptionallyScreenSpecific<PositionAnimationSettings>;
    slideOutSettings: OptionallyScreenSpecific<PositionAnimationSettings>;
    zIndex?: OptionallyScreenSpecific<number>;
    height?: string;
    onAnimationEnd?: () => void;
}

export const SlideAnimation: React.StatelessComponent<SlideAnimationProps> = props => {
    if (props.animationState === 'none') {
        return <React.Fragment>{props.children}</React.Fragment>;
    }
    const positionSettings = props.animationState === 'slidIn' ? props.slideInSettings : props.slideOutSettings;
    return (
        <PositionAnimation
            onAnimationEnd={props.onAnimationEnd}
            height={props.height}
            positionSettings={positionSettings}
            zIndex={props.zIndex}
        >
            {props.children}
        </PositionAnimation>
    );
};

SlideAnimation.displayName = 'SlideAnimation';
