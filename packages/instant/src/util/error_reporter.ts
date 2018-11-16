import { logUtils } from '@0x/utils';

import { ROLLBAR_ACCESS_TOKEN } from '../constants';
import { Environment } from '../types';

import { scriptEnvironment } from './script_environment';

// Import version of Rollbar designed for embedded components
// See https://docs.rollbar.com/docs/using-rollbarjs-inside-an-embedded-component
// tslint:disable-next-line:no-var-requires
const Rollbar = require('rollbar/dist/rollbar.noconflict.umd');

const shouldReportErrors = () => {
    const isNonDev = scriptEnvironment.getEnvironment() !== Environment.Development;
    return isNonDev || process.env.FORCE_REPORT_ROLLBAR ? true : false;
};

const rollbar = new Rollbar({
    accessToken: ROLLBAR_ACCESS_TOKEN,
    captureUncaught: true,
    captureUnhandledRejections: true,
    enabled: shouldReportErrors(),
    itemsPerMinute: 10,
    maxItems: 500,
    payload: {
        environment: scriptEnvironment.getEnvironment(),
        client: {
            javascript: {
                source_map_enabled: true,
                code_version: process.env.GIT_SHA,
                guess_uncaught_frames: true,
            },
        },
    },
    uncaughtErrorLevel: 'error',
    ignoredMessages: [
        // Errors from the third-party scripts
        'Script error',
        // Network errors or ad-blockers
        'TypeError: Failed to fetch',
        'Exchange has not been deployed to detected network (network/artifact mismatch)',
        // Source: https://groups.google.com/a/chromium.org/forum/#!topic/chromium-discuss/7VU0_VvC7mE
        "undefined is not an object (evaluating '__gCrWeb.autofill.extractForms')",
        // Source: http://stackoverflow.com/questions/43399818/securityerror-from-facebook-and-cross-domain-messaging
        'SecurityError (DOM Exception 18)',
    ],
});

export const setupRollbar = () => {
    return rollbar;
};

export const errorReporter = {
    report(err: Error): void {
        rollbar.error(err, (rollbarErr: Error) => {
            if (rollbarErr) {
                logUtils.log(`Error reporting to rollbar, ignoring: ${rollbarErr}`);
            }
        });
    },
};
