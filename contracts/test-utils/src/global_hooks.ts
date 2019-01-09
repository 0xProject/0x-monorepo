import { env, EnvVars } from '@0x/dev-utils';

import { coverage } from './coverage';
import { profiler } from './profiler';

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
