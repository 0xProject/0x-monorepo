import * as React from 'react';

import { ColorOption, overlayBlack, styled } from '../style/theme';

import { Container } from './ui/container';
import { Flex } from './ui/flex';
import { Icon } from './ui/icon';
import { Overlay } from './ui/overlay';
import { ZeroExInstantContainer } from './zero_ex_instant_container';
import { ZeroExInstantProvider, ZeroExInstantProviderProps } from './zero_ex_instant_provider';

export interface ZeroExInstantOverlayProps extends ZeroExInstantProviderProps {
    onClose?: () => void;
    zIndex?: number;
}

export const ZeroExInstantOverlay: React.StatelessComponent<ZeroExInstantOverlayProps> = props => {
    const { onClose, zIndex, ...rest } = props;
    return (
        <ZeroExInstantProvider {...rest}>
            <Overlay zIndex={zIndex}>
                <Flex height="100vh">
                    <Container position="absolute" top="0px" right="0px">
                        <Icon
                            height={18}
                            width={18}
                            color={ColorOption.white}
                            icon="closeX"
                            onClick={onClose}
                            padding="2em 2em"
                        />
                    </Container>
                    <ZeroExInstantContainer />
                </Flex>
            </Overlay>
        </ZeroExInstantProvider>
    );
};
