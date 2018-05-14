import { logUtils } from '@0xproject/utils';
import * as express from 'express';
import rollbar = require('rollbar');

import { configs } from './configs';

export const errorReporter = {
    setup(): void {
        rollbar.init(configs.ROLLBAR_ACCESS_KEY, {
            environment: configs.ENVIRONMENT,
        });
        rollbar.handleUncaughtExceptions(configs.ROLLBAR_ACCESS_KEY);
        process.on('unhandledRejection', async (err: Error) => {
            logUtils.log(`Uncaught exception ${err}. Stack: ${err.stack}`);
            await this.reportAsync(err);
            process.exit(1);
        });
    },
    async reportAsync(err: Error, req?: express.Request): Promise<any> {
        if (configs.ENVIRONMENT === 'development') {
            return; // Do not log development environment errors
        }
        return new Promise((resolve, reject) => {
            rollbar.handleError(err, req, (rollbarErr: Error) => {
                if (rollbarErr) {
                    logUtils.log(`Error reporting to rollbar, ignoring: ${rollbarErr}`);
                    reject(rollbarErr);
                } else {
                    resolve();
                }
            });
        });
    },
    errorHandler(): any {
        return rollbar.errorHandler(configs.ROLLBAR_ACCESS_KEY);
    },
};
