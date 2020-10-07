import { addressUtils } from '@0x/utils';
import {
    BlockParam,
    BlockParamLiteral,
    BlockWithoutTransactionData,
    BlockWithTransactionData,
    CallData,
    CallTxDataBase,
    GethCallOverrides,
    LogEntry,
    RawLogEntry,
    Transaction,
    TransactionReceipt,
    TxData,
} from 'ethereum-types';
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';

import {
    BlockWithoutTransactionDataRPC,
    BlockWithTransactionDataRPC,
    CallDataRPC,
    CallTxDataBaseRPC,
    GethCallOverridesRPC,
    TransactionReceiptRPC,
    TransactionRPC,
    TxDataRPC,
} from './types';
import { utils } from './utils';

/**
 * Utils to convert ethereum structures from user-space format to RPC format. (marshall/unmarshall)
 */
export const marshaller = {
    /**
     * Unmarshall block without transaction data
     * @param blockWithHexValues block to unmarshall
     * @return unmarshalled block without transaction data
     */
    unmarshalIntoBlockWithoutTransactionData(
        blockWithHexValues: BlockWithoutTransactionDataRPC,
    ): BlockWithoutTransactionData {
        const block = {
            ...blockWithHexValues,
            gasLimit: utils.convertHexToNumber(blockWithHexValues.gasLimit),
            gasUsed: utils.convertHexToNumber(blockWithHexValues.gasUsed),
            size: utils.convertHexToNumber(blockWithHexValues.size),
            timestamp: utils.convertHexToNumber(blockWithHexValues.timestamp),
            number: blockWithHexValues.number === null ? null : utils.convertHexToNumber(blockWithHexValues.number),
            difficulty: utils.convertAmountToBigNumber(blockWithHexValues.difficulty),
            totalDifficulty: utils.convertAmountToBigNumber(blockWithHexValues.totalDifficulty),
        };
        return block;
    },
    /**
     * Unmarshall block with transaction data
     * @param blockWithHexValues block to unmarshall
     * @return unmarshalled block with transaction data
     */
    unmarshalIntoBlockWithTransactionData(blockWithHexValues: BlockWithTransactionDataRPC): BlockWithTransactionData {
        const block = {
            ...blockWithHexValues,
            gasLimit: utils.convertHexToNumber(blockWithHexValues.gasLimit),
            gasUsed: utils.convertHexToNumber(blockWithHexValues.gasUsed),
            size: utils.convertHexToNumber(blockWithHexValues.size),
            timestamp: utils.convertHexToNumber(blockWithHexValues.timestamp),
            number: blockWithHexValues.number === null ? null : utils.convertHexToNumber(blockWithHexValues.number),
            difficulty: utils.convertAmountToBigNumber(blockWithHexValues.difficulty),
            totalDifficulty: utils.convertAmountToBigNumber(blockWithHexValues.totalDifficulty),
            transactions: [] as Transaction[],
        };
        block.transactions = _.map(blockWithHexValues.transactions, (tx: TransactionRPC) => {
            const transaction = marshaller.unmarshalTransaction(tx);
            return transaction;
        });
        return block;
    },
    /**
     * Unmarshall transaction
     * @param txRpc transaction to unmarshall
     * @return unmarshalled transaction
     */
    unmarshalTransaction(txRpc: TransactionRPC): Transaction {
        const tx = {
            ...txRpc,
            blockNumber: txRpc.blockNumber !== null ? utils.convertHexToNumber(txRpc.blockNumber) : null,
            transactionIndex: txRpc.transactionIndex !== null ? utils.convertHexToNumber(txRpc.transactionIndex) : null,
            nonce: utils.convertHexToNumber(txRpc.nonce),
            gas: utils.convertHexToNumber(txRpc.gas),
            gasPrice: utils.convertAmountToBigNumber(txRpc.gasPrice),
            value: utils.convertAmountToBigNumber(txRpc.value),
        };
        return tx;
    },
    /**
     * Unmarshall transaction receipt
     * @param txReceiptRpc transaction receipt to unmarshall
     * @return unmarshalled transaction receipt
     */
    unmarshalTransactionReceipt(txReceiptRpc: TransactionReceiptRPC): TransactionReceipt {
        const txReceipt = {
            ...txReceiptRpc,
            blockNumber: utils.convertHexToNumber(txReceiptRpc.blockNumber),
            transactionIndex: utils.convertHexToNumber(txReceiptRpc.transactionIndex),
            cumulativeGasUsed: utils.convertHexToNumber(txReceiptRpc.cumulativeGasUsed),
            gasUsed: utils.convertHexToNumber(txReceiptRpc.gasUsed),
            logs: _.map(txReceiptRpc.logs, marshaller.unmarshalLog.bind(marshaller)),
        };
        return txReceipt;
    },
    /**
     * Unmarshall transaction data
     * @param txDataRpc transaction data to unmarshall
     * @return unmarshalled transaction data
     */
    unmarshalTxData(txDataRpc: TxDataRPC): TxData {
        if (txDataRpc.from === undefined) {
            throw new Error(`txData must include valid 'from' value.`);
        }
        const txData = {
            ...txDataRpc,
            value: txDataRpc.value !== undefined ? utils.convertAmountToBigNumber(txDataRpc.value) : undefined,
            gas: txDataRpc.gas !== undefined ? utils.convertHexToNumber(txDataRpc.gas) : undefined,
            gasPrice: txDataRpc.gasPrice !== undefined ? utils.convertAmountToBigNumber(txDataRpc.gasPrice) : undefined,
            nonce: txDataRpc.nonce !== undefined ? utils.convertHexToNumber(txDataRpc.nonce) : undefined,
        };
        return txData;
    },
    /**
     * Marshall transaction data
     * @param txData transaction data to marshall
     * @return marshalled transaction data
     */
    marshalTxData(txData: Partial<TxData>): Partial<TxDataRPC> {
        if (txData.from === undefined) {
            throw new Error(`txData must include valid 'from' value.`);
        }
        const callTxDataBase = {
            ...txData,
        };
        delete callTxDataBase.from;
        const callTxDataBaseRPC = marshaller._marshalCallTxDataBase(callTxDataBase);
        const txDataRPC = {
            ...callTxDataBaseRPC,
            from: marshaller.marshalAddress(txData.from),
        };
        const prunableIfUndefined = ['gasPrice', 'gas', 'value', 'nonce'];
        _.each(txDataRPC, (value: any, key: string) => {
            if (value === undefined && _.includes(prunableIfUndefined, key)) {
                delete (txDataRPC as any)[key];
            }
        });
        return txDataRPC;
    },
    /**
     * Marshall call data
     * @param callData call data to marshall
     * @return marshalled call data
     */
    marshalCallData(callData: Partial<CallData>): Partial<CallDataRPC> {
        const callTxDataBase = {
            ...callData,
        };
        delete callTxDataBase.from;
        delete callTxDataBase.overrides;
        const callTxDataBaseRPC = marshaller._marshalCallTxDataBase(callTxDataBase);
        const callDataRPC = {
            ...callTxDataBaseRPC,
            from: callData.from === undefined ? undefined : marshaller.marshalAddress(callData.from),
        };
        return callDataRPC;
    },
    /**
     * Marshall call overrides parameter for for a geth eth_call.
     * @param overrides overrides to marshal
     * @return marshalled overrides
     */
    marshalCallOverrides(overrides: GethCallOverrides): GethCallOverridesRPC {
        const marshalled: GethCallOverridesRPC = {};
        for (const address in overrides) {
            if (address) {
                const override = overrides[address];
                const marshalledAddress = marshaller.marshalAddress(address);
                const marshalledOverride: GethCallOverridesRPC[keyof GethCallOverridesRPC] = (marshalled[
                    marshalledAddress
                ] = {});
                if (override.code !== undefined) {
                    marshalledOverride.code = override.code;
                }
                if (override.nonce !== undefined) {
                    marshalledOverride.nonce = utils.encodeAmountAsHexString(override.nonce);
                }
                if (override.balance !== undefined) {
                    marshalledOverride.balance = utils.encodeAmountAsHexString(override.balance);
                }
                if (Object.keys(marshalledOverride).length === 0) {
                    delete marshalled[marshalledAddress];
                }
            }
        }
        return marshalled;
    },
    /**
     * Marshall address
     * @param address address to marshall
     * @return marshalled address
     */
    marshalAddress(address: string): string {
        if (addressUtils.isAddress(address)) {
            return ethUtil.addHexPrefix(address);
        }
        throw new Error(`Invalid address encountered: ${address}`);
    },
    /**
     * Marshall block param
     * @param blockParam block param to marshall
     * @return marshalled block param
     */
    marshalBlockParam(blockParam: BlockParam | string | number | undefined): string | undefined {
        if (blockParam === undefined) {
            return BlockParamLiteral.Latest;
        }
        const encodedBlockParam = _.isNumber(blockParam) ? utils.numberToHex(blockParam) : blockParam;
        return encodedBlockParam;
    },
    /**
     * Unmarshall log
     * @param rawLog log to unmarshall
     * @return unmarshalled log
     */
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
            to: callTxDataBase.to === undefined ? undefined : marshaller.marshalAddress(callTxDataBase.to),
            gasPrice:
                callTxDataBase.gasPrice === undefined
                    ? undefined
                    : utils.encodeAmountAsHexString(callTxDataBase.gasPrice),
            gas: callTxDataBase.gas === undefined ? undefined : utils.encodeAmountAsHexString(callTxDataBase.gas),
            value: callTxDataBase.value === undefined ? undefined : utils.encodeAmountAsHexString(callTxDataBase.value),
            nonce: callTxDataBase.nonce === undefined ? undefined : utils.encodeAmountAsHexString(callTxDataBase.nonce),
        };

        return callTxDataBaseRPC;
    },
};
