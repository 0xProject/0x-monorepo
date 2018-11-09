import * as React from 'react';

import { ColorOption } from '../style/theme';
import { zIndex } from '../style/z_index';

import { PositionAnimationSettings } from './animations/position_animation';
import { SlideAnimation, SlideAnimationState } from './animations/slide_animation';

import { Container } from './ui/container';
import { Flex } from './ui/flex';
import { Icon } from './ui/icon';
import { Text } from './ui/text';

export interface PanelProps {
    title?: string;
    onClose?: () => void;
}

export const Panel: React.StatelessComponent<PanelProps> = ({ title, children, onClose }) => (
    <Container backgroundColor={ColorOption.white} width="100%" height="100%" zIndex={zIndex.panel} padding="20px">
        <Flex justify="space-between">
            {title && (
                <Container marginTop="3px">
                    <Text fontColor={ColorOption.darkGrey} fontSize="18px" fontWeight="600" lineHeight="22px">
                        {title}
                    </Text>
                </Container>
            )}
            <Container position="relative" bottom="7px">
                <Icon width={12} color={ColorOption.lightGrey} icon="closeX" onClick={onClose} />
            </Container>
        </Flex>
        <Container marginTop="10px" height="100%">
            {children}
        </Container>
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
        >
            <Panel {...rest} />
        </SlideAnimation>
    );
};
