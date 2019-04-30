import chalk from 'chalk';
import * as _ from 'lodash';

const DEFAULT_TERMINAL_WIDTH = 80;
const TERMINAL_WIDTH = _.get(process, 'stdout.columns') || DEFAULT_TERMINAL_WIDTH;

export const logUtils = {
    log(...args: any[]): void {
        console.log(...args); // tslint:disable-line:no-console
    },
    header(text: string, padStr: string = '='): void {
        const padLength = TERMINAL_WIDTH - text.length;
        const padLengthEnd = (padLength + 1) / 2;
        const leftPadded = text.padStart(TERMINAL_WIDTH - padLengthEnd, padStr);
        const padded = leftPadded.padEnd(TERMINAL_WIDTH, padStr);
        console.log(padded); // tslint:disable-line:no-console
    },
    warn(...args: any[]): void {
        console.warn(...args); // tslint:disable-line:no-console
    },
    table(columnarData: { [rowName: string]: any }): void {
        const formattedColumnarData = _.mapValues(columnarData, (columnOrColumns: any, _rowName: string) =>
            _.isNumber(columnOrColumns) ? columnOrColumns.toLocaleString() : columnOrColumns,
        );
        console.table(formattedColumnarData); // tslint:disable-line:no-console
    },
    logWithTime(arg: string): void {
        logUtils.log(`[${chalk.gray(new Date().toLocaleTimeString())}] ${arg}`);
    },
};
