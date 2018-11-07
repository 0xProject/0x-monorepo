import * as React from 'react';

import { styled } from '../../style/theme';

import { Container, ContainerProps } from './container';

// TODO: move z-index to constant
const PlainOverlayContainer = styled(Container)`
    :after {
        content: '';
        top: 0;
        left: 0;
        z-index: 10;
        width: 100%;
        height: 100%;
        display: block;
        position: absolute;
        background: black;
        opacity: 0.6;
    }
`;
export interface OverlayContainerProps extends ContainerProps {
    onClick: () => void;
}
export const OverlayContainer: React.StatelessComponent<OverlayContainerProps> = props => {
    const { onClick, ...otherProps } = props;
    return <PlainOverlayContainer onClick={onClick} {...otherProps} />;
};
