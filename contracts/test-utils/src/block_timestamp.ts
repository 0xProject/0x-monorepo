import * as _ from 'lodash';

import { constants } from './constants';
import { web3Wrapper } from './web3_wrapper';

let firstAccount: string | undefined;

/**
 * Increases time by the given number of seconds and then mines a block so that
 * the current block timestamp has the offset applied.
 * @param seconds the number of seconds by which to incrase the time offset.
 * @returns a new Promise which will resolve with the new total time offset or
 * reject if the time could not be increased.
 */
export async function increaseTimeAndMineBlockAsync(seconds: number): Promise<number> {
    if (_.isUndefined(firstAccount)) {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        firstAccount = accounts[0];
    }

    const offset = await web3Wrapper.increaseTimeAsync(seconds);
    // Note: we need to send a transaction after increasing time so
    // that a block is actually mined. The contract looks at the
    // last mined block for the timestamp.
    await web3Wrapper.awaitTransactionSuccessAsync(
        await web3Wrapper.sendTransactionAsync({ from: firstAccount, to: firstAccount, value: 0 }),
        constants.AWAIT_TRANSACTION_MINED_MS,
    );

    return offset;
}

/**
 * Returns the timestamp of the latest block in seconds since the Unix epoch.
 * @returns a new Promise which will resolve with the timestamp in seconds.
 */
export async function getLatestBlockTimestampAsync(): Promise<number> {
    const currentBlockIfExists = await web3Wrapper.getBlockIfExistsAsync('latest');
    if (_.isUndefined(currentBlockIfExists)) {
        throw new Error(`Unable to fetch latest block.`);
    }
    return currentBlockIfExists.timestamp;
}
