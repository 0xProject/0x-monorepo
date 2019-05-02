import * as React from 'react';

import { ZeroExInstantContainer } from '../components/zero_ex_instant_container';
import { MAIN_CONTAINER_DIV_CLASS, OVERLAY_CLOSE_BUTTON_DIV_CLASS, OVERLAY_DIV_CLASS } from '../constants';
import { ColorOption } from '../style/theme';

import { Container } from './ui/container';
import { Flex } from './ui/flex';
import { Icon } from './ui/icon';
import { Overlay } from './ui/overlay';
import { ZeroExInstantProvider, ZeroExInstantProviderProps } from './zero_ex_instant_provider';

export interface ZeroExInstantOverlayProps extends ZeroExInstantProviderProps {
    onClose?: () => void;
    zIndex?: number;
}

export const ZeroExInstantOverlay: React.StatelessComponent<ZeroExInstantOverlayProps> = props => {
    const { onClose, zIndex, ...rest } = props;
    return (
        <ZeroExInstantProvider {...rest}>
            <Overlay zIndex={zIndex} className={OVERLAY_DIV_CLASS}>
                <Flex height="100vh" overflow="scroll">
                    <Container
                        className={OVERLAY_CLOSE_BUTTON_DIV_CLASS}
                        position="absolute"
                        top="0px"
                        right="0px"
                        display={{ default: 'initial', sm: 'none' }}
                    >
                        <Icon
                            height={18}
                            width={18}
                            color={ColorOption.white}
                            icon="closeX"
                            onClick={onClose}
                            padding="2em 2em"
                        />
                    </Container>
                    <Container
                        width={{ default: 'auto', sm: '100%' }}
                        height={{ default: 'auto', sm: '100%' }}
                        className={MAIN_CONTAINER_DIV_CLASS}
                    >
                        <ZeroExInstantContainer />
                    </Container>
                </Flex>
            </Overlay>
        </ZeroExInstantProvider>
    );
};

ZeroExInstantOverlay.displayName = 'ZeroExInstantOverlay';
