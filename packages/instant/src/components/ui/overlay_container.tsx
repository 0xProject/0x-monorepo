import * as React from 'react';

import { generateMediaWrapper, ScreenWidths } from '../../style/media';
import { styled } from '../../style/theme';

import { Container, ContainerProps } from './container';

// TODO: move z-index to constant
interface OverlayProps {
    showMaxWidth?: ScreenWidths;
}
const Overlay =
    styled.div <
    OverlayProps >
    `
    top: 0;
    left: 0;
    z-index: 10;
    width: 100%;
    height: 100%;
    display: ${props => (props.showMaxWidth ? 'none' : 'block')};
    position: absolute;
    background: black;
    opacity: 0.6;
    ${props => props.showMaxWidth && generateMediaWrapper(props.showMaxWidth)`display: block;`}
`;

interface PlainOverlayContainerProps extends ContainerProps {
    showMaxWidthEm?: number;
}
export interface OverlayContainerProps extends PlainOverlayContainerProps {
    onOverlayClick: () => void;
}
export const OverlayContainer: React.StatelessComponent<OverlayContainerProps> = props => {
    const { onOverlayClick, showMaxWidthEm, ...otherProps } = props;
    return (
        <React.Fragment>
            <Container {...otherProps} />
            <Overlay onClick={onOverlayClick} showMaxWidth={showMaxWidthEm} />
        </React.Fragment>
    );
};
