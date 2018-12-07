import { DecodedLogArgs, LogWithDecodedArgs } from 'ethereum-types';

const NUM_BLOCKS_PER_QUERY = 10000; // Number of blocks to query for events at a time.
const NUM_RETRIES = 3; // Number of retries if a request fails or times out.

export type GetEventsFunc<ArgsType extends DecodedLogArgs> = (
    fromBlock: number,
    toBlock: number,
) => Promise<Array<LogWithDecodedArgs<ArgsType>>>;

/**
 * Gets all events between the given startBlock and endBlock by querying for
 * NUM_BLOCKS_PER_QUERY at a time. Accepts a getter function in order to
 * maximize code re-use and allow for getting different types of events for
 * different contracts. If the getter function throws with a retryable error,
 * it will automatically be retried up to NUM_RETRIES times.
 * @param getEventsAsync A getter function which will be called for each step during pagination.
 * @param startBlock The start of the entire block range to get events for.
 * @param endBlock The end of the entire block range to get events for.
 */
export async function getEventsWithPaginationAsync<ArgsType extends DecodedLogArgs>(
    getEventsAsync: GetEventsFunc<ArgsType>,
    startBlock: number,
    endBlock: number,
): Promise<Array<LogWithDecodedArgs<ArgsType>>> {
    let events: Array<LogWithDecodedArgs<ArgsType>> = [];
    for (let fromBlock = startBlock; fromBlock <= endBlock; fromBlock += NUM_BLOCKS_PER_QUERY) {
        const toBlock = Math.min(fromBlock + NUM_BLOCKS_PER_QUERY - 1, endBlock);
        const eventsInRange = await getEventsWithRetriesAsync(getEventsAsync, fromBlock, toBlock);
        events = events.concat(eventsInRange);
    }
    return events;
}

// Calls the getEventsAsync function and retries up to NUM_RETRIES times if it
// throws with an error that is considered retryable.
async function getEventsWithRetriesAsync<ArgsType extends DecodedLogArgs>(
    getEventsAsync: GetEventsFunc<ArgsType>,
    fromBlock: number,
    toBlock: number,
): Promise<Array<LogWithDecodedArgs<ArgsType>>> {
    let eventsInRange: Array<LogWithDecodedArgs<ArgsType>> = [];
    for (let i = 0; i <= NUM_RETRIES; i++) {
        try {
            eventsInRange = await getEventsAsync(fromBlock, toBlock);
        } catch (err) {
            if (isErrorRetryable(err) && i < NUM_RETRIES) {
                continue;
            } else {
                throw err;
            }
        }
        break;
    }
    return eventsInRange;
}

function isErrorRetryable(err: Error): boolean {
    return err.message.includes('network timeout');
}
