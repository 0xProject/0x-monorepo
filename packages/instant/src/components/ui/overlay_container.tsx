import * as React from 'react';

import { media, generateMediaWrapper } from '../../style/media';
import { styled } from '../../style/theme';

import { Container, ContainerProps } from './container';

// TODO: move z-index to constant

// Todo: hide when Sm, Md, or Lg, or keep like this use generateMediaWrapper
interface PlainOverlayContainerProps extends ContainerProps {
    showMaxWidthEm?: number;
}
const PlainOverlayContainer =
    styled(Container) <
    PlainOverlayContainerProps >
    `
    :after {
        content: '';
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
    }
`;
export interface OverlayContainerProps extends PlainOverlayContainerProps {
    onClick: () => void;
}
export const OverlayContainer: React.StatelessComponent<OverlayContainerProps> = props => {
    const { onClick, ...otherProps } = props;
    return <PlainOverlayContainer showMaxWidthEm={props.showMaxWidthEm} onClick={onClick} {...otherProps} />;
};
