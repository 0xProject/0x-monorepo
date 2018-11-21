import { logUtils } from '@0x/utils';
import * as _ from 'lodash';

import { INSTANT_ENVIRONMENT, ROLLBAR_CLIENT_TOKEN, ROLLBAR_ENABLED } from '../constants';

// Import version of Rollbar designed for embedded components
// See https://docs.rollbar.com/docs/using-rollbarjs-inside-an-embedded-component
// tslint:disable-next-line:no-var-requires
const Rollbar = require('rollbar/dist/rollbar.noconflict.umd');

let rollbar: any;
// Configures rollbar and sets up error catching
export const setupRollbar = (): any => {
    if (_.isUndefined(rollbar) && ROLLBAR_CLIENT_TOKEN && INSTANT_ENVIRONMENT && ROLLBAR_ENABLED) {
        rollbar = new Rollbar({
            accessToken: ROLLBAR_CLIENT_TOKEN,
            captureUncaught: true,
            captureUnhandledRejections: true,
            enabled: true,
            itemsPerMinute: 10,
            maxItems: 500,
            payload: {
                environment: INSTANT_ENVIRONMENT,
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
    }
};

export const errorReporter = {
    report(err: Error): void {
        if (!rollbar) {
            logUtils.log('Not reporting to rollbar because not configured', err);
            return;
        }

        rollbar.error(err, (rollbarErr: Error) => {
            if (rollbarErr) {
                logUtils.log(`Error reporting to rollbar, ignoring: ${rollbarErr}`);
            }
        });
    },
};
