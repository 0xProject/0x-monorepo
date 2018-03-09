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
        return new CoverageSubprovider(artifactsPath, contractsPath, networkId);
    },
};
