import { AbiDecoder } from '@0xproject/abi-decoder';
import { TransactionReceiptWithDecodedLogs } from '@0xproject/types';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';

import { intervalUtils } from './interval_utils';
import { TransactionError } from './types';

export const awaitTransactionMinedAsync = async (
    web3Wrapper: Web3Wrapper,
    abiDecoder: AbiDecoder,
    txHash: string,
    pollingIntervalMs = 1000,
    timeoutMs?: number,
) => {
    let timeoutExceeded = false;
    if (timeoutMs) {
        setTimeout(() => (timeoutExceeded = true), timeoutMs);
    }

    const txReceiptPromise = new Promise((resolve: (receipt: TransactionReceiptWithDecodedLogs) => void, reject) => {
        const intervalId = intervalUtils.setAsyncExcludingInterval(
            async () => {
                if (timeoutExceeded) {
                    intervalUtils.clearAsyncExcludingInterval(intervalId);
                    return reject(TransactionError.TransactionMiningTimeout);
                }

                const transactionReceipt = await web3Wrapper.getTransactionReceiptAsync(txHash);
                if (!_.isNull(transactionReceipt)) {
                    intervalUtils.clearAsyncExcludingInterval(intervalId);
                    const logsWithDecodedArgs = _.map(
                        transactionReceipt.logs,
                        abiDecoder.tryToDecodeLogOrNoop.bind(abiDecoder),
                    );
                    const transactionReceiptWithDecodedLogArgs: TransactionReceiptWithDecodedLogs = {
                        ...transactionReceipt,
                        logs: logsWithDecodedArgs,
                    };
                    resolve(transactionReceiptWithDecodedLogArgs);
                }
            },
            pollingIntervalMs,
            (err: Error) => {
                intervalUtils.clearAsyncExcludingInterval(intervalId);
                reject(err);
            },
        );
    });

    return txReceiptPromise;
};
