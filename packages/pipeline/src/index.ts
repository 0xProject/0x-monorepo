import { web3Factory } from '@0x/dev-utils';
import 'reflect-metadata';
import { Connection, createConnection } from 'typeorm';

import { ExchangeEventsSource } from './data_sources/contract-wrappers/exchange_events';
import { deployConfig } from './ormconfig';
import { parseExchangeEvents } from './parsers/events';
import { ExchangeFillEvent } from './entities/ExchangeFillEvent';

let connection: Connection;

(async () => {
    connection = await createConnection(deployConfig);
    await getExchangeEventsAsync();
    await mergeExchangeEventsAsync();
    console.log('Exiting process');
    process.exit(0);
})();

// TODO(albrow): Separately: Errors do not appear to be handled correctly. If you use the
// wrong rpcUrl it just returns early with no error.
async function getExchangeEventsAsync(): Promise<void> {
    console.log('Getting event logs...');
    const provider = web3Factory.getRpcProvider({
        rpcUrl: 'https://mainnet.infura.io',
    });
    const eventsRepository = connection.getRepository(ExchangeFillEvent);
    const exchangeEvents = new ExchangeEventsSource(provider, 1);
    const eventLogs = await exchangeEvents.getFillEventsAsync();
    console.log('Parsing events...');
    const events = parseExchangeEvents(eventLogs);
    console.log(`Retrieved and parsed ${events.length} total events.`);
    console.log('Saving events...');
    eventsRepository.save(events);
    console.log('Saved events.');
}

const insertEventsRawQuery = `INSERT INTO events_raw (
    event_type,
    error_id,
    order_hash,
    maker,
    maker_amount,
    maker_fee,
    maker_token,
    taker,
    taker_amount,
    taker_fee,
    taker_token,
    txn_hash,
    fee_recipient,
    block_number,
    log_index
)
(
    SELECT
        'LogFill',
        null,
        "orderHash",
        "makerAddress",
        "makerAssetFilledAmount"::numeric(78),
        "makerFeePaid"::numeric(78),
        "makerTokenAddress",
        "takerAddress",
        "takerAssetFilledAmount"::numeric(78),
        "takerFeePaid"::numeric(78),
        "takerTokenAddress",
        "transactionHash",
        "feeRecipientAddress",
        "blockNumber",
        "logIndex"
    FROM exchange_fill_event
) ON CONFLICT (order_hash, txn_hash, log_index) DO NOTHING`;

async function mergeExchangeEventsAsync(): Promise<void> {
    console.log('Merging results into events_raw...');
    await connection.query(insertEventsRawQuery);
}
