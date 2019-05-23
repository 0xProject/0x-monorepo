import * as React from 'react';

import { ColorOption } from '../style/theme';
import { zIndex } from '../style/z_index';
import { SlideAnimationState } from '../types';

import { PositionAnimationSettings } from './animations/position_animation';
import { SlideAnimation } from './animations/slide_animation';

import { Container } from './ui/container';
import { Flex } from './ui/flex';
import { Icon } from './ui/icon';

export interface PanelProps {
    onClose?: () => void;
}

export const Panel: React.StatelessComponent<PanelProps> = ({ children, onClose }) => (
    <Container backgroundColor={ColorOption.white} width="100%" height="100%" zIndex={zIndex.panel} padding="20px">
        <Flex justify="flex-end">
            <Icon padding="5px" width={12} color={ColorOption.lightGrey} icon="closeX" onClick={onClose} />
        </Flex>
        <Container position="relative" top="-10px" height="100%">
            {children}
        </Container>
    </Container>
);

Panel.displayName = 'Panel';

export interface SlidingPanelProps extends PanelProps {
    animationState: SlideAnimationState;
    onAnimationEnd?: () => void;
}

export class SlidingPanel extends React.PureComponent<SlidingPanelProps> {
    public render(): React.ReactNode {
        if (this.props.animationState === 'none') {
            return null;
        }
        const { animationState, onAnimationEnd, ...rest } = this.props;
        const slideAmount = '100%';
        const slideUpSettings: PositionAnimationSettings = {
            duration: '0.3s',
            timingFunction: 'ease-in-out',
            top: {
                from: slideAmount,
                to: '0px',
            },
            position: 'absolute',
        };
        const slideDownSettings: PositionAnimationSettings = {
            duration: '0.3s',
            timingFunction: 'ease-out',
            top: {
                from: '0px',
                to: slideAmount,
            },
            position: 'absolute',
        };
        return (
            <SlideAnimation
                slideInSettings={slideUpSettings}
                slideOutSettings={slideDownSettings}
                animationState={animationState}
                height="100%"
                onAnimationEnd={onAnimationEnd}
            >
                <Panel {...rest} />
            </SlideAnimation>
        );
    }
}
