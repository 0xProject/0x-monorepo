import { LogWithDecodedArgs, ZeroEx } from '0x.js';
import { BlockchainLifecycle, web3Factory } from '@0xproject/dev-utils';
import { AbiDecoder, BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import * as Web3 from 'web3';

import * as multiSigWalletJSON from '../../build/contracts/MultiSigWalletWithTimeLock.json';
import { MultiSigWalletContract } from '../src/contract_wrappers/generated/multi_sig_wallet';
import { MultiSigWalletWithTimeLockContract } from '../src/contract_wrappers/generated/multi_sig_wallet_with_time_lock';
import { artifacts } from '../util/artifacts';
import { constants } from '../util/constants';
import { MultiSigWrapper } from '../util/multi_sig_wrapper';
import { ContractName, SubmissionContractEventArgs } from '../util/types';

import { chaiSetup } from './utils/chai_setup';

import { provider, txDefaults, web3Wrapper } from './utils/web3_wrapper';

const MULTI_SIG_ABI = artifacts.MultiSigWalletWithTimeLock.compilerOutput.abi;
chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
const zeroEx = new ZeroEx(provider, { networkId: constants.TESTRPC_NETWORK_ID });
const abiDecoder = new AbiDecoder([MULTI_SIG_ABI]);

describe('MultiSigWalletWithTimeLock', () => {
    let owners: string[];
    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        owners = [accounts[0], accounts[1]];
    });
    const SIGNATURES_REQUIRED = new BigNumber(2);
    const SECONDS_TIME_LOCKED = new BigNumber(10000);

    let multiSig: MultiSigWalletWithTimeLockContract;
    let multiSigWrapper: MultiSigWrapper;
    let txId: BigNumber;
    let initialSecondsTimeLocked: number;
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('changeTimeLock', () => {
        describe('initially non-time-locked', async () => {
            before('deploy a wallet', async () => {
                multiSig = await MultiSigWalletWithTimeLockContract.deployFrom0xArtifactAsync(
                    artifacts.MultiSigWalletWithTimeLock,
                    provider,
                    txDefaults,
                    owners,
                    SIGNATURES_REQUIRED,
                    new BigNumber(0),
                );
                multiSigWrapper = new MultiSigWrapper((multiSig as any) as MultiSigWalletContract);

                const secondsTimeLocked = await multiSig.secondsTimeLocked.callAsync();
                initialSecondsTimeLocked = secondsTimeLocked.toNumber();
            });
            it('should throw when not called by wallet', async () => {
                return expect(
                    multiSig.changeTimeLock.sendTransactionAsync(SECONDS_TIME_LOCKED, { from: owners[0] }),
                ).to.be.rejectedWith(constants.REVERT);
            });

            it('should throw without enough confirmations', async () => {
                const destination = multiSig.address;
                const from = owners[0];
                const dataParams = {
                    name: 'changeTimeLock',
                    abi: MULTI_SIG_ABI,
                    args: [SECONDS_TIME_LOCKED.toNumber()],
                };
                const txHash = await multiSigWrapper.submitTransactionAsync(destination, from, dataParams);
                const subRes = await zeroEx.awaitTransactionMinedAsync(txHash);
                const log = abiDecoder.tryToDecodeLogOrNoop(subRes.logs[0]) as LogWithDecodedArgs<
                    SubmissionContractEventArgs
                >;

                txId = log.args.transactionId;
                return expect(
                    multiSig.executeTransaction.sendTransactionAsync(txId, { from: owners[0] }),
                ).to.be.rejectedWith(constants.REVERT);
            });

            it('should set confirmation time with enough confirmations', async () => {
                const destination = multiSig.address;
                const from = owners[0];
                const dataParams = {
                    name: 'changeTimeLock',
                    abi: MULTI_SIG_ABI,
                    args: [SECONDS_TIME_LOCKED.toNumber()],
                };
                let txHash = await multiSigWrapper.submitTransactionAsync(destination, from, dataParams);
                const subRes = await zeroEx.awaitTransactionMinedAsync(txHash);
                const log = abiDecoder.tryToDecodeLogOrNoop(subRes.logs[0]) as LogWithDecodedArgs<
                    SubmissionContractEventArgs
                >;

                txId = log.args.transactionId;
                txHash = await multiSig.confirmTransaction.sendTransactionAsync(txId, { from: owners[1] });
                const res = await zeroEx.awaitTransactionMinedAsync(txHash);
                expect(res.logs).to.have.length(2);

                const blockNum = await web3Wrapper.getBlockNumberAsync();
                const blockInfo = await web3Wrapper.getBlockAsync(blockNum);
                const timestamp = new BigNumber(blockInfo.timestamp);
                const confirmationTimeBigNum = new BigNumber(await multiSig.confirmationTimes.callAsync(txId));

                expect(timestamp).to.be.bignumber.equal(confirmationTimeBigNum);
            });

            it('should be executable with enough confirmations and secondsTimeLocked of 0', async () => {
                const destination = multiSig.address;
                const from = owners[0];
                const dataParams = {
                    name: 'changeTimeLock',
                    abi: MULTI_SIG_ABI,
                    args: [SECONDS_TIME_LOCKED.toNumber()],
                };
                let txHash = await multiSigWrapper.submitTransactionAsync(destination, from, dataParams);
                const subRes = await zeroEx.awaitTransactionMinedAsync(txHash);
                const log = abiDecoder.tryToDecodeLogOrNoop(subRes.logs[0]) as LogWithDecodedArgs<
                    SubmissionContractEventArgs
                >;

                txId = log.args.transactionId;
                txHash = await multiSig.confirmTransaction.sendTransactionAsync(txId, { from: owners[1] });

                expect(initialSecondsTimeLocked).to.be.equal(0);

                txHash = await multiSig.executeTransaction.sendTransactionAsync(txId, { from: owners[0] });
                const res = await zeroEx.awaitTransactionMinedAsync(txHash);
                expect(res.logs).to.have.length(2);

                const secondsTimeLocked = new BigNumber(await multiSig.secondsTimeLocked.callAsync());
                expect(secondsTimeLocked).to.be.bignumber.equal(SECONDS_TIME_LOCKED);
            });
        });
        describe('initially time-locked', async () => {
            before('deploy a wallet', async () => {
                multiSig = await MultiSigWalletWithTimeLockContract.deployFrom0xArtifactAsync(
                    artifacts.MultiSigWalletWithTimeLock,
                    provider,
                    txDefaults,
                    owners,
                    SIGNATURES_REQUIRED,
                    SECONDS_TIME_LOCKED,
                );
                multiSigWrapper = new MultiSigWrapper((multiSig as any) as MultiSigWalletContract);

                const secondsTimeLocked = await multiSig.secondsTimeLocked.callAsync();
                initialSecondsTimeLocked = secondsTimeLocked.toNumber();
                const destination = multiSig.address;
                const from = owners[0];
                const dataParams = {
                    name: 'changeTimeLock',
                    abi: MULTI_SIG_ABI,
                    args: [newSecondsTimeLocked],
                };
                let txHash = await multiSigWrapper.submitTransactionAsync(destination, from, dataParams);
                const subRes = await zeroEx.awaitTransactionMinedAsync(txHash);
                const log = abiDecoder.tryToDecodeLogOrNoop(subRes.logs[0]) as LogWithDecodedArgs<
                    SubmissionContractEventArgs
                >;
                txId = log.args.transactionId;
                txHash = await multiSig.confirmTransaction.sendTransactionAsync(txId, {
                    from: owners[1],
                });
                const confRes = await zeroEx.awaitTransactionMinedAsync(txHash);
                expect(confRes.logs).to.have.length(2);
            });
            const newSecondsTimeLocked = 0;
            it('should throw if it has enough confirmations but is not past the time lock', async () => {
                return expect(
                    multiSig.executeTransaction.sendTransactionAsync(txId, { from: owners[0] }),
                ).to.be.rejectedWith(constants.REVERT);
            });

            it('should execute if it has enough confirmations and is past the time lock', async () => {
                await web3Wrapper.increaseTimeAsync(SECONDS_TIME_LOCKED.toNumber());
                await multiSig.executeTransaction.sendTransactionAsync(txId, { from: owners[0] });

                const secondsTimeLocked = new BigNumber(await multiSig.secondsTimeLocked.callAsync());
                expect(secondsTimeLocked).to.be.bignumber.equal(newSecondsTimeLocked);
            });
        });
    });
});
