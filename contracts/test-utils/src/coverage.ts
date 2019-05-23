import { devConstants } from '@0x/dev-utils';
import { CoverageSubprovider, SolCompilerArtifactAdapter } from '@0x/sol-coverage';
let coverageSubprovider: CoverageSubprovider;

export const coverage = {
    getCoverageSubproviderSingleton(): CoverageSubprovider {
        if (coverageSubprovider === undefined) {
            coverageSubprovider = coverage._getCoverageSubprovider();
        }
        return coverageSubprovider;
    },
    _getCoverageSubprovider(): CoverageSubprovider {
        const defaultFromAddress = devConstants.TESTRPC_FIRST_ADDRESS;
        const solCompilerArtifactAdapter = new SolCompilerArtifactAdapter();
        const coverageSubproviderConfig = {
            isVerbose: true,
            ignoreFilesGlobs: ['**/node_modules/**', '**/interfaces/**', '**/test/**'],
        };
        const subprovider = new CoverageSubprovider(
            solCompilerArtifactAdapter,
            defaultFromAddress,
            coverageSubproviderConfig,
        );
        return subprovider;
    },
};
