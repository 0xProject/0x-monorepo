import chalk from 'chalk';

export const logUtils = {
    log(...args: any[]): void {
        console.log(...args); // tslint:disable-line:no-console
    },
    warn(...args: any[]): void {
        console.warn(...args); // tslint:disable-line:no-console
    },
    logWithTime(arg: string): void {
        logUtils.log(`[${chalk.gray(new Date().toLocaleTimeString())}] ${arg}`);
    },
};
