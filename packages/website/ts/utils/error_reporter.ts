import { logUtils } from '@0xproject/utils';
import { Environments } from 'ts/types';
import { configs } from 'ts/utils/configs';
import { constants } from 'ts/utils/constants';

// Suggested way to include Rollbar with Webpack
// https://github.com/rollbar/rollbar.js/tree/master/examples/webpack
const rollbarConfig = {
    accessToken: constants.ROLLBAR_ACCESS_TOKEN,
    captureUncaught: true,
    captureUnhandledRejections: true,
    itemsPerMinute: 10,
    maxItems: 500,
    payload: {
        environment: configs.ENVIRONMENT,
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
import Rollbar = require('../../public/js/rollbar.umd.nojson.min.js');
const rollbar = Rollbar.init(rollbarConfig);

export const errorReporter = {
    async reportAsync(err: Error): Promise<any> {
        if (configs.ENVIRONMENT === Environments.DEVELOPMENT) {
            return; // Let's not log development errors to rollbar
        }

        return new Promise((resolve, reject) => {
            rollbar.error(err, (rollbarErr: Error) => {
                if (rollbarErr) {
                    logUtils.log(`Error reporting to rollbar, ignoring: ${rollbarErr}`);
                    // We never want to reject and cause the app to throw because of rollbar
                    resolve();
                } else {
                    resolve();
                }
            });
        });
    },
};
