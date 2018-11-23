import { env, EnvVars } from '@0x/dev-utils';

import { coverage, profiler } from '@0x/contracts-test-utils';

after('generate coverage report', async () => {
    if (env.parseBoolean(EnvVars.SolidityCoverage)) {
        const coverageSubprovider = coverage.getCoverageSubproviderSingleton();
        await coverageSubprovider.writeCoverageAsync();
    }
    if (env.parseBoolean(EnvVars.SolidityProfiler)) {
        const profilerSubprovider = profiler.getProfilerSubproviderSingleton();
        await profilerSubprovider.writeProfilerOutputAsync();
    }
});
