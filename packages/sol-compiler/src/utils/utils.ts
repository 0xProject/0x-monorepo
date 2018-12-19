import { logUtils } from '@0x/utils';
import chalk from 'chalk';

export const utils = {
    stringifyWithFormatting(obj: any): string {
        const stringifiedObj = JSON.stringify(obj, null, '\t');
        return stringifiedObj;
    },
    logWithTime(arg: string): void {
        logUtils.log(`[${chalk.gray(new Date().toLocaleTimeString())}] ${arg}`);
    },
};
