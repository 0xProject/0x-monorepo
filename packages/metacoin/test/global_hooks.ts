import { env, EnvVars } from '@0xproject/dev-utils';

import { coverage } from './utils/coverage';

after('generate coverage report', async () => {
    if (env.parseBoolean(EnvVars.SolidityCoverage)) {
        const coverageSubprovider = coverage.getCoverageSubproviderSingleton();
        await coverageSubprovider.writeCoverageAsync();
    }
});
