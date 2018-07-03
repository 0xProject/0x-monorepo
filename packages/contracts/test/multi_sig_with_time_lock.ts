import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import { LogWithDecodedArgs } from 'ethereum-types';

import {
    MultiSigWalletWithTimeLockContract,
    MultiSigWalletWithTimeLockSubmissionEventArgs,
} from '../src/generated_contract_wrappers/multi_sig_wallet_with_time_lock';
import { artifacts } from '../src/utils/artifacts';
import { expectRevertOrAlwaysFailingTransactionAsync } from '../src/utils/assertions';
import { chaiSetup } from '../src/utils/chai_setup';
import { constants } from '../src/utils/constants';
import { increaseTimeAndMineBlockAsync } from '../src/utils/increase_time';
import { MultiSigWrapper } from '../src/utils/multi_sig_wrapper';
import { provider, txDefaults, web3Wrapper } from '../src/utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
// tslint:disable:no-unnecessary-type-assertion
describe('MultiSigWalletWithTimeLock', () => {
    let owners: string[];
    const REQUIRED_APPROVALS = new BigNumber(2);
    const SECONDS_TIME_LOCKED = new BigNumber(1000000);

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        owners = [accounts[0], accounts[1]];
    });

    let multiSig: MultiSigWalletWithTimeLockContract;
    let multiSigWrapper: MultiSigWrapper;

    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('changeTimeLock', () => {
        describe('initially non-time-locked', async () => {
            before(async () => {
                await blockchainLifecycle.startAsync();
            });
            after(async () => {
                await blockchainLifecycle.revertAsync();
            });
            before('deploy a wallet', async () => {
                const secondsTimeLocked = new BigNumber(0);
                multiSig = await MultiSigWalletWithTimeLockContract.deployFrom0xArtifactAsync(
                    artifacts.MultiSigWalletWithTimeLock,
                    provider,
                    txDefaults,
                    owners,
                    REQUIRED_APPROVALS,
                    secondsTimeLocked,
                );
                multiSigWrapper = new MultiSigWrapper(multiSig, provider);
            });

            it('should throw when not called by wallet', async () => {
                return expectRevertOrAlwaysFailingTransactionAsync(
                    multiSig.changeTimeLock.sendTransactionAsync(SECONDS_TIME_LOCKED, { from: owners[0] }),
                );
            });

            it('should throw without enough confirmations', async () => {
                const destination = multiSig.address;
                const changeTimeLockData = multiSig.changeTimeLock.getABIEncodedTransactionData(SECONDS_TIME_LOCKED);
                const res = await multiSigWrapper.submitTransactionAsync(destination, changeTimeLockData, owners[0]);
                const log = res.logs[0] as LogWithDecodedArgs<MultiSigWalletWithTimeLockSubmissionEventArgs>;
                const txId = log.args.transactionId;
                return expectRevertOrAlwaysFailingTransactionAsync(
                    multiSig.executeTransaction.sendTransactionAsync(txId, { from: owners[0] }),
                );
            });

            it('should set confirmation time with enough confirmations', async () => {
                const destination = multiSig.address;
                const changeTimeLockData = multiSig.changeTimeLock.getABIEncodedTransactionData(SECONDS_TIME_LOCKED);
                const subRes = await multiSigWrapper.submitTransactionAsync(destination, changeTimeLockData, owners[0]);
                const subLog = subRes.logs[0] as LogWithDecodedArgs<MultiSigWalletWithTimeLockSubmissionEventArgs>;
                const txId = subLog.args.transactionId;

                const confirmRes = await multiSigWrapper.confirmTransactionAsync(txId, owners[1]);
                expect(confirmRes.logs).to.have.length(2);

                const blockNum = await web3Wrapper.getBlockNumberAsync();
                const blockInfo = await web3Wrapper.getBlockAsync(blockNum);
                const timestamp = new BigNumber(blockInfo.timestamp);
                const confirmationTimeBigNum = new BigNumber(await multiSig.confirmationTimes.callAsync(txId));

                expect(timestamp).to.be.bignumber.equal(confirmationTimeBigNum);
            });

            it('should be executable with enough confirmations and secondsTimeLocked of 0', async () => {
                const destination = multiSig.address;
                const changeTimeLockData = multiSig.changeTimeLock.getABIEncodedTransactionData(SECONDS_TIME_LOCKED);
                const subRes = await multiSigWrapper.submitTransactionAsync(destination, changeTimeLockData, owners[0]);
                const subLog = subRes.logs[0] as LogWithDecodedArgs<MultiSigWalletWithTimeLockSubmissionEventArgs>;
                const txId = subLog.args.transactionId;

                await multiSigWrapper.confirmTransactionAsync(txId, owners[1]);
                await multiSigWrapper.executeTransactionAsync(txId, owners[1]);

                const secondsTimeLocked = new BigNumber(await multiSig.secondsTimeLocked.callAsync());
                expect(secondsTimeLocked).to.be.bignumber.equal(SECONDS_TIME_LOCKED);
            });
        });
        describe('initially time-locked', async () => {
            before(async () => {
                await blockchainLifecycle.startAsync();
            });
            after(async () => {
                await blockchainLifecycle.revertAsync();
            });
            let txId: BigNumber;
            const newSecondsTimeLocked = new BigNumber(0);
            before('deploy a wallet, submit transaction to change timelock, and confirm the transaction', async () => {
                multiSig = await MultiSigWalletWithTimeLockContract.deployFrom0xArtifactAsync(
                    artifacts.MultiSigWalletWithTimeLock,
                    provider,
                    txDefaults,
                    owners,
                    REQUIRED_APPROVALS,
                    SECONDS_TIME_LOCKED,
                );
                multiSigWrapper = new MultiSigWrapper(multiSig, provider);

                const changeTimeLockData = multiSig.changeTimeLock.getABIEncodedTransactionData(newSecondsTimeLocked);
                const res = await multiSigWrapper.submitTransactionAsync(
                    multiSig.address,
                    changeTimeLockData,
                    owners[0],
                );
                const log = res.logs[0] as LogWithDecodedArgs<MultiSigWalletWithTimeLockSubmissionEventArgs>;
                txId = log.args.transactionId;
                await multiSigWrapper.confirmTransactionAsync(txId, owners[1]);
            });

            it('should throw if it has enough confirmations but is not past the time lock', async () => {
                return expectRevertOrAlwaysFailingTransactionAsync(
                    multiSig.executeTransaction.sendTransactionAsync(txId, { from: owners[0] }),
                );
            });

            it('should execute if it has enough confirmations and is past the time lock', async () => {
                await increaseTimeAndMineBlockAsync(SECONDS_TIME_LOCKED.toNumber());
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await multiSig.executeTransaction.sendTransactionAsync(txId, { from: owners[0] }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );

                const secondsTimeLocked = new BigNumber(await multiSig.secondsTimeLocked.callAsync());
                expect(secondsTimeLocked).to.be.bignumber.equal(newSecondsTimeLocked);
            });
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
