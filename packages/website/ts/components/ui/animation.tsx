import * as React from 'react';
import { keyframes, styled } from 'ts/style/theme';

export type AnimationType = 'easeUpFromBottom';

export interface AnimationProps {
    type: AnimationType;
}

const PlainAnimation: React.StatelessComponent<AnimationProps> = props => <div {...props} />;

const appearFromBottomFrames = keyframes`
    from {
        position: fixed;
        bottom: -500px;
        left: 0px;
        right: 0px;
    }

    to {
        position: fixed;
        bottom: 0px;
        left: 0px;
        right: 0px;
    }
`;

const animations: { [K in AnimationType]: string } = {
    easeUpFromBottom: `${appearFromBottomFrames} 1s ease 0s 1 forwards`,
};

export const Animation = styled(PlainAnimation)`
    animation: ${props => animations[props.type]};
`;

Animation.displayName = 'Animation';
