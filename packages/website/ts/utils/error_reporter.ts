import { logUtils } from '@0x/utils';
import Rollbar = require('rollbar');
import { configs } from 'ts/utils/configs';
import { constants } from 'ts/utils/constants';
import { utils } from 'ts/utils/utils';

// Suggested way to include Rollbar with Webpack
// https://github.com/rollbar/rollbar.js/tree/master/examples/webpack
const rollbarConfig = {
    accessToken: constants.ROLLBAR_ACCESS_TOKEN,
    captureUncaught: true,
    captureUnhandledRejections: true,
    itemsPerMinute: 10,
    maxItems: 500,
    payload: {
        environment: utils.getEnvironment(),
        client: {
            javascript: {
                source_map_enabled: true,
                // This is only defined in production environments.
                code_version: process.env.GIT_SHA,
                guess_uncaught_frames: true,
            },
        },
    },
    uncaughtErrorLevel: 'error',
    hostWhiteList: [configs.DOMAIN_PRODUCTION, configs.DOMAIN_STAGING],
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
};

const rollbar = new Rollbar(rollbarConfig);

export const errorReporter = {
    report(err: Error): void {
        if (utils.isDevelopment()) {
            return; // Let's not log development errors to rollbar
        }
        rollbar.error(err, (rollbarErr: Error) => {
            if (rollbarErr) {
                logUtils.log(`Error reporting to rollbar, ignoring: ${rollbarErr}`);
            }
        });
    },
};
