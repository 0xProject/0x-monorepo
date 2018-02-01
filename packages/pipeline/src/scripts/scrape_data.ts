import { ExchangeEvents } from '0x.js';
import * as commandLineArgs from 'command-line-args';
import * as querystring from 'querystring';
import * as queue from 'queue';
import * as request from 'request';
import { postgresClient } from '../postgres.js';
import { typeConverters } from '../utils.js';
import { web3, zrx} from '../zrx.js';
import { insertDataScripts } from './tables.js';
import { dataFetchingQueries } from './query_data.js';

const optionDefinitions = [{ name: 'from', alias: 'f', type: Number }, { name: 'to', alias: 't', type: Number }, { name: 'type', type: String}, {name:'id', type: String}, {name:'force', type: Boolean}];
const cli = commandLineArgs(optionDefinitions);

const q = queue({ concurrency: 6, autostart: true });

const BLOCK_INCREMENTS = 1000;
const PRICE_API_ENDPOINT = 'https://min-api.cryptocompare.com/data/pricehistorical?';

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
    getBlockInfo(blockNumber: number): any {
        return new Promise((resolve, reject) => {
            web3.eth.getBlock(blockNumber, (err, result) => {
                if(err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
        });
    },
    getTransactionInfo(transactionHash: string): any {
        return new Promise((resolve, reject) => {
            web3.eth.getTransaction(transactionHash, (err, result) => {
                if(err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            })
        });
    },
    getTokenRegistry(): any {
        return new Promise((resolve, reject) => {
            zrx.tokenRegistry.getTokensAsync()
            .then((data: any) => {
                resolve(data);
            })
            .catch((err:any) => {
                reject(err);
            })
        });
    },
    getPriceData(symbol: string, timestamp: number): any {
        return new Promise((resolve, reject) => {
            var parsedParams = querystring.stringify({
                'fsym' : symbol,
                'tsyms' : 'USD',
                'ts': (timestamp / 1000),
            });
            request(PRICE_API_ENDPOINT + parsedParams, (error, response, body) => {
                if(error){
                    reject(error);
                } else {
                    resolve(JSON.parse(body));
                }
              });
        });
    }
};

function _scrapeEventsToDB(fromBlock: number, toBlock: number): any {
    return (cb: () => void) => {
        console.log("Fetching " + fromBlock + " : " + toBlock);
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
                    if(parsedEvents[event_type].length > 0) {
                        insertDataScripts.insertMultipleRows('events_raw', parsedEvents[event_type], Object.keys(parsedEvents[event_type][0]));
                    }
                }
                cb();
            })
            .catch((err: any) => {
                console.error(err)
                cb();
            });
    };
}

function _scrapeBlockToDB(block: number): any {
    return (cb: () => void) => {
        scrapeDataScripts
        .getBlockInfo(block)
        .then((data: any) => {
            const parsedBlock = typeConverters.convertLogBlockToBlockObject(data);
            insertDataScripts.insertSingleRow('blocks', parsedBlock)
            .then((result: any) => {
                cb();
            })
            .catch((err: any) => {
                console.error(err);
                cb();
            });
        })
        .catch((err: any) => {
            cb();
        });
    };
}

function _scrapeTransactionToDB(transactionHash: string): any {
    return (cb: () => void) => {
        scrapeDataScripts
        .getTransactionInfo(transactionHash)
        .then((data: any) => {
            const parsedTransaction = typeConverters.convertLogTransactionToTransactionObject(data);
            insertDataScripts.insertSingleRow('transactions', parsedTransaction)
            .then((result: any) => {
                console.log("Inserted txn " + transactionHash);
                cb();
            })
            .catch((err: any) => {
                console.error("Failed txn " + transactionHash);
                console.error(err);
                cb();
            })
        })
        .catch((err: any) => {
            cb();
        });
    };
}

function _scrapeTokenRegistryToDB(): any {
    return (cb: () => void) => {
        scrapeDataScripts
        .getTokenRegistry()
        .then((data: any) => {
            const parsedTokens: any = [];
            for(const token of data) {
                parsedTokens.push(typeConverters.convertLogTokenToTokenObject(token));
            }
            insertDataScripts.insertMultipleRows('tokens', parsedTokens, Object.keys(parsedTokens[0]));
            cb();
        })
        .catch((err: any) => {
            cb();
        });
    };
}

function _scrapePriceToDB(timestamp: number, token: any): any {
    return (cb: () => void) => {
        scrapeDataScripts.getPriceData(token.symbol, timestamp)
        .then((data: any) => {
            const parsedPrice = {
                'timestamp' : timestamp,
                'address' : token.address,
                'price' : data[token.symbol]['USD'],
            }
            insertDataScripts.insertSingleRow('prices', parsedPrice);
            cb();
        })
        .catch((err: any) => {
            console.log(err);
            cb();
        });
    };
}

if(cli.type === 'events') {
    if (cli.from && cli.to) {
        const destToBlock = cli.to ? cli.to : cli.from;
        let curFromBlock = cli.from;
        let curToBlock = curFromBlock;
        do {
            curToBlock += destToBlock - curToBlock < BLOCK_INCREMENTS ? destToBlock - curToBlock : BLOCK_INCREMENTS;
            q.push(_scrapeEventsToDB(curFromBlock, curToBlock));
            curFromBlock = curToBlock + 1;
        } while (curToBlock < destToBlock);
    }
} else if(cli.type === 'blocks') {
    if (cli.from && cli.to) {
        if(cli.force) {
            const destToBlock = cli.to ? cli.to : cli.from;
            let curFromBlock = cli.from;
            let curToBlock = curFromBlock;
            for(; curFromBlock < destToBlock; curFromBlock++) {
                q.push(_scrapeBlockToDB(curFromBlock));
            }
        } else {
            const fetchFrom = cli.from;
            let fetchTo = cli.to ? cli.to : cli.from + 1;
            postgresClient.query(dataFetchingQueries.get_used_block_numbers, [fetchFrom, fetchTo])
            .then((data:any) => {
                for(const row of data.rows) {
                    q.push(_scrapeBlockToDB(row.block_number));
                }
            })
            .catch((err:any) => {
                console.log(err);
            })
        }
    }
} else if(cli.type === 'transactions') {
    if (cli.id) {
        q.push(_scrapeTransactionToDB(cli.id));
    } else if(cli.from) {
        const fetchFrom = cli.from;
        let fetchTo = cli.to ? cli.to : cli.from + 1;
        postgresClient.query(dataFetchingQueries.get_missing_txn_hashes, [fetchFrom, fetchTo])
        .then((data:any) => {
            for(const row of data.rows) {
                q.push(_scrapeTransactionToDB(row.txn_hash));
            }
        })
        .catch((err:any) => {
            console.log(err);
        })
        
    }
} else if(cli.type === 'tokens') {
    q.push(_scrapeTokenRegistryToDB());
} else if (cli.type === 'prices') {
    if (cli.from && cli.to) {
            const fromDate = new Date(cli.from);
            fromDate.setUTCHours(0);
            fromDate.setUTCMinutes(0);
            fromDate.setUTCSeconds(0);
            fromDate.setUTCMilliseconds(0);
            const toDate = new Date(cli.to);
            postgresClient.query(dataFetchingQueries.get_token_registry, [])
            .then((result:any) => {
                for(let curDate = fromDate; curDate < toDate; curDate.setDate(curDate.getDate() + 1)) {
                    for(const token of Object.values(result.rows)) {
                        q.push(_scrapePriceToDB(curDate.getTime(), token));
                    }
                }
            })
            .catch((err:any) => {
                console.log(err);
            })
    }
} else if (cli.type === 'test') {
    scrapeDataScripts.getAllEvents(4930000, 4940000)
    .then((data: any) => {
        console.log(data)
    })
    .catch((error: any) => {
        console.log(error)
    })
}
