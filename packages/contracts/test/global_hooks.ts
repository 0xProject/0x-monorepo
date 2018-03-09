import { coverage } from '@0xproject/dev-utils';

after('generate coverage report', async () => {
    if (process.env.SOLIDITY_COVERAGE) {
        const coverageSubprovider = coverage.getCoverageSubproviderSingleton();
        await coverageSubprovider.writeCoverageAsync();
    }
});
