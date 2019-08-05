import { coverage, profiler, provider } from '@0x/contracts-test-utils';
import { env, EnvVars } from '@0x/dev-utils';
import { prependSubprovider } from '@0x/subproviders';
import { providerUtils } from '@0x/utils';

const coverageSubprovider = coverage.getCoverageSubproviderSingleton();
const profilerSubprovider = profiler.getProfilerSubproviderSingleton();

if (env.parseBoolean(EnvVars.SolidityCoverage)) {
    prependSubprovider(provider, coverageSubprovider);
    provider.stop();
}
if (env.parseBoolean(EnvVars.SolidityProfiler)) {
    prependSubprovider(provider, profilerSubprovider);
    provider.stop();
}

before('start web3 provider', () => {
    providerUtils.startProviderEngine(provider);
});
after('generate coverage report', async () => {
    if (env.parseBoolean(EnvVars.SolidityCoverage)) {
        await coverageSubprovider.writeCoverageAsync();
    }
    if (env.parseBoolean(EnvVars.SolidityProfiler)) {
        await profilerSubprovider.writeProfilerOutputAsync();
    }
    provider.stop();
});
