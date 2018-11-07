import { Keyframes } from 'styled-components';

import { media } from '../../style/media';
import { css, keyframes, styled } from '../../style/theme';

export interface TransitionInfo {
    from: string;
    to: string;
}

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
    position: string,
    top?: TransitionInfo,
    bottom?: TransitionInfo,
    left?: TransitionInfo,
    right?: TransitionInfo,
) => keyframes`
    from {
        position: ${position};
        ${generateTransitionInfoCss('from', top, bottom, left, right)}
    }

    to {
        position: ${position};
        ${generateTransitionInfoCss('to', top, bottom, left, right)}
    }
`;

export interface PositionAnimationSettings {
    top?: TransitionInfo;
    bottom?: TransitionInfo;
    left?: TransitionInfo;
    right?: TransitionInfo;
    timingFunction: string;
    duration?: string;
}

export interface PositionAnimationProps extends PositionAnimationSettings {
    position: string;
}

const generatePositionCss = (positionSettings: PositionAnimationProps) => {
    return css`
        animation-name: ${slideKeyframeGenerator(
            positionSettings.position,
            positionSettings.top,
            positionSettings.bottom,
            positionSettings.left,
            positionSettings.right,
        )};
        animation-duration: ${positionSettings.duration || '0.3s'};
        animation-timing-function: ${positionSettings.timingFunction};
        animation-delay: 0s;
        animation-iteration-count: 1;
        animation-fill-mode: forwards;
        position: ${positionSettings.position};
        height: 100%;
        width: 100%;
    `;
};

export const PositionAnimation =
    styled.div <
    PositionAnimationProps >
    `
    ${props => generatePositionCss(props)}
`;
PositionAnimation.defaultProps = {
    position: 'relative',
};

// TODO: bake into one, and use to handle just sending in PositionAnimationSettings
// TODO: handle medium too
// TODO: better than & position
export interface ConditionalPositionAnimationProps {
    default: PositionAnimationSettings & { position: string };
    sm?: PositionAnimationSettings & { position: string };
}

// TODO: use em and helpers
export const ConditionalPositionAnimation =
    styled.div <
    ConditionalPositionAnimationProps >
    `
    @media (min-width: 0px) and (max-width: 40em) {
        ${props => props.sm && generatePositionCss(props.sm)}
    }
    @media (min-width: 40.00001em) {
        ${props => generatePositionCss(props.default)}
    }
    `;
