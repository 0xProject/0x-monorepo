import { devConstants } from '@0x/dev-utils';
import { CoverageSubprovider, SolCompilerArtifactAdapter } from '@0x/sol-cov';
import * as _ from 'lodash';

import { config } from './config';

let coverageSubprovider: CoverageSubprovider;

export const coverage = {
    getCoverageSubproviderSingleton(): CoverageSubprovider {
        if (_.isUndefined(coverageSubprovider)) {
            coverageSubprovider = coverage._getCoverageSubprovider();
        }
        return coverageSubprovider;
    },
    _getCoverageSubprovider(): CoverageSubprovider {
        const defaultFromAddress = devConstants.TESTRPC_FIRST_ADDRESS;
        const zeroExArtifactsAdapter = new SolCompilerArtifactAdapter(config.artifactsDir, config.contractsDir);
        return new CoverageSubprovider(zeroExArtifactsAdapter, defaultFromAddress);
    },
};
