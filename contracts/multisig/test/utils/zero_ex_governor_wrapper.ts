import { constants, hexRandom, increaseTimeAndMineBlockAsync } from '@0x/contracts-test-utils';
import { AbiEncoder, BigNumber } from '@0x/utils';
import { LogWithDecodedArgs, TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { TestZeroExGovernorContract, ZeroExGovernorContract, ZeroExGovernorSubmissionEventArgs } from '../../src';

// tslint:disable: no-unnecessary-type-assertion
export class ZeroExGovernorWrapper {
    private readonly _governor: ZeroExGovernorContract | TestZeroExGovernorContract;
    constructor(assetproxyOwnerContract: ZeroExGovernorContract | TestZeroExGovernorContract) {
        this._governor = assetproxyOwnerContract;
    }
    public async submitTransactionAsync(
        data: string[],
        destinations: string[],
        from: string,
        opts: { values?: BigNumber[] } = {},
    ): Promise<{ txReceipt: TransactionReceiptWithDecodedLogs; txId: BigNumber }> {
        const values = opts.values === undefined ? data.map(() => constants.ZERO_AMOUNT) : opts.values;
        const batchTransactionEncoder = AbiEncoder.create('(bytes[],address[],uint256[])');
        const batchTransactionData = batchTransactionEncoder.encode([data, destinations, values]);
        const txReceipt = await this._governor
            .submitTransaction(
                hexRandom(20), // submitTransaction will fail if this is a null address
                constants.ZERO_AMOUNT,
                batchTransactionData,
            )
            .awaitTransactionSuccessAsync({ from });
        const txId = (txReceipt.logs[0] as LogWithDecodedArgs<ZeroExGovernorSubmissionEventArgs>).args.transactionId;
        return { txReceipt, txId };
    }
    public async submitConfirmAndExecuteTransactionAsync(
        data: string[],
        destinations: string[],
        signerAddresses: string[],
        increaseTimeSeconds: number,
        opts: { values?: BigNumber[]; executeFromAddress?: string; requiredSignatures?: number } = {},
    ): Promise<{ executionTxReceipt: TransactionReceiptWithDecodedLogs; txId: BigNumber }> {
        const submitResults = await this.submitTransactionAsync(data, destinations, signerAddresses[0], opts);
        const requiredSignatures = opts.requiredSignatures === undefined ? 2 : opts.requiredSignatures;
        for (const index of _.range(1, requiredSignatures)) {
            await this._governor.confirmTransaction(submitResults.txId).awaitTransactionSuccessAsync({
                from: signerAddresses[index],
            });
        }
        await increaseTimeAndMineBlockAsync(increaseTimeSeconds);
        const executionTxReceipt = await this._governor
            .executeTransaction(submitResults.txId)
            .awaitTransactionSuccessAsync({
                from: opts.executeFromAddress === undefined ? signerAddresses[0] : opts.executeFromAddress,
            });
        return { executionTxReceipt, txId: submitResults.txId };
    }
}
