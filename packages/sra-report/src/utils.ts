import { promisify } from '@0xproject/utils';
import { NewmanRunSummary, run as newmanRun } from 'newman';

export const utils = {
    log(...args: any[]): void {
        console.log(...args); // tslint:disable-line:no-console
    },
    newmanRunAsync: promisify<NewmanRunSummary>(newmanRun),
};
