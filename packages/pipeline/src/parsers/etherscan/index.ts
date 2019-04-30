import { BigNumber } from '@0x/utils';
import * as R from 'ramda';

import { EtherscanTransactionResponse } from '../../data_sources/etherscan';
import { EtherscanTransaction } from '../../entities';

/**
 * Parses an Etherscan response from the Etherscan API and returns an array of
 * EtherscanTransaction entities.
 * @param rawTrades A raw order response from an SRA endpoint.
 */
export function parseEtherscanTransactions(rawTransactions: EtherscanTransactionResponse[]): EtherscanTransaction[] {
    return R.map(_parseEtherscanTransaction, rawTransactions);
}

/**
 * Converts a single Etherscan transction into an EtherscanTransaction entity.
 * @param rawTx A single Etherscan transaction from the Etherscan API.
 */
export function _parseEtherscanTransaction(rawTx: EtherscanTransactionResponse): EtherscanTransaction {
    const parsedTx = new EtherscanTransaction();
    parsedTx.blockNumber = new BigNumber(rawTx.blockNumber);
    parsedTx.timeStamp = new BigNumber(rawTx.timeStamp);
    parsedTx.hash = rawTx.hash;
    parsedTx.blockHash = rawTx.blockHash;
    parsedTx.transactionIndex = Number(rawTx.transactionIndex);
    parsedTx.nonce = Number(rawTx.nonce);
    parsedTx.from = rawTx.from;
    parsedTx.to = rawTx.to;
    parsedTx.value = new BigNumber(rawTx.value);
    parsedTx.gas = new BigNumber(rawTx.gas);
    parsedTx.gasPrice = new BigNumber(rawTx.gasPrice);
    parsedTx.isError = rawTx.isError === '0' ? false : true;
    parsedTx.txreceiptStatus = rawTx.txreceipt_status;
    parsedTx.input = rawTx.input;
    parsedTx.contractAddress = rawTx.contractAddress;
    parsedTx.cumulativeGasUsed = new BigNumber(rawTx.cumulativeGasUsed);
    parsedTx.gasUsed = new BigNumber(rawTx.gasUsed);
    parsedTx.confirmations = new BigNumber(rawTx.confirmations);

    return parsedTx;
}
