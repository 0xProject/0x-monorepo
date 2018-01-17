import { ExchangeEvents, ZeroEx } from '0x.js';
import * as commandLineArgs from 'command-line-args';
import * as queue from 'queue';
import * as Web3 from 'web3';
import { typeConverters } from '../utils.js';
import { insertDataScripts } from './tables.js';

const optionDefinitions = [{ name: 'from', alias: 'f', type: Number }, { name: 'to', alias: 't', type: Number }];
const cli = commandLineArgs(optionDefinitions);

const provider = new Web3.providers.HttpProvider('https://mainnet.infura.io/Rd44ElIrWp05rUczoKps');

const q = queue({ concurrency: 4, autostart: true });

const MAINNET = 1;
const zrx = new ZeroEx(provider, {
    networkId: MAINNET,
});

const BLOCK_INCREMENTS = 1000;

export const scrapeDataScripts = {
    getAllEvents(fromBlockNumber: number, toBlockNumber: number): any {
        return new Promise((resolve, reject) => {
            const getLogsPromises: any[] = [];
            getLogsPromises.push(
                zrx.exchange.getLogsAsync(
                    ExchangeEvents.LogFill,
                    { fromBlock: fromBlockNumber, toBlock: toBlockNumber },
                    {},
                ),
                zrx.exchange.getLogsAsync(
                    ExchangeEvents.LogCancel,
                    { fromBlock: fromBlockNumber, toBlock: toBlockNumber },
                    {},
                ),
                zrx.exchange.getLogsAsync(
                    ExchangeEvents.LogError,
                    { fromBlock: fromBlockNumber, toBlock: toBlockNumber },
                    {},
                ),
            );

            Promise.all(getLogsPromises)
                .then((data: any[]) => {
                    resolve(data);
                })
                .catch((err: any) => {
                    reject(err);
                });
        });
    },
};

function _scrapeEventsToDB(fromBlock: number, toBlock: number): any {
    return (cb: () => void) => {
        scrapeDataScripts
            .getAllEvents(fromBlock, toBlock)
            .then((data: any) => {
                const parsedEvents: any = {};
                parsedEvents[ExchangeEvents.LogFill] = [];
                parsedEvents[ExchangeEvents.LogCancel] = [];
                parsedEvents[ExchangeEvents.LogError] = [];

                for (const index in data) {
                    for (const datum of data[index]) {
                        const event = typeConverters.convertLogEventToEventObject(datum);
                        parsedEvents[event.event_type].push(event);
                    }
                }

                for (const event_type in parsedEvents) {
                    insertDataScripts.insertMultipleRows('events_raw', parsedEvents[event_type]);
                }
                cb();
            })
            .catch((err: any) => {
                cb();
            });
    };
}

if (cli.from && cli.to) {
    const destToBlock = cli.to;
    let curFromBlock = cli.from;
    let curToBlock = curFromBlock;

    do {
        curToBlock += destToBlock - curToBlock < BLOCK_INCREMENTS ? destToBlock - curToBlock : BLOCK_INCREMENTS;
        q.push(_scrapeEventsToDB(curFromBlock, curToBlock));
        curFromBlock = curToBlock + 1;
    } while (curToBlock < destToBlock);
}
