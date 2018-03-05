import { CoverageSubprovider } from '@0xproject/sol-cov';
import * as _ from 'lodash';

let coverageSubprovider: CoverageSubprovider;

export function getCoverageSubprovider(): CoverageSubprovider {
    if (_.isUndefined(coverageSubprovider)) {
        const artifactsPath = './src/artifacts';
        const contractsPath = './src/contracts';
        const networkId = 50;
        coverageSubprovider = new CoverageSubprovider(artifactsPath, contractsPath, networkId);
    }
    return coverageSubprovider;
}
