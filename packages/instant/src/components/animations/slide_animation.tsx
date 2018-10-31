import * as React from 'react';

import { PositionAnimation, PositionAnimationSettings } from './position_animation';

export type SlideAnimationState = 'slidIn' | 'slidOut' | 'none';
export interface SlideAnimationProps {
    position: string;
    animationState: SlideAnimationState;
    slideInSettings: PositionAnimationSettings;
    slideOutSettings: PositionAnimationSettings;
}

export const SlideAnimation: React.StatelessComponent<SlideAnimationProps> = props => {
    if (props.animationState === 'none') {
        return <React.Fragment>{props.children}</React.Fragment>;
    }
    const propsToUse = props.animationState === 'slidIn' ? props.slideInSettings : props.slideOutSettings;
    return (
        <PositionAnimation position={props.position} {...propsToUse}>
            {props.children}
        </PositionAnimation>
    );
};
