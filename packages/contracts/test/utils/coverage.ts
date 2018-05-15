import { devConstants } from '@0xproject/dev-utils';
import { CoverageSubprovider, ZeroExArtifactAdapter } from '@0xproject/sol-cov';
import * as fs from 'fs';
import * as _ from 'lodash';

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
        const config = JSON.parse(fs.readFileSync('compiler.json').toString());
        const zeroExArtifactsAdapter = new ZeroExArtifactAdapter(config.artifactsDir, config.contractsDir);
        return new CoverageSubprovider(zeroExArtifactsAdapter, defaultFromAddress);
    },
};
