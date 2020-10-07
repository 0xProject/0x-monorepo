import * as _ from 'lodash';
import * as process from 'process';

export enum EnvVars {
    SolidityCoverage = 'SOLIDITY_COVERAGE',
    SolidityProfiler = 'SOLIDITY_PROFILER',
    SolidityRevertTrace = 'SOLIDITY_REVERT_TRACE',
    VerboseGanache = 'VERBOSE_GANACHE',
    UnlimitedContractSize = 'UNLIMITED_CONTRACT_SIZE',
}

export const env = {
    parseBoolean(key: string): boolean {
        let isTrue: boolean;
        const envVarValue = process.env[key];
        if (envVarValue === 'true') {
            isTrue = true;
        } else if (envVarValue === 'false' || envVarValue === undefined) {
            isTrue = false;
        } else {
            throw new Error(
                `Failed to parse ENV variable ${key} as boolean. Please make sure it's either true or false. Defaults to false`,
            );
        }
        return isTrue;
    },
};
