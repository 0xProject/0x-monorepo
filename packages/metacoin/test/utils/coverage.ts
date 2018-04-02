import { devConstants } from '@0xproject/dev-utils';
import { CoverageSubprovider } from '@0xproject/sol-cov';
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
        return new CoverageSubprovider(config.artifactsDir, config.contractsDir, config.networkId, defaultFromAddress);
    },
};
