import * as React from 'react';

import { ZeroExInstantContainer } from '../components/zero_ex_instant_container';

import { INJECTED_DIV_CLASS } from '../constants';

import { ZeroExInstantProvider, ZeroExInstantProviderProps } from './zero_ex_instant_provider';

export type ZeroExInstantProps = ZeroExInstantProviderProps;

export const ZeroExInstant: React.StatelessComponent<ZeroExInstantProps> = props => {
    return (
        <div className={INJECTED_DIV_CLASS}>
            <ZeroExInstantProvider {...props}>
                <ZeroExInstantContainer />
            </ZeroExInstantProvider>
        </div>
    );
};

ZeroExInstant.displayName = 'ZeroExInstant';
