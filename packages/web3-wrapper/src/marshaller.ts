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
import web3Utils = require('web3-utils');

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
            gasLimit: web3Utils.toDecimal(blockWithHexValues.gasLimit),
            gasUsed: web3Utils.toDecimal(blockWithHexValues.gasUsed),
            size: web3Utils.toDecimal(blockWithHexValues.size),
            timestamp: web3Utils.toDecimal(blockWithHexValues.timestamp),
            number: _.isNull(blockWithHexValues.number) ? null : web3Utils.toDecimal(blockWithHexValues.number),
            difficulty: this._convertAmountToBigNumber(blockWithHexValues.difficulty),
            totalDifficulty: this._convertAmountToBigNumber(blockWithHexValues.totalDifficulty),
        };
        return block;
    },
    unmarshalIntoBlockWithTransactionData(blockWithHexValues: BlockWithTransactionDataRPC): BlockWithTransactionData {
        const block = {
            ...blockWithHexValues,
            gasLimit: web3Utils.toDecimal(blockWithHexValues.gasLimit),
            gasUsed: web3Utils.toDecimal(blockWithHexValues.gasUsed),
            size: web3Utils.toDecimal(blockWithHexValues.size),
            timestamp: web3Utils.toDecimal(blockWithHexValues.timestamp),
            number: _.isNull(blockWithHexValues.number) ? null : web3Utils.toDecimal(blockWithHexValues.number),
            difficulty: this._convertAmountToBigNumber(blockWithHexValues.difficulty),
            totalDifficulty: this._convertAmountToBigNumber(blockWithHexValues.totalDifficulty),
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
            blockNumber: !_.isNull(txRpc.blockNumber) ? web3Utils.toDecimal(txRpc.blockNumber) : null,
            transactionIndex: !_.isNull(txRpc.transactionIndex) ? web3Utils.toDecimal(txRpc.transactionIndex) : null,
            nonce: web3Utils.toDecimal(txRpc.nonce),
            gas: web3Utils.toDecimal(txRpc.gas),
            gasPrice: this._convertAmountToBigNumber(txRpc.gasPrice),
            value: this._convertAmountToBigNumber(txRpc.value),
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
        const encodedBlockParam = _.isNumber(blockParam) ? web3Utils.toHex(blockParam) : blockParam;
        return encodedBlockParam;
    },
    unmarshalLog(rawLog: RawLogEntry): LogEntry {
        const formattedLog = {
            ...rawLog,
            logIndex: this.convertHexToNumberOrNull(rawLog.logIndex),
            blockNumber: this.convertHexToNumberOrNull(rawLog.blockNumber),
            transactionIndex: this.convertHexToNumberOrNull(rawLog.transactionIndex),
        };
        return formattedLog;
    },
    _marshalCallTxDataBase(callTxDataBase: Partial<CallTxDataBase>): Partial<CallTxDataBaseRPC> {
        const callTxDataBaseRPC = {
            ...callTxDataBase,
            to: _.isUndefined(callTxDataBase.to) ? undefined : this.marshalAddress(callTxDataBase.to),
            gasPrice: _.isUndefined(callTxDataBase.gasPrice)
                ? undefined
                : this._encodeAmountAsHexString(callTxDataBase.gasPrice),
            gas: _.isUndefined(callTxDataBase.gas) ? undefined : this._encodeAmountAsHexString(callTxDataBase.gas),
            value: _.isUndefined(callTxDataBase.value)
                ? undefined
                : this._encodeAmountAsHexString(callTxDataBase.value),
            nonce: _.isUndefined(callTxDataBase.nonce)
                ? undefined
                : this._encodeAmountAsHexString(callTxDataBase.nonce),
        };

        return callTxDataBaseRPC;
    },
    convertHexToNumberOrNull(hex: string | null): number | null {
        if (_.isNull(hex)) {
            return null;
        }
        const decimal = web3Utils.toDecimal(hex);
        return decimal;
    },
    _convertAmountToBigNumber(value: string | number | BigNumber): BigNumber {
        const num = value || 0;
        const isBigNumber = utils.isBigNumber(num);
        if (isBigNumber) {
            return num as BigNumber;
        }

        if (_.isString(num) && (num.indexOf('0x') === 0 || num.indexOf('-0x') === 0)) {
            return new BigNumber(num.replace('0x', ''), 16);
        }

        const baseTen = 10;
        return new BigNumber((num as number).toString(baseTen), baseTen);
    },
    _encodeAmountAsHexString(value: string | number | BigNumber): string {
        const valueBigNumber = this._convertAmountToBigNumber(value);
        const hexBase = 16;
        const valueHex = valueBigNumber.toString(hexBase);

        return valueBigNumber.lessThan(0) ? '-0x' + valueHex.substr(1) : '0x' + valueHex;
    },
};
