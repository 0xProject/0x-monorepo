import * as React from 'react';

import { ScreenWidths } from '../style/media';

import { Container, ContainerProps } from './ui/container';
import { OverlayContainer } from './ui/overlay_container';

export interface ConditionalOverlayContainerProps extends ContainerProps {
    showOverlay: boolean;
    onOverlayClick: () => void;
    showMaxWidth?: ScreenWidths;
}

export const ConditionalOverlayContainer: React.StatelessComponent<ConditionalOverlayContainerProps> = props => {
    const { showOverlay, onOverlayClick, ...containerProps } = props;
    if (showOverlay) {
        return (
            <OverlayContainer {...containerProps} onOverlayClick={onOverlayClick} showMaxWidth={props.showMaxWidth} />
        );
    } else {
        return <Container {...containerProps} />;
    }
};
