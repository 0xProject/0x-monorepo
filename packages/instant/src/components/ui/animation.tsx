import * as React from 'react';

import { keyframes, styled } from '../../style/theme';
import { cssRuleIfExists } from '../../style/util';

export type AnimationType = 'easeUpFromBottom';

export interface AnimationProps {
    type: AnimationType;
}

const PlainAnimation: React.StatelessComponent<AnimationProps> = props => <div {...props} />;

const appearFromBottomFrames = keyframes`
    from {
        position: relative;
        bottom: -100%;
        left: 0px;
        right: 0px;
    }

    to {
        position: relative;
        bottom: 0px;
        left: 0px;
        right: 0px;
    }
`;

const stylesForAnimation: { [K in AnimationType]: string } = {
    // Needed for safari
    easeUpFromBottom: `position: relative; height: 100%`,
};

const animations: { [K in AnimationType]: string } = {
    easeUpFromBottom: `${appearFromBottomFrames} 0.5s ease 0s 1 forwards`,
};

export const Animation = styled(PlainAnimation)`
    animation: ${props => animations[props.type]};
    ${props => stylesForAnimation[props.type]};
`;

Animation.displayName = 'Animation';
