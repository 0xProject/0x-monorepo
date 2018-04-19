import { promisify } from '@0xproject/utils';
import { NewmanRunSummary, run as newmanRun } from 'newman';

export const utils = {
    newmanRunAsync: promisify<NewmanRunSummary>(newmanRun),
};
