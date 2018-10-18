import * as React from 'react';

import { keyframes, styled } from '../../style/theme';

const slideKeyframeGenerator = (fromY: string, toY: string) => keyframes`
    from {
        position: relative;
        top: ${fromY};
    }

    to {
        position: relative;
        top: ${toY};
    }
`;

export interface SlideAnimationProps {
    keyframes: string;
    animationType: string;
    animationDirection?: string;
}

export const SlideAnimation =
    styled.div <
    SlideAnimationProps >
    `
    animation-name: ${props => props.keyframes};
    animation-duration: 0.3s;
    animation-timing-function: ${props => props.animationType};
    animation-delay: 0s;
    animation-iteration-count: 1;
    animation-fill-mode: ${props => props.animationDirection || 'none'};
    position: relative;
`;

export interface SlideAnimationComponentProps {
    downY: string;
}

export const SlideUpAnimation: React.StatelessComponent<SlideAnimationComponentProps> = props => (
    <SlideAnimation animationType="ease-in" keyframes={slideKeyframeGenerator(props.downY, '0px')}>
        {props.children}
    </SlideAnimation>
);

export const SlideDownAnimation: React.StatelessComponent<SlideAnimationComponentProps> = props => (
    <SlideAnimation
        animationDirection="forwards"
        animationType="cubic-bezier(0.25, 0.1, 0.25, 1)"
        keyframes={slideKeyframeGenerator('0px', props.downY)}
    >
        {props.children}
    </SlideAnimation>
);
