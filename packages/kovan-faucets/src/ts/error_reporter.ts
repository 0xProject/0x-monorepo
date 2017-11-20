import * as fs from 'fs';
import * as express from 'express';
import {utils} from './utils';
import {configs} from './configs';
import rollbar = require('rollbar');

export const errorReporter = {
    setup() {
        rollbar.init(configs.ROLLBAR_ACCESS_KEY, {
            environment: configs.ENVIRONMENT,
        });

        rollbar.handleUncaughtExceptions(configs.ROLLBAR_ACCESS_KEY);

        process.on('unhandledRejection', (err: Error) => {
            utils.consoleLog(`Uncaught exception ${err}. Stack: ${err.stack}`);
            this.report(err);
            process.exit(1);
        });
    },
    reportAsync(err: Error, req?: express.Request): Promise<any> {
        if (configs.ENVIRONMENT === 'development') {
            return; // Do not log development environment errors
        }

        return new Promise((resolve, reject) => {
            rollbar.handleError(err, req, (rollbarErr: Error) => {
                if (rollbarErr) {
                    utils.consoleLog(`Error reporting to rollbar, ignoring: ${rollbarErr}`);
                    reject(rollbarErr);
                } else {
                    resolve();
                }
            });
        });
    },
    errorHandler() {
        return rollbar.errorHandler(configs.ROLLBAR_ACCESS_KEY);
    },
};
