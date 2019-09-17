import { InterpolationValue } from 'styled-components';

import { media, OptionallyScreenSpecific, stylesForMedia } from '../../style/media';
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
    position?: string;
}

const generatePositionAnimationCss = (positionSettings: PositionAnimationSettings) => {
    return css`
        animation-name: ${slideKeyframeGenerator(
            positionSettings.position || 'relative',
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
        position: ${positionSettings.position || 'relative'};
        width: 100%;
    `;
};

export interface PositionAnimationProps {
    positionSettings: OptionallyScreenSpecific<PositionAnimationSettings>;
    zIndex?: OptionallyScreenSpecific<number>;
    height?: string;
}

const defaultAnimation = (positionSettings: OptionallyScreenSpecific<PositionAnimationSettings>) => {
    const bestDefault = 'default' in positionSettings ? positionSettings.default : positionSettings;
    return generatePositionAnimationCss(bestDefault);
};
const animationForSize = (
    positionSettings: OptionallyScreenSpecific<PositionAnimationSettings>,
    sizeKey: 'sm' | 'md' | 'lg',
    mediaFn: (...args: any[]) => InterpolationValue,
) => {
    // checking default makes sure we have a PositionAnimationSettings object
    // and then we check to see if we have a setting for the specific `sizeKey`
    const animationSettingsForSize = 'default' in positionSettings && positionSettings[sizeKey];
    return animationSettingsForSize && mediaFn`${generatePositionAnimationCss(animationSettingsForSize)}`;
};

export const PositionAnimation = styled.div<PositionAnimationProps>`
    && {
        ${props => props.zIndex && stylesForMedia<number>('z-index', props.zIndex)}
        ${props => defaultAnimation(props.positionSettings)}
        ${props => animationForSize(props.positionSettings, 'sm', media.small)}
        ${props => animationForSize(props.positionSettings, 'md', media.medium)}
        ${props => animationForSize(props.positionSettings, 'lg', media.large)}
        ${props => (props.height ? `height: ${props.height};` : '')}
    }
`;
