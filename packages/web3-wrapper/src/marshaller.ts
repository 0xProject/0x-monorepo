import { addressUtils, BigNumber } from '@0xproject/utils';
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

import { utils } from './utils';

import {
    AbstractBlockRPC,
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
            gasLimit: utils.convertHexToNumber(blockWithHexValues.gasLimit),
            gasUsed: utils.convertHexToNumber(blockWithHexValues.gasUsed),
            size: utils.convertHexToNumber(blockWithHexValues.size),
            timestamp: utils.convertHexToNumber(blockWithHexValues.timestamp),
            number: _.isNull(blockWithHexValues.number) ? null : utils.convertHexToNumber(blockWithHexValues.number),
            difficulty: utils.convertAmountToBigNumber(blockWithHexValues.difficulty),
            totalDifficulty: utils.convertAmountToBigNumber(blockWithHexValues.totalDifficulty),
        };
        return block;
    },
    unmarshalIntoBlockWithTransactionData(blockWithHexValues: BlockWithTransactionDataRPC): BlockWithTransactionData {
        const block = {
            ...blockWithHexValues,
            gasLimit: utils.convertHexToNumber(blockWithHexValues.gasLimit),
            gasUsed: utils.convertHexToNumber(blockWithHexValues.gasUsed),
            size: utils.convertHexToNumber(blockWithHexValues.size),
            timestamp: utils.convertHexToNumber(blockWithHexValues.timestamp),
            number: _.isNull(blockWithHexValues.number) ? null : utils.convertHexToNumber(blockWithHexValues.number),
            difficulty: utils.convertAmountToBigNumber(blockWithHexValues.difficulty),
            totalDifficulty: utils.convertAmountToBigNumber(blockWithHexValues.totalDifficulty),
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
            blockNumber: !_.isNull(txRpc.blockNumber) ? utils.convertHexToNumber(txRpc.blockNumber) : null,
            transactionIndex: !_.isNull(txRpc.transactionIndex)
                ? utils.convertHexToNumber(txRpc.transactionIndex)
                : null,
            nonce: utils.convertHexToNumber(txRpc.nonce),
            gas: utils.convertHexToNumber(txRpc.gas),
            gasPrice: utils.convertAmountToBigNumber(txRpc.gasPrice),
            value: utils.convertAmountToBigNumber(txRpc.value),
        };
        return tx;
    },
    marshalTxData(txData: Partial<TxData>): Partial<TxDataRPC> {
        if (_.isUndefined(txData.from)) {
            throw new Error(`txData is missing required "from" address.`);
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
        const encodedBlockParam = _.isNumber(blockParam) ? utils.numberToHex(blockParam) : blockParam;
        return encodedBlockParam;
    },
    unmarshalLog(rawLog: RawLogEntry): LogEntry {
        const formattedLog = {
            ...rawLog,
            logIndex: utils.convertHexToNumberOrNull(rawLog.logIndex),
            blockNumber: utils.convertHexToNumberOrNull(rawLog.blockNumber),
            transactionIndex: utils.convertHexToNumberOrNull(rawLog.transactionIndex),
        };
        return formattedLog;
    },
    _marshalCallTxDataBase(callTxDataBase: Partial<CallTxDataBase>): Partial<CallTxDataBaseRPC> {
        const callTxDataBaseRPC = {
            ...callTxDataBase,
            to: _.isUndefined(callTxDataBase.to) ? undefined : this.marshalAddress(callTxDataBase.to),
            gasPrice: _.isUndefined(callTxDataBase.gasPrice)
                ? undefined
                : utils.encodeAmountAsHexString(callTxDataBase.gasPrice),
            gas: _.isUndefined(callTxDataBase.gas) ? undefined : utils.encodeAmountAsHexString(callTxDataBase.gas),
            value: _.isUndefined(callTxDataBase.value)
                ? undefined
                : utils.encodeAmountAsHexString(callTxDataBase.value),
            nonce: _.isUndefined(callTxDataBase.nonce)
                ? undefined
                : utils.encodeAmountAsHexString(callTxDataBase.nonce),
        };

        return callTxDataBaseRPC;
    },
};
