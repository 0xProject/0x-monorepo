import { Keyframes } from 'styled-components';

import { media, OptionallyScreenSpecific, ScreenSpecification } from '../../style/media';
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

const generatePositionAnimationCss = (position: string, positionSettings: PositionAnimationSettings) => {
    return css`
        animation-name: ${slideKeyframeGenerator(
            position,
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
        position: ${position};
        height: 100%;
        width: 100%;
    `;
};

export interface PositionAnimationProps {
    position: string;
    positionSettings: OptionallyScreenSpecific<PositionAnimationSettings>;
}

export const PositionAnimation =
    styled.div <
    PositionAnimationProps >
    `
    ${props =>
        generatePositionAnimationCss(
            props.position,
            'default' in props.positionSettings ? props.positionSettings.default : props.positionSettings,
        )}
    ${props =>
        'default' in props.positionSettings &&
        props.positionSettings.sm &&
        smallMediaCss(generatePositionAnimationCss(props.position, props.positionSettings.sm))}
`;

PositionAnimation.defaultProps = {
    position: 'relative',
};

// TODO: bake into one, and use to handle just sending in PositionAnimationSettings
// TODO: handle medium too
// TODO: better than & position
// TODO: Clean up position setting, maybe just use in setting
export interface ConditionalPositionAnimationProps {
    default: PositionAnimationSettings & { position: string };
    sm?: PositionAnimationSettings & { position: string };
}

// TODO: use helper instead
const smallMediaCss = (generated: any) => {
    return css`
        @media (max-width: 40em) {
            ${generated};
        }
    `;
};

export const ConditionalPositionAnimation =
    styled.div <
    ConditionalPositionAnimationProps >
    `
    ${props => generatePositionAnimationCss(props.default.position, props.default)}
    ${props => props.sm && smallMediaCss(generatePositionAnimationCss(props.sm.position, props.sm))}
    z-index: 9999;
    `;
