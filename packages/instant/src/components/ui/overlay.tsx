import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption, overlayBlack, styled } from '../../style/theme';

import { Container } from './container';
import { Flex } from './flex';
import { Icon } from './icon';

export interface OverlayProps {
    className?: string;
    onClose?: () => void;
    zIndex?: number;
}

const PlainOverlay: React.StatelessComponent<OverlayProps> = ({ children, className, onClose }) => (
    <Flex height="100vh" className={className}>
        <Container position="absolute" top="0px" right="0px">
            <Icon height={18} width={18} color={ColorOption.white} icon="closeX" onClick={onClose} padding="2em 2em" />
        </Container>
        <Container width="100%" height="100%">
            {children}
        </Container>
    </Flex>
);
export const Overlay = styled(PlainOverlay)`
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: ${props => props.zIndex}
    background-color: ${overlayBlack};
`;

Overlay.defaultProps = {
    zIndex: 100,
};

Overlay.displayName = 'Overlay';
