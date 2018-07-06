import { addressUtils, formatUtils } from '@0xproject/utils';
import {
    BlockParam,
    BlockParamLiteral,
    BlockWithoutTransactionData,
    BlockWithTransactionData,
    CallData,
    CallTxDataBase,
    LogEntry,
    RawLogEntry,
    Transaction,
    TxData,
} from 'ethereum-types';
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';

import {
    BlockWithoutTransactionDataRPC,
    BlockWithTransactionDataRPC,
    CallDataRPC,
    CallTxDataBaseRPC,
    TransactionRPC,
    TxDataRPC,
} from './types';

export const marshaller = {
    unmarshalIntoBlockWithoutTransactionData(
        blockWithHexValues: BlockWithoutTransactionDataRPC,
    ): BlockWithoutTransactionData {
        const block = {
            ...blockWithHexValues,
            gasLimit: formatUtils.convertHexToNumber(blockWithHexValues.gasLimit),
            gasUsed: formatUtils.convertHexToNumber(blockWithHexValues.gasUsed),
            size: formatUtils.convertHexToNumber(blockWithHexValues.size),
            timestamp: formatUtils.convertHexToNumber(blockWithHexValues.timestamp),
            number: _.isNull(blockWithHexValues.number)
                ? null
                : formatUtils.convertHexToNumber(blockWithHexValues.number),
            difficulty: formatUtils.convertAmountToBigNumber(blockWithHexValues.difficulty),
            totalDifficulty: formatUtils.convertAmountToBigNumber(blockWithHexValues.totalDifficulty),
        };
        return block;
    },
    unmarshalIntoBlockWithTransactionData(blockWithHexValues: BlockWithTransactionDataRPC): BlockWithTransactionData {
        const block = {
            ...blockWithHexValues,
            gasLimit: formatUtils.convertHexToNumber(blockWithHexValues.gasLimit),
            gasUsed: formatUtils.convertHexToNumber(blockWithHexValues.gasUsed),
            size: formatUtils.convertHexToNumber(blockWithHexValues.size),
            timestamp: formatUtils.convertHexToNumber(blockWithHexValues.timestamp),
            number: _.isNull(blockWithHexValues.number)
                ? null
                : formatUtils.convertHexToNumber(blockWithHexValues.number),
            difficulty: formatUtils.convertAmountToBigNumber(blockWithHexValues.difficulty),
            totalDifficulty: formatUtils.convertAmountToBigNumber(blockWithHexValues.totalDifficulty),
            transactions: [] as Transaction[],
        };
        block.transactions = _.map(blockWithHexValues.transactions, (tx: TransactionRPC) => {
            const transaction = this.unmarshalTransaction(tx);
            return transaction;
        });
        return block;
    },
    unmarshalTransaction(txRpc: TransactionRPC): Transaction {
        const tx = {
            ...txRpc,
            blockNumber: !_.isNull(txRpc.blockNumber) ? formatUtils.convertHexToNumber(txRpc.blockNumber) : null,
            transactionIndex: !_.isNull(txRpc.transactionIndex)
                ? formatUtils.convertHexToNumber(txRpc.transactionIndex)
                : null,
            nonce: formatUtils.convertHexToNumber(txRpc.nonce),
            gas: formatUtils.convertHexToNumber(txRpc.gas),
            gasPrice: formatUtils.convertAmountToBigNumber(txRpc.gasPrice),
            value: formatUtils.convertAmountToBigNumber(txRpc.value),
        };
        return tx;
    },
    unmarshalTxData(txDataRpc: TxDataRPC): TxData {
        if (_.isUndefined(txDataRpc.from)) {
            throw new Error(`txData must include valid 'from' value.`);
        }
        const txData = {
            ...txDataRpc,
            value: !_.isUndefined(txDataRpc.value) ? formatUtils.convertHexToNumber(txDataRpc.value) : undefined,
            gas: !_.isUndefined(txDataRpc.gas) ? formatUtils.convertHexToNumber(txDataRpc.gas) : undefined,
            gasPrice: !_.isUndefined(txDataRpc.gasPrice)
                ? formatUtils.convertHexToNumber(txDataRpc.gasPrice)
                : undefined,
            nonce: !_.isUndefined(txDataRpc.nonce) ? formatUtils.convertHexToNumber(txDataRpc.nonce) : undefined,
        };
        return txData;
    },
    marshalTxData(txData: Partial<TxData>): Partial<TxDataRPC> {
        if (_.isUndefined(txData.from)) {
            throw new Error(`txData must include valid 'from' value.`);
        }
        const callTxDataBase = {
            ...txData,
        };
        delete callTxDataBase.from;
        const callTxDataBaseRPC = this._marshalCallTxDataBase(callTxDataBase);
        const txDataRPC = {
            ...callTxDataBaseRPC,
            from: this.marshalAddress(txData.from),
        };
        const prunableIfUndefined = ['gasPrice', 'gas', 'value', 'nonce'];
        _.each(txDataRPC, (value: any, key: string) => {
            if (_.isUndefined(value) && _.includes(prunableIfUndefined, key)) {
                delete (txDataRPC as any)[key];
            }
        });
        return txDataRPC;
    },
    marshalCallData(callData: Partial<CallData>): Partial<CallDataRPC> {
        const callTxDataBase = {
            ...callData,
        };
        delete callTxDataBase.from;
        const callTxDataBaseRPC = this._marshalCallTxDataBase(callTxDataBase);
        const callDataRPC = {
            ...callTxDataBaseRPC,
            from: _.isUndefined(callData.from) ? undefined : this.marshalAddress(callData.from),
        };
        return callDataRPC;
    },
    marshalAddress(address: string): string {
        if (addressUtils.isAddress(address)) {
            return ethUtil.addHexPrefix(address);
        }
        throw new Error(`Invalid address encountered: ${address}`);
    },
    marshalBlockParam(blockParam: BlockParam | string | number | undefined): string | undefined {
        if (_.isUndefined(blockParam)) {
            return BlockParamLiteral.Latest;
        }
        const encodedBlockParam = _.isNumber(blockParam) ? formatUtils.numberToHex(blockParam) : blockParam;
        return encodedBlockParam;
    },
    unmarshalLog(rawLog: RawLogEntry): LogEntry {
        const formattedLog = {
            ...rawLog,
            logIndex: formatUtils.convertHexToNumberOrNull(rawLog.logIndex),
            blockNumber: formatUtils.convertHexToNumberOrNull(rawLog.blockNumber),
            transactionIndex: formatUtils.convertHexToNumberOrNull(rawLog.transactionIndex),
        };
        return formattedLog;
    },
    _marshalCallTxDataBase(callTxDataBase: Partial<CallTxDataBase>): Partial<CallTxDataBaseRPC> {
        const callTxDataBaseRPC = {
            ...callTxDataBase,
            to: _.isUndefined(callTxDataBase.to) ? undefined : this.marshalAddress(callTxDataBase.to),
            gasPrice: _.isUndefined(callTxDataBase.gasPrice)
                ? undefined
                : formatUtils.encodeAmountAsHexString(callTxDataBase.gasPrice),
            gas: _.isUndefined(callTxDataBase.gas)
                ? undefined
                : formatUtils.encodeAmountAsHexString(callTxDataBase.gas),
            value: _.isUndefined(callTxDataBase.value)
                ? undefined
                : formatUtils.encodeAmountAsHexString(callTxDataBase.value),
            nonce: _.isUndefined(callTxDataBase.nonce)
                ? undefined
                : formatUtils.encodeAmountAsHexString(callTxDataBase.nonce),
        };

        return callTxDataBaseRPC;
    },
};
