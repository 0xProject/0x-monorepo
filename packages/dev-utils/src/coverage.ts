import { CoverageSubprovider } from '@0xproject/sol-cov';
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
        const artifactsPath = './src/artifacts';
        const contractsPath = './src/contracts';
        const networkId = 50;
        const defaultFromAddress = '0x5409ed021d9299bf6814279a6a1411a7e866a631';
        return new CoverageSubprovider(artifactsPath, contractsPath, networkId, defaultFromAddress);
    },
};
