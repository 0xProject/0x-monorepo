import * as React from 'react';

import { generateMediaWrapper, ScreenWidths } from '../../style/media';
import { styled } from '../../style/theme';
import { zIndex } from '../../style/z_index';

import { Container, ContainerProps } from './container';

interface OverlayProps {
    showMaxWidth?: ScreenWidths;
}
const Overlay =
    styled.div <
    OverlayProps >
    `
    && {
        top: 0;
        left: 0;
        z-index: ${zIndex.containerOverlay};
        width: 100%;
        height: 100%;
        display: ${props => (props.showMaxWidth ? 'none' : 'block')};
        position: absolute;
        background: black;
        opacity: 0.6;
        ${props => props.showMaxWidth && generateMediaWrapper(props.showMaxWidth)`display: block;`}
    }
`;

interface PlainOverlayContainerProps extends ContainerProps {
    showOverlay: boolean;
    showMaxWidth?: number;
}
export interface OverlayContainerProps extends PlainOverlayContainerProps {
    onOverlayClick?: () => void;
}
export const OverlayContainer: React.StatelessComponent<OverlayContainerProps> = props => {
    const { onOverlayClick, showMaxWidth, ...otherProps } = props;
    return (
        <React.Fragment>
            <Container {...otherProps} />
            {props.showOverlay && <Overlay onClick={onOverlayClick} showMaxWidth={showMaxWidth} />}
        </React.Fragment>
    );
};
