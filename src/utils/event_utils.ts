import * as _ from 'lodash';
import {EventCallback, ContractEventArg, ContractEvent, ContractEventObj, ContractEventEmitter} from '../types';
import * as BigNumber from 'bignumber.js';
import promisify = require('es6-promisify');

export const eventUtils = {
    wrapEventEmitter(event: ContractEventObj): ContractEventEmitter {
        const watch = (eventCallback: EventCallback) => {
            const bignumberWrappingEventCallback = eventUtils._getBigNumberWrappingEventCallback(eventCallback);
            event.watch(bignumberWrappingEventCallback);
        };
        const zeroExEvent = {
            watch,
            stopWatchingAsync: async () => {
                await promisify(event.stopWatching, event)();
            },
        };
        return zeroExEvent;
    },
    /**
     * Wraps eventCallback function so that all the BigNumber arguments are wrapped in a newer version of BigNumber.
     * @param eventCallback     Event callback function to be wrapped
     * @return Wrapped event callback function
     */
    _getBigNumberWrappingEventCallback(eventCallback: EventCallback): EventCallback {
        const bignumberWrappingEventCallback = (err: Error, event: ContractEvent) => {
            if (_.isNull(err)) {
                const wrapIfBigNumber = (value: ContractEventArg): ContractEventArg => {
                    // HACK: The old version of BigNumber used by Web3@0.19.0 does not support the `isBigNumber`
                    // and checking for a BigNumber instance using `instanceof` does not work either. We therefore
                    // check if the value constructor is a bignumber constructor.
                    const isWeb3BigNumber = _.startsWith(value.constructor.toString(), 'function BigNumber(');
                    return isWeb3BigNumber ?  new BigNumber(value) : value;
                };
                event.args = _.mapValues(event.args, wrapIfBigNumber);
            }
            eventCallback(err, event);
        };
        return bignumberWrappingEventCallback;
    },
};
