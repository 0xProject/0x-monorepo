import * as React from 'react';

import { zIndex } from '../../style/z_index';

import { Container, ContainerProps } from './container';
import { Overlay } from './overlay';

export interface OverlayContainerProps extends ContainerProps {
    showOverlay: boolean;
    showMaxWidth?: number;
    onOverlayClick?: () => void;
}
export const OverlayContainer: React.StatelessComponent<OverlayContainerProps> = props => {
    const { onOverlayClick, showMaxWidth, ...otherProps } = props;
    if (props.showOverlay) {
        return <Overlay onClick={onOverlayClick} zIndex={zIndex.containerOverlay} showMaxWidth={showMaxWidth} />;
    }
    return null;
};
