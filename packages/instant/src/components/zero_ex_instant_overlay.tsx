import * as React from 'react';

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
            <Overlay onClose={onClose} zIndex={zIndex}>
                <ZeroExInstantContainer />
            </Overlay>
        </ZeroExInstantProvider>
    );
};
