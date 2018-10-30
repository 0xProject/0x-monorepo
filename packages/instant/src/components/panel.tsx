import * as React from 'react';

import { ColorOption } from '../style/theme';
import { zIndex } from '../style/z_index';

import { Button, Container, Text } from './ui';

export interface PanelProps {
    onClose?: () => void;
}

export const Panel: React.StatelessComponent<PanelProps> = ({ children, onClose }) => (
    <Container
        backgroundColor={ColorOption.white}
        // position="absolute"
        // left="0px"
        // bottom="0px"
        // width="100%"
        // height="100%"
        height="100%"
        zIndex={zIndex.panel}
    >
        <Button onClick={onClose}>
            <Text fontColor={ColorOption.white}>Close </Text>
        </Button>
        {children}
    </Container>
);
