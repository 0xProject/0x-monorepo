import * as _ from 'lodash';

import { constants } from './constants';
import { web3Wrapper } from './web3_wrapper';

let firstAccount: string | undefined;

// increases time by the given number of seconds and then mines a block so that
// the current block timestamp has the offset applied.
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
