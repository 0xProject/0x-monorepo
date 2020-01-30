import {
    blockchainTests,
    constants,
    expect,
    increaseTimeAndMineBlockAsync,
} from '@0x/contracts-test-utils';
import { RevertReason } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import { artifacts } from './artifacts';
import {
    MultiSigWalletWithTimeLockConfirmationEventArgs,
    MultiSigWalletWithTimeLockConfirmationTimeSetEventArgs,
    MultiSigWalletWithTimeLockContract,
    MultiSigWalletWithTimeLockExecutionEventArgs,
    MultiSigWalletWithTimeLockExecutionFailureEventArgs,
    MultiSigWalletWithTimeLockSubmissionEventArgs,
    TestRejectEtherContract,
} from './wrappers';

import { MultiSigWrapper } from './utils/multi_sig_wrapper';

// tslint:disable:no-unnecessary-type-assertion
blockchainTests.resets('MultiSigWalletWithTimeLock', env => {
    let owners: string[];
    let notOwner: string;
    const REQUIRED_APPROVALS = new BigNumber(2);
    const SECONDS_TIME_LOCKED = new BigNumber(1000000);

    before(async () => {
        const accounts = await env.getAccountAddressesAsync();
        owners = [accounts[0], accounts[1], accounts[2]];
        notOwner = accounts[3];
    });

    let multiSig: MultiSigWalletWithTimeLockContract;
    let multiSigWrapper: MultiSigWrapper;

    describe('external_call', () => {
        it('should be internal', async () => {
            const secondsTimeLocked = new BigNumber(0);
            multiSig = await MultiSigWalletWithTimeLockContract.deployFrom0xArtifactAsync(
                artifacts.MultiSigWalletWithTimeLock,
                env.provider,
                env.txDefaults,
                artifacts,
                owners,
                REQUIRED_APPROVALS,
                secondsTimeLocked,
            );
            expect((multiSig as any).external_call === undefined).to.be.equal(true);
        });
    });
    describe('confirmTransaction', () => {
        let txId: BigNumber;
        beforeEach(async () => {
            const secondsTimeLocked = new BigNumber(0);
            multiSig = await MultiSigWalletWithTimeLockContract.deployFrom0xArtifactAsync(
                artifacts.MultiSigWalletWithTimeLock,
                env.provider,
                env.txDefaults,
                artifacts,
                owners,
                REQUIRED_APPROVALS,
                secondsTimeLocked,
            );
            multiSigWrapper = new MultiSigWrapper(multiSig, env.provider);
            const destination = notOwner;
            const data = constants.NULL_BYTES;
            const txReceipt = await multiSigWrapper.submitTransactionAsync(destination, data, owners[0]);
            txId = (txReceipt.logs[0] as LogWithDecodedArgs<MultiSigWalletWithTimeLockSubmissionEventArgs>).args
                .transactionId;
        });
        it('should revert if called by a non-owner', async () => {
            return expect(multiSigWrapper.confirmTransactionAsync(txId, notOwner)).to.revertWith('OWNER_DOESNT_EXIST');
        });
        it('should revert if transaction does not exist', async () => {
            const nonexistentTxId = new BigNumber(123456789);
            return expect(
                multiSigWrapper.confirmTransactionAsync(nonexistentTxId, owners[1]),
            ).to.revertWith('TX_DOESNT_EXIST');
        });
        it('should revert if transaction is already confirmed by caller', async () => {
            return expect(multiSigWrapper.confirmTransactionAsync(txId, owners[0])).to.revertWith('TX_ALREADY_CONFIRMED');
        });
        it('should confirm transaction for caller and log a Confirmation event', async () => {
            const txReceipt = await multiSigWrapper.confirmTransactionAsync(txId, owners[1]);
            expect(txReceipt.logs.length).to.equal(2);
            const log = txReceipt.logs[0] as LogWithDecodedArgs<MultiSigWalletWithTimeLockConfirmationEventArgs>;
            expect(log.event).to.be.equal('Confirmation');
            expect(log.args.sender).to.be.equal(owners[1]);
            expect(log.args.transactionId).to.be.bignumber.equal(txId);
        });
        it('should set the confirmation time of the transaction if it becomes fully confirmed', async () => {
            const txReceipt = await multiSigWrapper.confirmTransactionAsync(txId, owners[1]);
            expect(txReceipt.logs.length).to.equal(2);
            const blockNum = await env.web3Wrapper.getBlockNumberAsync();
            const timestamp = new BigNumber(await env.web3Wrapper.getBlockTimestampAsync(blockNum));
            const log = txReceipt.logs[1] as LogWithDecodedArgs<MultiSigWalletWithTimeLockConfirmationTimeSetEventArgs>;
            expect(log.args.confirmationTime).to.be.bignumber.equal(timestamp);
            expect(log.args.transactionId).to.be.bignumber.equal(txId);
        });
        it('should confirm transaction for caller but not reset the confirmation time if tx is already fully confirmed', async () => {
            await multiSigWrapper.confirmTransactionAsync(txId, owners[1]);
            const confirmationTimeBefore = await multiSig.confirmationTimes(txId).callAsync();
            const txReceipt = await multiSigWrapper.confirmTransactionAsync(txId, owners[2]);
            const confirmationTimeAfter = await multiSig.confirmationTimes(txId).callAsync();
            expect(confirmationTimeBefore).to.bignumber.equal(confirmationTimeAfter);
            expect(txReceipt.logs.length).to.equal(1);
            const log = txReceipt.logs[0] as LogWithDecodedArgs<MultiSigWalletWithTimeLockConfirmationEventArgs>;
            expect(log.event).to.be.equal('Confirmation');
            expect(log.args.sender).to.be.equal(owners[2]);
            expect(log.args.transactionId).to.be.bignumber.equal(txId);
        });
    });
    describe('executeTransaction', () => {
        let txId: BigNumber;
        const secondsTimeLocked = new BigNumber(1000000);
        beforeEach(async () => {
            multiSig = await MultiSigWalletWithTimeLockContract.deployFrom0xArtifactAsync(
                artifacts.MultiSigWalletWithTimeLock,
                env.provider,
                env.txDefaults,
                artifacts,
                owners,
                REQUIRED_APPROVALS,
                secondsTimeLocked,
            );
            multiSigWrapper = new MultiSigWrapper(multiSig, env.provider);
            const destination = notOwner;
            const data = constants.NULL_BYTES;
            const txReceipt = await multiSigWrapper.submitTransactionAsync(destination, data, owners[0]);
            txId = (txReceipt.logs[0] as LogWithDecodedArgs<MultiSigWalletWithTimeLockSubmissionEventArgs>).args
                .transactionId;
        });
        it('should revert if transaction has not been fully confirmed', async () => {
            await increaseTimeAndMineBlockAsync(secondsTimeLocked.toNumber());
            return expect(
                multiSigWrapper.executeTransactionAsync(txId, owners[1]),
            ).to.revertWith(RevertReason.TxNotFullyConfirmed);
        });
        it('should revert if time lock has not passed', async () => {
            await multiSigWrapper.confirmTransactionAsync(txId, owners[1]);
            expect(
                multiSigWrapper.executeTransactionAsync(txId, owners[1]),
            ).to.revertWith(RevertReason.TimeLockIncomplete);
        });
        it('should execute a transaction and log an Execution event if successful and called by owner', async () => {
            await multiSigWrapper.confirmTransactionAsync(txId, owners[1]);
            await increaseTimeAndMineBlockAsync(secondsTimeLocked.toNumber());
            const txReceipt = await multiSigWrapper.executeTransactionAsync(txId, owners[1]);
            const log = txReceipt.logs[0] as LogWithDecodedArgs<MultiSigWalletWithTimeLockExecutionEventArgs>;
            expect(log.event).to.be.equal('Execution');
            expect(log.args.transactionId).to.be.bignumber.equal(txId);
        });
        it('should execute a transaction and log an Execution event if successful and called by non-owner', async () => {
            await multiSigWrapper.confirmTransactionAsync(txId, owners[1]);
            await increaseTimeAndMineBlockAsync(secondsTimeLocked.toNumber());
            const txReceipt = await multiSigWrapper.executeTransactionAsync(txId, notOwner);
            const log = txReceipt.logs[0] as LogWithDecodedArgs<MultiSigWalletWithTimeLockExecutionEventArgs>;
            expect(log.event).to.be.equal('Execution');
            expect(log.args.transactionId).to.be.bignumber.equal(txId);
        });
        it('should revert if a required confirmation is revoked before executeTransaction is called', async () => {
            await multiSigWrapper.confirmTransactionAsync(txId, owners[1]);
            await increaseTimeAndMineBlockAsync(secondsTimeLocked.toNumber());
            await multiSigWrapper.revokeConfirmationAsync(txId, owners[0]);
            return expect(
                multiSigWrapper.executeTransactionAsync(txId, owners[1]),
            ).to.revertWith(RevertReason.TxNotFullyConfirmed);
        });
        it('should revert if transaction has been executed', async () => {
            await multiSigWrapper.confirmTransactionAsync(txId, owners[1]);
            await increaseTimeAndMineBlockAsync(secondsTimeLocked.toNumber());
            const txReceipt = await multiSigWrapper.executeTransactionAsync(txId, owners[1]);
            const log = txReceipt.logs[0] as LogWithDecodedArgs<MultiSigWalletWithTimeLockExecutionEventArgs>;
            expect(log.args.transactionId).to.be.bignumber.equal(txId);
            return expect(multiSigWrapper.executeTransactionAsync(txId, owners[1])).to.revertWith('TX_ALREADY_EXECUTED');
        });
        it("should log an ExecutionFailure event and not update the transaction's execution state if unsuccessful", async () => {
            const contractWithoutFallback = await TestRejectEtherContract.deployFrom0xArtifactAsync(
                artifacts.TestRejectEther,
                env.provider,
                env.txDefaults,
                artifacts,
            );
            const data = constants.NULL_BYTES;
            const value = new BigNumber(10);
            const submissionTxReceipt = await multiSigWrapper.submitTransactionAsync(
                contractWithoutFallback.address,
                data,
                owners[0],
                { value },
            );
            const newTxId = (submissionTxReceipt.logs[0] as LogWithDecodedArgs<
                MultiSigWalletWithTimeLockSubmissionEventArgs
            >).args.transactionId;
            await multiSigWrapper.confirmTransactionAsync(newTxId, owners[1]);
            await increaseTimeAndMineBlockAsync(secondsTimeLocked.toNumber());
            const txReceipt = await multiSigWrapper.executeTransactionAsync(newTxId, owners[1]);
            const executionFailureLog = txReceipt.logs[0] as LogWithDecodedArgs<
                MultiSigWalletWithTimeLockExecutionFailureEventArgs
            >;
            expect(executionFailureLog.event).to.be.equal('ExecutionFailure');
            expect(executionFailureLog.args.transactionId).to.be.bignumber.equal(newTxId);
        });
    });
    describe('changeTimeLock', () => {
        describe('initially non-time-locked', async () => {
            before('deploy a wallet', async () => {
                const secondsTimeLocked = new BigNumber(0);
                multiSig = await MultiSigWalletWithTimeLockContract.deployFrom0xArtifactAsync(
                    artifacts.MultiSigWalletWithTimeLock,
                    env.provider,
                    env.txDefaults,
                    artifacts,
                    owners,
                    REQUIRED_APPROVALS,
                    secondsTimeLocked,
                );
                multiSigWrapper = new MultiSigWrapper(multiSig, env.provider);
            });

            it('should revert when not called by wallet', async () => {
                return expect(
                    multiSig.changeTimeLock(SECONDS_TIME_LOCKED).sendTransactionAsync({ from: owners[0] }),
                ).to.revertWith('ONLY_CALLABLE_BY_WALLET');
            });

            it('should revert without enough confirmations', async () => {
                const destination = multiSig.address;
                const changeTimeLockData = multiSig.changeTimeLock(SECONDS_TIME_LOCKED).getABIEncodedTransactionData();
                const res = await multiSigWrapper.submitTransactionAsync(destination, changeTimeLockData, owners[0]);
                const log = res.logs[0] as LogWithDecodedArgs<MultiSigWalletWithTimeLockSubmissionEventArgs>;
                const txId = log.args.transactionId;
                return expect(
                    multiSig.executeTransaction(txId).sendTransactionAsync({ from: owners[0] }),
                ).to.revertWith(RevertReason.TxNotFullyConfirmed);
            });

            it('should set confirmation time with enough confirmations', async () => {
                const destination = multiSig.address;
                const changeTimeLockData = multiSig.changeTimeLock(SECONDS_TIME_LOCKED).getABIEncodedTransactionData();
                const subRes = await multiSigWrapper.submitTransactionAsync(destination, changeTimeLockData, owners[0]);
                const subLog = subRes.logs[0] as LogWithDecodedArgs<MultiSigWalletWithTimeLockSubmissionEventArgs>;
                const txId = subLog.args.transactionId;

                const confirmRes = await multiSigWrapper.confirmTransactionAsync(txId, owners[1]);
                expect(confirmRes.logs).to.have.length(2);

                const blockNum = await env.web3Wrapper.getBlockNumberAsync();
                const blockInfo = await env.web3Wrapper.getBlockIfExistsAsync(blockNum);
                if (blockInfo === undefined) {
                    throw new Error(`Unexpectedly failed to fetch block at #${blockNum}`);
                }
                const timestamp = new BigNumber(blockInfo.timestamp);
                const confirmationTimeBigNum = new BigNumber(await multiSig.confirmationTimes(txId).callAsync());

                expect(timestamp).to.be.bignumber.equal(confirmationTimeBigNum);
            });

            it('should be executable with enough confirmations and secondsTimeLocked of 0', async () => {
                const destination = multiSig.address;
                const changeTimeLockData = multiSig.changeTimeLock(SECONDS_TIME_LOCKED).getABIEncodedTransactionData();
                const subRes = await multiSigWrapper.submitTransactionAsync(destination, changeTimeLockData, owners[0]);
                const subLog = subRes.logs[0] as LogWithDecodedArgs<MultiSigWalletWithTimeLockSubmissionEventArgs>;
                const txId = subLog.args.transactionId;

                await multiSigWrapper.confirmTransactionAsync(txId, owners[1]);
                await multiSigWrapper.executeTransactionAsync(txId, owners[1]);

                const secondsTimeLocked = new BigNumber(await multiSig.secondsTimeLocked().callAsync());
                expect(secondsTimeLocked).to.be.bignumber.equal(SECONDS_TIME_LOCKED);
            });
        });
        describe('initially time-locked', async () => {
            let txId: BigNumber;
            const newSecondsTimeLocked = new BigNumber(0);
            before('deploy a wallet, submit transaction to change timelock, and confirm the transaction', async () => {
                multiSig = await MultiSigWalletWithTimeLockContract.deployFrom0xArtifactAsync(
                    artifacts.MultiSigWalletWithTimeLock,
                    env.provider,
                    env.txDefaults,
                    artifacts,
                    owners,
                    REQUIRED_APPROVALS,
                    SECONDS_TIME_LOCKED,
                );
                multiSigWrapper = new MultiSigWrapper(multiSig, env.provider);

                const changeTimeLockData = multiSig.changeTimeLock(newSecondsTimeLocked).getABIEncodedTransactionData();
                const res = await multiSigWrapper.submitTransactionAsync(
                    multiSig.address,
                    changeTimeLockData,
                    owners[0],
                );
                const log = res.logs[0] as LogWithDecodedArgs<MultiSigWalletWithTimeLockSubmissionEventArgs>;
                txId = log.args.transactionId;
                await multiSigWrapper.confirmTransactionAsync(txId, owners[1]);
            });

            it('should revert if it has enough confirmations but is not past the time lock', async () => {
                return expect(
                    multiSig.executeTransaction(txId).sendTransactionAsync({ from: owners[0] }),
                ).to.revertWith(RevertReason.TimeLockIncomplete);
            });

            it('should execute if it has enough confirmations and is past the time lock', async () => {
                await increaseTimeAndMineBlockAsync(SECONDS_TIME_LOCKED.toNumber());
                await multiSig
                    .executeTransaction(txId)
                    .awaitTransactionSuccessAsync(
                        { from: owners[0] },
                        { pollingIntervalMs: constants.AWAIT_TRANSACTION_MINED_MS },
                    );

                const secondsTimeLocked = new BigNumber(await multiSig.secondsTimeLocked().callAsync());
                expect(secondsTimeLocked).to.be.bignumber.equal(newSecondsTimeLocked);
            });
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
