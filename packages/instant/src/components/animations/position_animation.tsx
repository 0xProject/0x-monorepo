import * as React from 'react';
import { Keyframes } from 'styled-components';

import { css, keyframes, styled } from '../../style/theme';

const generateTransitionInfoCss = (
    key: keyof TransitionInfo,
    top?: TransitionInfo,
    bottom?: TransitionInfo,
    left?: TransitionInfo,
    right?: TransitionInfo,
): string => {
    const topStringIfExists = top ? `top: ${top[key]};` : '';
    const bottomStringIfExists = bottom ? `bottom: ${bottom[key]};` : '';
    const leftStringIfExists = left ? `left: ${left[key]};` : '';
    const rightStringIfExists = right ? `right: ${right[key]};` : '';
    return `
    ${topStringIfExists}
    ${bottomStringIfExists}
    ${leftStringIfExists}
    ${rightStringIfExists}
    `;
};

const slideKeyframeGenerator = (
    top?: TransitionInfo,
    bottom?: TransitionInfo,
    left?: TransitionInfo,
    right?: TransitionInfo,
) => keyframes`
    from {
        position: relative;
        ${generateTransitionInfoCss('from', top, bottom, left, right)}
    }

    to {
        position: relative;
        ${generateTransitionInfoCss('to', top, bottom, left, right)}
    }
`;

export interface TransitionInfo {
    from: string;
    to: string;
}

export interface PositionAnimationProps {
    top?: TransitionInfo;
    bottom?: TransitionInfo;
    left?: TransitionInfo;
    right?: TransitionInfo;
    timingFunction: string;
    direction?: string;
}

export const PositionAnimation =
    styled.div <
    PositionAnimationProps >
    `
    animation-name: ${props =>
        css`
            ${slideKeyframeGenerator(props.top, props.bottom, props.left, props.right)};
        `};
    animation-duration: 0.3s;
    animation-timing-function: ${props => props.timingFunction};
    animation-delay: 0s;
    animation-iteration-count: 1;
    animation-fill-mode: ${props => props.direction || 'none'};
    position: relative;
`;
