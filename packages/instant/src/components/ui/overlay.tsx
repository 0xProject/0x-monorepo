import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption, overlayBlack, styled } from '../../style/theme';
import { util } from '../../util/util';

import { Button, ButtonHoverStyle } from './button';
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
            <Button
                backgroundColor={ColorOption.clear}
                borderColor={ColorOption.clear}
                padding="2em 2em"
                onClick={onClose}
                hoverStyle={ButtonHoverStyle.Opacity}
            >
                <Icon height={18} width={18} color="white" icon="closeX" />
            </Button>
        </Container>
        <div>{children}</div>
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
    onClose: util.boundNoop,
    zIndex: 100,
};

Overlay.displayName = 'Overlay';
