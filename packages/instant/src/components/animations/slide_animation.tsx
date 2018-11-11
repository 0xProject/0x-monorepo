import * as React from 'react';

import { OptionallyScreenSpecific } from '../../style/media';

import { PositionAnimation, PositionAnimationSettings } from './position_animation';

export type SlideAnimationState = 'slidIn' | 'slidOut' | 'none';
export interface SlideAnimationProps {
    animationState: SlideAnimationState;
    slideInSettings: OptionallyScreenSpecific<PositionAnimationSettings>;
    slideOutSettings: OptionallyScreenSpecific<PositionAnimationSettings>;
    zIndex?: OptionallyScreenSpecific<number>;
    height?: string;
}

export const SlideAnimation: React.StatelessComponent<SlideAnimationProps> = props => {
    if (props.animationState === 'none') {
        return <React.Fragment>{props.children}</React.Fragment>;
    }
    const positionSettings = props.animationState === 'slidIn' ? props.slideInSettings : props.slideOutSettings;
    return (
        <PositionAnimation height={props.height} positionSettings={positionSettings} zIndex={props.zIndex}>
            {props.children}
        </PositionAnimation>
    );
};
