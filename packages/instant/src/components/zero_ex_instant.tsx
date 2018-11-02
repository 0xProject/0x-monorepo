import * as React from 'react';

import { ZeroExInstantContainer } from './zero_ex_instant_container';
import { ZeroExInstantProvider, ZeroExInstantProviderProps } from './zero_ex_instant_provider';

export type ZeroExInstantProps = ZeroExInstantProviderProps;

export const ZeroExInstant: React.StatelessComponent<ZeroExInstantProps> = props => {
    return (
        <ZeroExInstantProvider {...props}>
            <ZeroExInstantContainer />
        </ZeroExInstantProvider>
    );
};
