import { CoverageSubprovider } from '@0xproject/sol-cov';
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
        return new CoverageSubprovider(artifactsPath, contractsPath, defaultFromAddress);
    },
};
