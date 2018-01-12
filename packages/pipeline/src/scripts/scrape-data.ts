import { ZeroEx } from '0x.js';
import * as Web3 from 'web3';
import { redshiftClient } from '../redshift';
import { ExchangeEvents } from '../../../0x.js/src/types';

const provider = new Web3.providers.HttpProvider('https://mainnet.infura.io/Rd44ElIrWp05rUczoKps');

const MAINNET = 1;
const zrx = new ZeroEx(provider, {
    networkId: MAINNET,
});

export const scrapeDataScripts = {
    getAllEvents(fromBlockNumber: number, toBlockNumber: number): any {
        return new Promise((resolve, reject) => {
            const getLogsPromises: any[] = [];
            getLogsPromises.push(
                zrx.exchange.getLogsAsync(ExchangeEvents.LogFill, { fromBlock: fromBlockNumber, toBlock: toBlockNumber }, {}),
                zrx.exchange.getLogsAsync(ExchangeEvents.LogCancel, { fromBlock: fromBlockNumber, toBlock: toBlockNumber }, {}),
                zrx.exchange.getLogsAsync(ExchangeEvents.LogError, { fromBlock: fromBlockNumber, toBlock: toBlockNumber }, {}),
            );

            Promise.all(getLogsPromises)
            .then((data: any[]) => {
                resolve(data);
            })
            .catch((err: any) => {
                reject(err);
            })
        });
    },
};
