import { ExchangeEvents, ZeroEx } from '0x.js';
import { HttpClient, Order, OrderbookRequest, OrderbookResponse, TokenPairsItem } from '@0xproject/connect';
import * as Airtable from 'airtable';
import * as commandLineArgs from 'command-line-args';
import * as _ from 'lodash';
import * as querystring from 'querystring';
import * as queue from 'queue';
import * as request from 'request';
import * as rpn from 'request-promise-native';

import { HttpRequestOptions } from '../../../connect/lib/src/types.js';
import { relayer } from '../models/relayer.js';
import { token } from '../models/tokens.js';
import { postgresClient } from '../postgres.js';
import { typeConverters } from '../utils.js';
import { web3, zrx } from '../zrx.js';

import { insertDataScripts } from './create_tables.js';
import { dataFetchingQueries } from './query_data.js';
const optionDefinitions = [
    { name: 'from', alias: 'f', type: Number },
    { name: 'to', alias: 't', type: Number },
    { name: 'type', type: String },
    { name: 'id', type: String },
    { name: 'force', type: Boolean },
    { name: 'token', type: String },
];
const cli = commandLineArgs(optionDefinitions);
const q = queue({ concurrency: 6, autostart: true });
const airtableBase = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_0X_BASE);
const BLOCK_INCREMENTS = 1000;
const BASE_SYMBOL = 'USD'; // use USD as base currency against
const API_HIST_LIMIT = 2000; // cryptocompare API limits histoday price query to 2000 days
const SECONDS_PER_DAY = 86400;
const PRICE_API_ENDPOINT = 'https://min-api.cryptocompare.com/data/pricehistorical';
const RELAYER_REGISTRY_JSON = 'https://raw.githubusercontent.com/0xProject/0x-relayer-registry/master/relayers.json';
const METAMASK_ETH_CONTRACT_METADATA_JSON =
    'https://raw.githubusercontent.com/MetaMask/eth-contract-metadata/master/contract-map.json';
const ETHPLORER_BASE_URL = 'http://api.ethplorer.io';
const ETHPLORER_TOP_TOKENS_JSON = `${ETHPLORER_BASE_URL}/getTopTokens?apiKey=dyijm5418TjOJe34`;
// const HIST_PRICE_API_ENDPOINT = 'https://min-api.cryptocompare.com/data/histoday';
const AIRTABLE_RELAYER_INFO = 'Relayer Info';
export const pullDataScripts = {
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
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    },
    getTransactionInfo(transactionHash: string): any {
        return new Promise((resolve, reject) => {
            web3.eth.getTransaction(transactionHash, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    },
    getTokenRegistry(): any {
        return new Promise((resolve, reject) => {
            zrx.tokenRegistry
                .getTokensAsync()
                .then((data: any) => {
                    resolve(data);
                })
                .catch((err: any) => {
                    reject(err);
                });
        });
    },
    getMetaMaskTokens(): any {
        return new Promise((resolve, reject) => {
            request(METAMASK_ETH_CONTRACT_METADATA_JSON, (error, response, body) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(JSON.parse(body));
                }
            });
        });
    },
    getEthplorerTopTokens(): any {
        return new Promise((resolve, reject) => {
            request(ETHPLORER_TOP_TOKENS_JSON, (error, response, body) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(JSON.parse(body));
                }
            });
        });
    },
    getEthplorerToken(tokenAddress: string): any {
        return new Promise((resolve, reject) => {
            const url = `${ETHPLORER_BASE_URL}/getTokenInfo/${tokenAddress}?apiKey=dyijm5418TjOJe34`;
            request(url, (error, response, body) => {
                if (error) {
                    reject(error);
                } else {
                    try {
                        const json = JSON.parse(body);
                        resolve(json);
                    } catch (err) {
                        resolve({ error: 'error' });
                    }
                }
            });
        });
    },
    getPriceData(symbol: string, timestamp: number, timeDelay?: number): any {
        return new Promise((resolve, reject) => {
            if (symbol === 'WETH') {
                symbol = 'ETH';
            }
            let parsedParams = querystring.stringify({
                fsym: symbol,
                tsyms: 'USD',
                ts: timestamp / 1000,
            });
            console.debug(parsedParams);
            setTimeout(() => {
                request(PRICE_API_ENDPOINT + '?' + parsedParams, (error, response, body) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(JSON.parse(body));
                    }
                });
            }, timeDelay);
        });
    },
    getRelayers(): any {
        return new Promise((resolve, reject) => {
            request(RELAYER_REGISTRY_JSON, (error, response, body) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(JSON.parse(body));
                }
            });
        });
    },
    async getOrderBook(sraEndpoint: string): Promise<Object> {
        const relayerClient = new HttpClient(sraEndpoint);
        const tokenResponse: TokenPairsItem[] = await relayerClient.getTokenPairsAsync();
        const fullOrderBook: OrderbookResponse[] = [];
        for (const tokenPair of tokenResponse) {
            const orderBookRequest: OrderbookRequest = {
                baseTokenAddress: tokenPair.tokenA.address,
                quoteTokenAddress: tokenPair.tokenB.address,
            };
            const orderBook: OrderbookResponse = await relayerClient.getOrderbookAsync(orderBookRequest);
            fullOrderBook.push(orderBook);
        }
        return fullOrderBook;
    },
    // async getHistoricalPrices(
    //     fromSymbol: string,
    //     toSymbol: string,
    //     fromTimestamp: number,
    //     toTimestamp: number,
    // ): Promise<HistoricalPriceResponse> {
    //     const daysInQueryPeriod = Math.round((toTimestamp - fromTimestamp) / (SECONDS_PER_DAY));
    //     if(fromSymbol === 'WETH') {
    //         fromSymbol = 'ETH';
    //     }
    //     var parsedParams = {
    //         fsym: fromSymbol,
    //         tsym: toSymbol,
    //         limit: Math.min(daysInQueryPeriod, API_HIST_LIMIT),
    //         toTs: toTimestamp,
    //     };
    //     var options = {
    //         uri: HIST_PRICE_API_ENDPOINT,
    //         qs: parsedParams,
    //         json: false,
    //     };
    //     try {
    //         const response = await rpn(options);
    //         return Promise.resolve(JSON.parse(response));
    //     } catch (error) {
    //         console.debug(error);
    //         return Promise.reject(error);
    //     }
    // },
};
export const scrapeDataScripts = {
    scrapeAllPricesToDB(fromTime: number, toTime: number) {
        const fromDate = new Date(fromTime);
        fromDate.setUTCHours(0);
        fromDate.setUTCMinutes(0);
        fromDate.setUTCSeconds(0);
        fromDate.setUTCMilliseconds(0);
        const toDate = new Date(toTime);
        postgresClient
            .query(dataFetchingQueries.get_token_registry, [])
            .then((result: any) => {
                for (const curDate = fromDate; curDate < toDate; curDate.setDate(curDate.getDate() + 1)) {
                    for (const token of Object.values(result.rows)) {
                        console.debug('Scraping ' + curDate + ' ' + token);
                        q.push(_scrapePriceToDB(curDate.getTime(), token, 500));
                    }
                }
            })
            .catch((err: any) => {
                console.debug(err);
            });
    },
};
function _scrapeEventsToDB(fromBlock: number, toBlock: number): any {
    return (cb: () => void) => {
        pullDataScripts
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
                console.log(fromBlock + ' : ' + toBlock + ' ' + parsedEvents[ExchangeEvents.LogFill].length);
                for (const event_type in parsedEvents) {
                    if (parsedEvents[event_type].length > 0) {
                        insertDataScripts
                            .insertMultipleRows(
                                'events_raw',
                                parsedEvents[event_type],
                                Object.keys(parsedEvents[event_type][0]),
                            )
                            .then(() => {})
                            .catch((error: any) => {});
                    }
                }
                cb();
            })
            .catch((err: any) => {
                cb();
            });
    };
}
function _scrapeBlockToDB(block: number): any {
    return (cb: () => void) => {
        pullDataScripts
            .getBlockInfo(block)
            .then((data: any) => {
                const parsedBlock = typeConverters.convertLogBlockToBlockObject(data);
                insertDataScripts
                    .insertSingleRow('blocks', parsedBlock)
                    .then((result: any) => {
                        cb();
                    })
                    .catch((err: any) => {
                        cb();
                    });
            })
            .catch((err: any) => {
                cb();
            });
    };
}
// function _scrapeAllRelayersToDB(): any {
//     return (cb: () => void) => {
//         airtableBase(AIRTABLE_RELAYER_INFO)
//         .select()
//         .eachPage((records: any, fetchNextPage: () => void) => {
//             const parsedRelayers: any[] = [];
//             for(const record of records) {
//                 parsedRelayers.push(typeConverters.convertRelayerToRelayerObject(record));
//             }
//             insertDataScripts.insertMultipleRows('relayers', parsedRelayers, Object.keys(parsedRelayers[0]))
//             .then((result: any) => {
//                 cb();
//             })
//             .catch((err: any) => {
//                 cb();
//             });
//         })
//         .catch((err: any) => {
//             cb();
//         });
//     };
// }
function _scrapeAllRelayersToDB(): any {
    return (cb: () => void) => {
        pullDataScripts
            .getRelayers()
            .then((relayers: any[]) => {
                console.log(relayers);
                const parsedRelayers: any[] = [];
                for (const relayer of relayers) {
                    parsedRelayers.push(typeConverters.convertRelayerToRelayerObject(relayer));
                }
                console.log(parsedRelayers);
                insertDataScripts
                    .insertMultipleRows('relayers', parsedRelayers, Object.keys(relayer.tableProperties))
                    .then((result: any) => {
                        console.log(result);
                        cb();
                    })
                    .catch((err: any) => {
                        console.log(err);
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
        pullDataScripts
            .getTransactionInfo(transactionHash)
            .then((data: any) => {
                const parsedTransaction = typeConverters.convertLogTransactionToTransactionObject(data);
                insertDataScripts
                    .insertSingleRow('transactions', parsedTransaction)
                    .then((result: any) => {
                        cb();
                    })
                    .catch((err: any) => {
                        cb();
                    });
            })
            .catch((err: any) => {
                cb();
            });
    };
}
function _scrapeTokenRegistryToDB(): any {
    return (cb: () => void) => {
        pullDataScripts
            .getTokenRegistry()
            .then((data: any) => {
                const parsedTokens: any = [];
                for (const token of data) {
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
function _scrapeMetaMaskEthContractMetadataToDB(): any {
    return (cb: () => void) => {
        pullDataScripts
            .getMetaMaskTokens()
            .then((data: any) => {
                const parsedTokens: any = [];
                const dataArray = _.map(_.keys(data), (tokenAddress: string) => {
                    const value = _.get(data, tokenAddress);
                    return {
                        address: tokenAddress,
                        ...value,
                    };
                });
                const erc20TokensOnly = _.filter(dataArray, entry => {
                    const isErc20 = _.get(entry, 'erc20');
                    return isErc20;
                });
                for (const token of erc20TokensOnly) {
                    parsedTokens.push(typeConverters.convertMetaMaskTokenToTokenObject(token));
                }
                insertDataScripts.insertMultipleRows('tokens', parsedTokens, Object.keys(parsedTokens[0]));
                cb();
            })
            .catch((err: any) => {
                cb();
            });
    };
}
function _scrapeEthplorerTopTokensToDB(): any {
    return (cb: () => void) => {
        pullDataScripts
            .getEthplorerTopTokens()
            .then((data: any) => {
                const parsedTokens: any = [];
                const tokens = _.get(data, 'tokens');
                for (const token of tokens) {
                    parsedTokens.push(typeConverters.convertMetaMaskTokenToTokenObject(token));
                }
                insertDataScripts.insertMultipleRows('tokens', parsedTokens, Object.keys(parsedTokens[0]));
                cb();
            })
            .catch((err: any) => {
                cb();
            });
    };
}
function _scrapeUnknownTokenInformationToDB(): any {
    return (cb: () => void) => {
        postgresClient
            .query(dataFetchingQueries.get_top_unknown_token_addresses)
            .then(async (result: any) => {
                const addresses = _.map(result.rows, row => _.get(row, 'address'));
                const responses = await Promise.all(
                    _.map(addresses, address => pullDataScripts.getEthplorerToken(address)),
                );
                const tokens = _.filter(responses, response => _.isUndefined(_.get(response, 'error')));
                const parsedTokens = _.map(tokens, tokenInfo =>
                    typeConverters.convertEthplorerTokenToTokenObject(tokenInfo),
                );
                insertDataScripts.insertMultipleRows('tokens', parsedTokens, Object.keys(parsedTokens[0]));
                cb();
            })
            .catch((err: any) => {
                cb();
            });
    };
}
function _scrapePriceToDB(timestamp: number, token: any, timeDelay?: number): any {
    return (cb: () => void) => {
        pullDataScripts
            .getPriceData(token.symbol, timestamp, timeDelay)
            .then((data: any) => {
                const safeSymbol = token.symbol === 'WETH' ? 'ETH' : token.symbol;
                const parsedPrice = {
                    timestamp: timestamp / 1000,
                    symbol: token.symbol,
                    base: 'USD',
                    price: _.has(data[safeSymbol], 'USD') ? data[safeSymbol].USD : 0,
                };
                console.debug('Inserting ' + timestamp);
                console.debug(parsedPrice);
                insertDataScripts.insertSingleRow('prices', parsedPrice);
                cb();
            })
            .catch((err: any) => {
                console.debug(err);
                cb();
            });
    };
}
// function _scrapeHistoricalPricesToDB(token: any, fromTimestamp: number, toTimestamp: number): any {
//     return (cb: () => void) => {
//         pullDataScripts
//             .getHistoricalPrices(token, BASE_SYMBOL, fromTimestamp, toTimestamp)
//             .then((data: any) => {
//                 const parsedHistoricalPrices: any = [];
//                 for (const historicalPrice of data['Data']) {
//                     const parsedHistoricalPrice = typeConverters.convertLogHistoricalPricesToHistoricalPricesObject(historicalPrice);
//                     parsedHistoricalPrice['token'] = token;
//                     parsedHistoricalPrice['base'] = BASE_SYMBOL;
//                     parsedHistoricalPrices.push(parsedHistoricalPrice);
//                 }
//                 if (parsedHistoricalPrices.length > 0) {
//                     insertDataScripts
//                         .insertMultipleRows(
//                             'historical_prices',
//                             parsedHistoricalPrices,
//                             Object.keys(parsedHistoricalPrices[0]),
//                         )
//                         .catch((error: any) => {
//                             console.error(error);
//                         });
//                 }
//                 cb();
//             })
//             .catch((error: any) => {
//                 console.error(error);
//                 cb();
//             });
//     };
// }
function _scrapeOrderBookToDB(id: string, sraEndpoint: string): any {
    return (cb: () => void) => {
        pullDataScripts
            .getOrderBook(sraEndpoint)
            .then((data: any) => {
                for (const book of data) {
                    for (const order of book.bids) {
                        console.debug(order);
                        const parsedOrder = typeConverters.convertLogOrderToOrderObject(order);
                        parsedOrder.relayer_id = id;
                        parsedOrder.order_hash = ZeroEx.getOrderHashHex(order);
                        insertDataScripts.insertSingleRow('orders', parsedOrder).catch((error: any) => {
                            console.error(error);
                        });
                    }
                    for (const order of book.asks) {
                        console.debug(order);
                        const parsedOrder = typeConverters.convertLogOrderToOrderObject(order);
                        parsedOrder.relayer_id = id;
                        parsedOrder.order_hash = ZeroEx.getOrderHashHex(order);
                        insertDataScripts.insertSingleRow('orders', parsedOrder).catch((error: any) => {
                            console.error(error);
                        });
                    }
                }
                cb();
            })
            .catch((error: any) => {
                console.error(error);
                cb();
            });
    };
}
if (cli.type === 'events') {
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
} else if (cli.type === 'blocks') {
    if (cli.from && cli.to) {
        if (cli.force) {
            const destToBlock = cli.to ? cli.to : cli.from;
            let curFromBlock = cli.from;
            const curToBlock = curFromBlock;
            for (; curFromBlock < destToBlock; curFromBlock++) {
                q.push(_scrapeBlockToDB(curFromBlock));
            }
        } else {
            const fetchFrom = cli.from;
            const fetchTo = cli.to ? cli.to : cli.from + 1;
            postgresClient
                .query(dataFetchingQueries.get_used_block_numbers, [fetchFrom, fetchTo])
                .then((data: any) => {
                    for (const row of data.rows) {
                        q.push(_scrapeBlockToDB(row.block_number));
                    }
                })
                .catch((err: any) => {
                    // console.debug(err);
                });
        }
    }
} else if (cli.type === 'transactions') {
    if (cli.id) {
        q.push(_scrapeTransactionToDB(cli.id));
    } else if (cli.from) {
        const fetchFrom = cli.from;
        const fetchTo = cli.to ? cli.to : cli.from + 1;
        postgresClient
            .query(dataFetchingQueries.get_missing_txn_hashes, [fetchFrom, fetchTo])
            .then((data: any) => {
                for (const row of data.rows) {
                    q.push(_scrapeTransactionToDB(row.txn_hash));
                }
            })
            .catch((err: any) => {
                // console.debug(err);
            });
    }
} else if (cli.type === 'tokens') {
    q.push(_scrapeMetaMaskEthContractMetadataToDB());
    q.push(_scrapeEthplorerTopTokensToDB());
} else if (cli.type === 'unknown_tokens') {
    q.push(_scrapeUnknownTokenInformationToDB());
} else if (cli.type === 'prices' && cli.from && cli.to) {
    const fromDate = new Date(cli.from);
    console.debug(fromDate);
    fromDate.setUTCHours(0);
    fromDate.setUTCMinutes(0);
    fromDate.setUTCSeconds(0);
    fromDate.setUTCMilliseconds(0);
    console.debug(fromDate);
    const toDate = new Date(cli.to);
    postgresClient
        .query(dataFetchingQueries.get_token_registry, [])
        .then((result: any) => {
            for (const curDate = fromDate; curDate < toDate; curDate.setDate(curDate.getDate() + 1)) {
                for (const token of Object.values(result.rows)) {
                    console.debug('Scraping ' + curDate + ' ' + token);
                    q.push(_scrapePriceToDB(curDate.getTime(), token));
                }
            }
        })
        .catch((err: any) => {
            console.debug(err);
        });
    // } else if (cli.type === 'historical_prices') {
    //     if (cli.token && cli.from && cli.to) {
    //         q.push(_scrapeHistoricalPricesToDB(cli.token, cli.from, cli.to));
    //     }
    // } else if (cli.type === 'all_historical_prices') {
    //     if (cli.from && cli.to) {
    //         postgresClient
    //             .query(dataFetchingQueries.get_token_registry, [])
    //             .then((result: any) => {
    //                 const curTokens: any = result.rows.map((a: any): any => a.symbol);
    //                 for (const curToken of curTokens) {
    //                     console.debug('Historical data backfill: Pushing coin ' + curToken);
    //                     q.push(_scrapeHistoricalPricesToDB(curToken, cli.from, cli.to));
    //                 }
    //             })
    //             .catch((err: any) => {
    //                 console.debug(err);
    //             });
    //     }
} else if (cli.type === 'relayers') {
    q.push(_scrapeAllRelayersToDB());
} else if (cli.type === 'orders') {
    postgresClient.query(dataFetchingQueries.get_relayers, []).then((result: any) => {
        for (const relayer of result.rows) {
            if (relayer.sra_http_url) {
                q.push(_scrapeOrderBookToDB(relayer.id, relayer.sra_http_url));
            }
        }
    });
}
