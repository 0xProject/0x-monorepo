import { coverage, env, EnvVars } from '@0xproject/dev-utils';

import { web3Wrapper } from './utils/web3_wrapper';

before('start miner', async () => {
    await web3Wrapper.minerStartAsync();
});

after('generate coverage report', async () => {
    if (env.parseBoolean(EnvVars.SolidityCoverage)) {
        const coverageSubprovider = coverage.getCoverageSubproviderSingleton();
        await coverageSubprovider.writeCoverageAsync();
    }
});

after('stop miner', async () => {
    await web3Wrapper.minerStopAsync();
});
