import { TxData } from 'ethereum-types';

import { Pseudorandom} from './pseudorandom';

// tslint:disable:no-console

class Logger {
    private _step = 0;

    constructor() {
        console.warn(
            JSON.stringify({
                level: 'info',
                time: new Date(),
                msg: `Pseudorandom seed: ${Pseudorandom.seed}`,
            }),
        );
    }

    /*
     * Logs the name of the function executed, the arguments and transaction data it was
     * called with, and the current step of the simulation.
     */
    public logFunctionAssertion(functionName: string, functionArgs: any[], txData: Partial<TxData>): void {
        console.warn(
            JSON.stringify({
                level: 'info',
                time: new Date(),
                msg: `Function called: ${functionName}(${functionArgs
                    .map(arg => JSON.stringify(arg).replace(/"/g, "'"))
                    .join(', ')})`,
                step: this._step++,
                txData,
            }),
        );
    }

    /*
     * Logs information about a assertion failure. Dumps the error thrown and arbitrary data from
     * the calling context.
     */
    public logFailure(error: Error, data: string): void {
        console.warn(
            JSON.stringify({
                level: 'error',
                time: new Date(),
                step: this._step,
                error,
                data,
            }),
        );
    }
}

export const logger = new Logger();
