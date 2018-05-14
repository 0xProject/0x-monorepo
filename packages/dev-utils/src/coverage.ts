import { CoverageSubprovider, ZeroExArtifactAdapter } from '@0xproject/sol-cov';
import * as _ from 'lodash';

import { constants } from './constants';

let coverageSubprovider: CoverageSubprovider;

export const coverage = {
    getCoverageSubproviderSingleton(): CoverageSubprovider {
        if (_.isUndefined(coverageSubprovider)) {
            coverageSubprovider = coverage._getCoverageSubprovider();
        }
        return coverageSubprovider;
    },
    _getCoverageSubprovider(): CoverageSubprovider {
        const artifactsPath = '../migrations/artifacts/1.0.0';
        const contractsPath = 'src/contracts';
        const defaultFromAddress = constants.TESTRPC_FIRST_ADDRESS;
        const zeroExArtifactsAdapter = new ZeroExArtifactAdapter(artifactsPath, contractsPath);
        return new CoverageSubprovider(zeroExArtifactsAdapter, defaultFromAddress);
    },
};
