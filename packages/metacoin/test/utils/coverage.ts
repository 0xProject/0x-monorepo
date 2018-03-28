import { CoverageSubprovider } from '@0xproject/sol-cov';
import * as _ from 'lodash';

import { devConstants } from '@0xproject/dev-utils';

let coverageSubprovider: CoverageSubprovider;

export const coverage = {
    getCoverageSubproviderSingleton(): CoverageSubprovider {
        if (_.isUndefined(coverageSubprovider)) {
            coverageSubprovider = coverage._getCoverageSubprovider();
        }
        return coverageSubprovider;
    },
    _getCoverageSubprovider(): CoverageSubprovider {
        const artifactsPath = 'artifacts';
        const contractsPath = 'contracts';
        const networkId = 50;
        const defaultFromAddress = devConstants.TESTRPC_FIRST_ADDRESS;
        return new CoverageSubprovider(artifactsPath, contractsPath, networkId, defaultFromAddress);
    },
};
