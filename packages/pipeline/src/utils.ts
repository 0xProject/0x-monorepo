import * as _ from 'lodash';

import { block, logToBlockSchemaMapping } from './models/block';
import { event, logToEventSchemaMapping } from './models/event';
import { historicalPrices, logToHistoricalPricesSchema } from './models/historical_prices';
import { logToOrderSchemaMapping, order } from './models/order';
import { logToRelayerSchemaMapping } from './models/relayer';
import { logToTokenSchemaMapping, token } from './models/tokens';
import { logToTransactionSchemaMapping, transaction } from './models/transaction';
export const typeConverters = {
    convertLogEventToEventObject(log: any): any {
        const newEvent: any = {};
        for (const key in logToEventSchemaMapping) {
            if (_.has(log, key)) {
                newEvent[logToEventSchemaMapping[key]] = _.get(log, key);
                if (newEvent[logToEventSchemaMapping[key]].constructor.name === 'BigNumber') {
                    newEvent[logToEventSchemaMapping[key]] = newEvent[logToEventSchemaMapping[key]].toString();
                }
            }
        }
        return newEvent;
    },
    convertLogBlockToBlockObject(logBlock: any): any {
        const newBlock: any = {};
        for (const key in logToBlockSchemaMapping) {
            if (_.has(logBlock, key)) {
                newBlock[logToBlockSchemaMapping[key]] = _.get(logBlock, key);
                if (newBlock[logToBlockSchemaMapping[key]].constructor.name === 'BigNumber') {
                    newBlock[logToBlockSchemaMapping[key]] = newBlock[logToBlockSchemaMapping[key]].toString();
                }
            }
        }
        return newBlock;
    },
    convertLogTokenToTokenObject(logToken: any): any {
        const newToken: any = {};
        for (const key in logToTokenSchemaMapping) {
            if (_.has(logToken, key)) {
                newToken[logToTokenSchemaMapping[key]] = _.get(logToken, key);
                if (newToken[logToTokenSchemaMapping[key]].constructor.name === 'BigNumber') {
                    newToken[logToTokenSchemaMapping[key]] = newToken[logToTokenSchemaMapping[key]].toString();
                }
            }
        }
        newToken[logToTokenSchemaMapping.address] = newToken[logToTokenSchemaMapping.address].toLowerCase();
        return newToken;
    },
    convertMetaMaskTokenToTokenObject(metaMaskToken: any): any {
        const newToken: any = {};
        for (const key in logToTokenSchemaMapping) {
            if (_.has(metaMaskToken, key)) {
                newToken[logToTokenSchemaMapping[key]] = _.get(metaMaskToken, key);
            }
        }
        newToken[logToTokenSchemaMapping.address] = newToken[logToTokenSchemaMapping.address].toLowerCase();
        console.log(newToken);
        return newToken;
    },
    convertEthplorerTokenToTokenObject(ethplorerToken: any): any {
        const newToken: any = {};
        for (const key in logToTokenSchemaMapping) {
            if (_.has(ethplorerToken, key)) {
                newToken[logToTokenSchemaMapping[key]] = _.get(ethplorerToken, key);
            }
        }
        newToken[logToTokenSchemaMapping.address] = newToken[logToTokenSchemaMapping.address].toLowerCase();
        return newToken;
    },
    convertLogTransactionToTransactionObject(logTransaction: any): any {
        const newTransaction: any = {};
        for (const key in logToTransactionSchemaMapping) {
            if (_.has(logTransaction, key)) {
                newTransaction[logToTransactionSchemaMapping[key]] = _.get(logTransaction, key);
                if (newTransaction[logToTransactionSchemaMapping[key]].constructor.name === 'BigNumber') {
                    newTransaction[logToTransactionSchemaMapping[key]] = newTransaction[
                        logToTransactionSchemaMapping[key]
                    ].toString();
                }
            } else {
                if (key === 'method_id') {
                    newTransaction[logToTransactionSchemaMapping[key]] = logTransaction.input.substring(0, 10);
                } else if (key === 'salt') {
                    newTransaction[logToTransactionSchemaMapping[key]] =
                        '0x' + logTransaction.input.substring(714, 778); // Only God can judge me
                }
            }
        }
        return newTransaction;
    },
    // convertRelayerToRelayerObject(logRelayer: any): any {
    //     const newRelayer: any = {};
    //     for (const key in logToRelayerSchemaMapping) {
    //         if (_.has(logRelayer, key)) {
    //             newRelayer[logToRelayerSchemaMapping[key]] = _.get(logRelayer, key);
    //             if (newRelayer[logToRelayerSchemaMapping[key]].constructor.name === 'BigNumber') {
    //                 newRelayer[logToRelayerSchemaMapping[key]] = newRelayer[logToRelayerSchemaMapping[key]].toString();
    //             }
    //         } else if((logToRelayerSchemaMapping[key] === 'known_fee_addresses' || logToRelayerSchemaMapping[key] === 'known_taker_addresses')) {
    //             newRelayer[logToRelayerSchemaMapping[key]] = '{}';
    //         } else {
    //             newRelayer[logToRelayerSchemaMapping[key]] = '';
    //         }
    //     }
    //     return newRelayer;
    // },
    convertRelayerToRelayerObject(logRelayer: any): any {
        const newRelayer: any = {};
        for (const key in logToRelayerSchemaMapping) {
            if (_.has(logRelayer, key)) {
                newRelayer[logToRelayerSchemaMapping[key]] = _.get(logRelayer, key);
                if (newRelayer[logToRelayerSchemaMapping[key]].constructor.name === 'BigNumber') {
                    newRelayer[logToRelayerSchemaMapping[key]] = newRelayer[logToRelayerSchemaMapping[key]].toString();
                }
            } else if (
                logToRelayerSchemaMapping[key] === 'known_fee_addresses' ||
                logToRelayerSchemaMapping[key] === 'known_taker_addresses'
            ) {
                newRelayer[logToRelayerSchemaMapping[key]] = '{}';
            } else {
                newRelayer[logToRelayerSchemaMapping[key]] = '';
            }
        }
        if (_.has(logRelayer, 'networks')) {
            for (const network of logRelayer.networks) {
                if (network.networkId === 1) {
                    if (_.has(network, 'sra_http_endpoint')) {
                        newRelayer.sra_http_endpoint = network.sra_http_endpoint;
                    }
                    if (_.has(network, 'sra_ws_endpoint')) {
                        newRelayer.sra_ws_endpoint = network.sra_ws_endpoint;
                    }
                    if (_.has(network, 'static_order_fields')) {
                        if (_.has(network, 'static_order_fields.fee_recipient_addresses')) {
                            newRelayer.fee_recipient_addresses = network.static_order_fields.fee_recipient_addresses;
                        }
                        if (_.has(network, 'static_order_fields.taker_addresses')) {
                            newRelayer.taker_addresses = network.static_order_fields.taker_addresses;
                        }
                    }
                }
            }
        }
        return newRelayer;
    },
    convertLogHistoricalPricesToHistoricalPricesObject(logHistoricalPrice: any): any {
        const newHistoricalPrices: any = {};
        for (const key in logToHistoricalPricesSchema) {
            if (_.has(logHistoricalPrice, key)) {
                newHistoricalPrices[logToHistoricalPricesSchema[key]] = _.get(logHistoricalPrice, key);
            }
        }
        return newHistoricalPrices;
    },
    convertLogOrderToOrderObject(logOrder: any): any {
        const newOrder: any = {};
        for (const key in logToOrderSchemaMapping) {
            if (_.has(logOrder, key)) {
                console.log(key);
                console.log(logOrder[key]);
                newOrder[logToOrderSchemaMapping[key]] = _.get(logOrder, key);
                if (newOrder[logToOrderSchemaMapping[key]].constructor.name === 'BigNumber') {
                    newOrder[logToOrderSchemaMapping[key]] = newOrder[logToOrderSchemaMapping[key]].toString();
                }
            }
        }
        console.log(newOrder);
        return newOrder;
    },
};
export const formatters = {
    escapeSQLParams(params: any[]): string {
        let escapedString = '';
        for (const i in params) {
            escapedString += "'" + params[i] + "',";
        }
        return escapedString.slice(0, -1);
    },
    escapeSQLParam(param: string): string {
        return "'" + param + "'";
    },
};
