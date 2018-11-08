import * as React from 'react';

import { generateMediaWrapper, ScreenWidths } from '../../style/media';
import { styled } from '../../style/theme';

import { Container, ContainerProps } from './container';

// TODO: move z-index to constant
interface OverlayProps {
    showMaxWidthEm?: ScreenWidths;
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
    display: ${props => (props.showMaxWidthEm ? 'none' : 'block')};
    position: absolute;
    background: black;
    opacity: 0.6;
    ${props => props.showMaxWidthEm && generateMediaWrapper(props.showMaxWidthEm)`display: block;`}
`;

interface PlainOverlayContainerProps extends ContainerProps {
    showMaxWidthEm?: number;
}
// TODO: rename onClick to onOverlayClick
export interface OverlayContainerProps extends PlainOverlayContainerProps {
    onClick: () => void;
}
export const OverlayContainer: React.StatelessComponent<OverlayContainerProps> = props => {
    const { onClick, showMaxWidthEm, ...otherProps } = props;
    return (
        <React.Fragment>
            <Container {...otherProps} />
            <Overlay onClick={onClick} showMaxWidthEm={showMaxWidthEm} />
        </React.Fragment>
    );
};
