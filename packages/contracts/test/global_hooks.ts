import { getCoverageSubprovider } from '@0xproject/dev-utils';

after('generate coverage report', async () => {
    if (process.env.COVERAGE) {
        const coverageSubprovider = getCoverageSubprovider();
        await coverageSubprovider.writeCoverageAsync();
    }
});
