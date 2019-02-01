import { devConstants } from '@0x/dev-utils';
import { ProfilerSubprovider, SolCompilerArtifactAdapter } from '@0x/sol-cov';
import * as _ from 'lodash';

import { config } from './config';

let profilerSubprovider: ProfilerSubprovider;

export const profiler = {
    start(): void {
        profiler.getProfilerSubproviderSingleton().start();
    },
    stop(): void {
        profiler.getProfilerSubproviderSingleton().stop();
    },
    getProfilerSubproviderSingleton(): ProfilerSubprovider {
        if (_.isUndefined(profilerSubprovider)) {
            profilerSubprovider = profiler._getProfilerSubprovider();
        }
        return profilerSubprovider;
    },
    _getProfilerSubprovider(): ProfilerSubprovider {
        const defaultFromAddress = devConstants.TESTRPC_FIRST_ADDRESS;
        const zeroExArtifactsAdapter = new SolCompilerArtifactAdapter(config.artifactsDir, config.contractsDir);
        return new ProfilerSubprovider(zeroExArtifactsAdapter, defaultFromAddress);
    },
};
