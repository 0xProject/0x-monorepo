import * as _ from 'lodash';
import * as process from 'process';

export const env = {
    parseBoolean(key: string): boolean {
        let isTrue: boolean;
        const envVarvalue = process.env[key];
        if (process.env.SOLIDITY_COVERAGE === 'true') {
            isTrue = true;
        } else if (process.env.SOLIDITY_COVERAGE === 'false' || _.isUndefined(process.env.SOLIDITY_COVERAGE)) {
            isTrue = false;
        } else {
            throw new Error(
                `Failed to parse ENV variable ${key} as boolean. Please make sure it's either true or false. Defaults to false`,
            );
        }
        return isTrue;
    },
};
