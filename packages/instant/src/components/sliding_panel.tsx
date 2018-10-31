import * as React from 'react';

import { ColorOption } from '../style/theme';
import { zIndex } from '../style/z_index';

import { PositionAnimationSettings } from './animations/position_animation';
import { SlideAnimation, SlideAnimationState } from './animations/slide_animation';
import { Button, Container, Text } from './ui';

export interface PanelProps {
    onClose?: () => void;
}

export const Panel: React.StatelessComponent<PanelProps> = ({ children, onClose }) => (
    <Container backgroundColor={ColorOption.white} width="100%" height="100%" zIndex={zIndex.panel}>
        <Button onClick={onClose}>
            <Text fontColor={ColorOption.white}>Close </Text>
        </Button>
        {children}
    </Container>
);

export interface SlidingPanelProps extends PanelProps {
    animationState: SlideAnimationState;
}

export const SlidingPanel: React.StatelessComponent<SlidingPanelProps> = props => {
    if (props.animationState === 'none') {
        return null;
    }
    const { animationState, ...rest } = props;
    const slideAmount = '100%';
    const slideUpSettings: PositionAnimationSettings = {
        duration: '0.3s',
        timingFunction: 'ease-in-out',
        top: {
            from: slideAmount,
            to: '0px',
        },
    };
    const slideDownSettings: PositionAnimationSettings = {
        duration: '0.3s',
        timingFunction: 'ease-out',
        top: {
            from: '0px',
            to: slideAmount,
        },
    };
    return (
        <SlideAnimation
            position="absolute"
            slideInSettings={slideUpSettings}
            slideOutSettings={slideDownSettings}
            animationState={animationState}
        >
            <Panel {...rest} />
        </SlideAnimation>
    );
};
