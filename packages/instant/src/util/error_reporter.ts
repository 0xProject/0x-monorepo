import { logUtils } from '@0x/utils';

// TODO: Typesafety still not working
import Rollbar from 'rollbar';

import { ROLLBAR_ACCESS_TOKEN } from '../constants';

import { environmentUtil } from './environment';

// TODO: dont commit
console.log(environmentUtil.getEnvironment());

const rollbar = new Rollbar({
    accessToken: ROLLBAR_ACCESS_TOKEN,
    captureUncaught: true,
    captureUnhandledRejections: true,
    itemsPerMinute: 10,
    maxItems: 500,
    payload: {
        environment: environmentUtil.getEnvironment(),
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
    // hostWhiteList: ['TODO'],
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
    (window as any).zeroExTriggerError = (errorDesc: string) => {
        throw new Error(errorDesc);
    };

    return rollbar;
};

export const errorReporter = {
    report(err: Error): void {
        // TOOD: dev check
        rollbar.error(err, (rollbarErr: Error) => {
            if (rollbarErr) {
                logUtils.log(`Error reporting to rollbar, ignoring: ${rollbarErr}`);
            }
        });
    },
};
