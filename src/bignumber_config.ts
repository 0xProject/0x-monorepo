import * as BigNumber from 'bignumber.js';

export const bigNumberConfigs = {
    configure() {
        // By default BigNumber's `toString` method converts to exponential notation if the value has
        // more then 20 digits. We want to avoid this behavior, so we set EXPONENTIAL_AT to a high number
        BigNumber.config({
            EXPONENTIAL_AT: 1000,
        });
    },
};
