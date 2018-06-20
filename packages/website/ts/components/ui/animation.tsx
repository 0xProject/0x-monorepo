import * as React from 'react';
import { keyframes, styled } from 'ts/style/theme';

export type AnimationType = 'easeUpFromBottom';

export interface AnimationProps {
    type: AnimationType;
}

const PlainAnimation: React.StatelessComponent<AnimationProps> = props => <div {...props} />;

const appearFromBottomFrames = keyframes`
    from {
        position: absolute;
        bottom: -500px;
    }

    to {
        position: absolute;
        bottom: 0px;
    }
`;

const animations: { [K in AnimationType]: string } = {
    easeUpFromBottom: `${appearFromBottomFrames} 1s ease 0s 1 forwards`,
};

export const Animation = styled(PlainAnimation)`
    animation: ${props => animations[props.type]};
`;

Animation.displayName = 'Animation';
