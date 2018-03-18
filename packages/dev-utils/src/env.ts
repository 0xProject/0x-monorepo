import * as _ from 'lodash';
import * as process from 'process';

export enum EnvVars {
    SolidityCoverage = 'SOLIDITY_COVERAGE',
    VerboseGanache = 'VERBOSE_GANACHE',
}

export const env = {
    parseBoolean(key: string): boolean {
        let isTrue: boolean;
        const envVarValue = process.env[key];
        if (envVarValue === 'true') {
            isTrue = true;
        } else if (envVarValue === 'false' || _.isUndefined(envVarValue)) {
            isTrue = false;
        } else {
            throw new Error(
                `Failed to parse ENV variable ${key} as boolean. Please make sure it's either true or false. Defaults to false`,
            );
        }
        return isTrue;
    },
};
