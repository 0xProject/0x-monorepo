import * as _ from 'lodash';
import { block, logToBlockSchemaMapping } from './models/block';
import { event, logToEventSchemaMapping } from './models/event';
import { transaction, logToTransactionSchemaMapping } from './models/transaction';
import { historicalPrices, logToHistoricalPricesSchema } from './models/historical_prices';
import { token, logToTokenSchemaMapping } from './models/tokens';

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
        return newToken;
    },
    convertLogTransactionToTransactionObject(logTransaction: any): any {
        const newTransaction: any = {};
        for (const key in logToTransactionSchemaMapping) {
            if (_.has(logTransaction, key)) {
                newTransaction[logToTransactionSchemaMapping[key]] = _.get(logTransaction, key);
                if (newTransaction[logToTransactionSchemaMapping[key]].constructor.name === 'BigNumber') {
                    newTransaction[logToTransactionSchemaMapping[key]] = newTransaction[logToTransactionSchemaMapping[key]].toString();
                }
            } else {
                if(key === 'method_id') {
                    newTransaction[logToTransactionSchemaMapping[key]] = logTransaction.input.substring(0, 10);
                } else if(key === 'salt') {
                    newTransaction[logToTransactionSchemaMapping[key]] = "0x" + logTransaction.input.substring(714, 778); // Only God can judge me
                }
            }
        }
        return newTransaction;
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
