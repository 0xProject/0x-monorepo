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
        const artifactsPath = './src/artifacts';
        const contractsPath = './src/contracts';
        const networkId = 50;
        const defaultFromAddress = constants.TESTRPC_FIRST_ADDRESS;
        return new CoverageSubprovider(artifactsPath, contractsPath, networkId, defaultFromAddress);
    },
};
