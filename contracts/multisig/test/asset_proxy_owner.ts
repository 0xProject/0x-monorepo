import { blockchainTests, constants, expect, getLatestBlockTimestampAsync, hexRandom } from '@0x/contracts-test-utils';
import { RevertReason } from '@0x/types';
import { BigNumber, LibBytesRevertErrors } from '@0x/utils';
import { LogEntry, LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import {
    artifacts,
    AssetProxyOwnerExecutionEventArgs,
    AssetProxyOwnerFunctionCallTimeLockRegistrationEventArgs,
    AssetProxyOwnerWrapper,
    ContractCallReceiverContract,
    ContractCallReceiverEventArgs,
    TestAssetProxyOwnerContract,
} from '../src';

blockchainTests.resets('AssetProxyOwner', env => {
    let assetProxyOwner: TestAssetProxyOwnerContract;
    let assetProxyOwnerWrapper: AssetProxyOwnerWrapper;
    let receiver: ContractCallReceiverContract;
    let signerAddresses: string[];
    let notSignerAddress: string;

    const TOTAL_SIGNERS = 3;
    const REQUIRED_SIGNERS = 2;
    const DEFAULT_TIME_LOCK = 1000;
    const INITIAL_BALANCE = new BigNumber(1000);

    before(async () => {
        const accounts = await env.web3Wrapper.getAvailableAddressesAsync();
        signerAddresses = accounts.slice(0, TOTAL_SIGNERS);
        notSignerAddress = accounts[TOTAL_SIGNERS];
        assetProxyOwner = await TestAssetProxyOwnerContract.deployFrom0xArtifactAsync(
            artifacts.TestAssetProxyOwner,
            env.provider,
            env.txDefaults,
            artifacts,
            [],
            [],
            [],
            signerAddresses,
            new BigNumber(REQUIRED_SIGNERS),
            new BigNumber(DEFAULT_TIME_LOCK),
        );
        await env.web3Wrapper.awaitTransactionMinedAsync(
            await env.web3Wrapper.sendTransactionAsync({
                from: signerAddresses[0],
                to: assetProxyOwner.address,
                value: INITIAL_BALANCE,
            }),
        );
        assetProxyOwnerWrapper = new AssetProxyOwnerWrapper(assetProxyOwner);
        receiver = await ContractCallReceiverContract.deployFrom0xArtifactAsync(
            artifacts.ContractCallReceiver,
            env.provider,
            env.txDefaults,
            {},
        );
    });

    function createFunctionRegistration(
        functionSelectorLength: number = 0,
        destinationsLength?: number,
        functionCallTimeLockSecondsLength?: number,
    ): { functionSelectors: string[]; destinations: string[]; functionCallTimeLockSeconds: BigNumber[] } {
        const _destinationsLength = destinationsLength === undefined ? functionSelectorLength : destinationsLength;
        const _functionCallTimeLockSecondsLength =
            functionCallTimeLockSecondsLength === undefined
                ? functionSelectorLength
                : functionCallTimeLockSecondsLength;
        const functionSelectors = _.times(functionSelectorLength, () => hexRandom(4));
        const destinations = _.times(_destinationsLength, () => hexRandom(20));
        const functionCallTimeLockSeconds = _.times(_functionCallTimeLockSecondsLength, () =>
            BigNumber.random() // random int > 0 and < 1000
                .times(10000000)
                .integerValue()
                .mod(1000),
        );
        return { functionSelectors, destinations, functionCallTimeLockSeconds };
    }
    blockchainTests.resets('constructor', () => {
        it('should fail if destinations.length != functionSelectors.length', async () => {
            const reg = createFunctionRegistration(1, 2, 1);
            const tx = TestAssetProxyOwnerContract.deployFrom0xArtifactAsync(
                artifacts.TestAssetProxyOwner,
                env.provider,
                env.txDefaults,
                artifacts,
                reg.functionSelectors,
                reg.destinations,
                reg.functionCallTimeLockSeconds,
                signerAddresses,
                new BigNumber(REQUIRED_SIGNERS),
                new BigNumber(DEFAULT_TIME_LOCK),
            );
            await expect(tx).to.revertWith(RevertReason.EqualLengthsRequired);
        });
        it('should fail if functionCallTimeLockSeconds.length != functionSelectors.length', async () => {
            const reg = createFunctionRegistration(1, 1, 2);
            const tx = TestAssetProxyOwnerContract.deployFrom0xArtifactAsync(
                artifacts.TestAssetProxyOwner,
                env.provider,
                env.txDefaults,
                artifacts,
                reg.functionSelectors,
                reg.destinations,
                reg.functionCallTimeLockSeconds,
                signerAddresses,
                new BigNumber(REQUIRED_SIGNERS),
                new BigNumber(DEFAULT_TIME_LOCK),
            );
            await expect(tx).to.revertWith(RevertReason.EqualLengthsRequired);
        });
        it('should allow no function calls to be registered', async () => {
            const tx = TestAssetProxyOwnerContract.deployFrom0xArtifactAsync(
                artifacts.TestAssetProxyOwner,
                env.provider,
                env.txDefaults,
                artifacts,
                [],
                [],
                [],
                signerAddresses,
                new BigNumber(REQUIRED_SIGNERS),
                new BigNumber(DEFAULT_TIME_LOCK),
            );
            expect(tx).to.be.fulfilled('');
        });
        it('should register a single functon call', async () => {
            const reg = createFunctionRegistration(1, 1, 1);
            const apOwner = await TestAssetProxyOwnerContract.deployFrom0xArtifactAsync(
                artifacts.TestAssetProxyOwner,
                env.provider,
                env.txDefaults,
                artifacts,
                reg.functionSelectors,
                reg.destinations,
                reg.functionCallTimeLockSeconds,
                signerAddresses,
                new BigNumber(REQUIRED_SIGNERS),
                new BigNumber(DEFAULT_TIME_LOCK),
            );
            const timelock = await apOwner.functionCallTimeLocks.callAsync(
                reg.functionSelectors[0],
                reg.destinations[0],
            );
            expect(timelock[0]).to.equal(true);
            expect(timelock[1]).to.bignumber.equal(reg.functionCallTimeLockSeconds[0]);
        });
        it('should register multiple function calls', async () => {
            const reg = createFunctionRegistration(2, 2, 2);
            const apOwner = await TestAssetProxyOwnerContract.deployFrom0xArtifactAsync(
                artifacts.TestAssetProxyOwner,
                env.provider,
                env.txDefaults,
                artifacts,
                reg.functionSelectors,
                reg.destinations,
                reg.functionCallTimeLockSeconds,
                signerAddresses,
                new BigNumber(REQUIRED_SIGNERS),
                new BigNumber(DEFAULT_TIME_LOCK),
            );
            for (const [index, selector] of reg.functionSelectors.entries()) {
                const timelock = await apOwner.functionCallTimeLocks.callAsync(selector, reg.destinations[index]);
                expect(timelock[0]).to.equal(true);
                expect(timelock[1]).to.bignumber.equal(reg.functionCallTimeLockSeconds[index]);
            }
        });
    });

    blockchainTests.resets('registerFunctionCall', () => {
        it('should revert if not called by wallet', async () => {
            const reg = createFunctionRegistration(1, 1, 1);
            const tx = assetProxyOwner.registerFunctionCall.awaitTransactionSuccessAsync(
                true,
                reg.functionSelectors[0],
                reg.destinations[0],
                reg.functionCallTimeLockSeconds[0],
            );
            expect(tx).to.revertWith(RevertReason.OnlyCallableByWallet);
        });
        it('should register a function call', async () => {
            const reg = createFunctionRegistration(1, 1, 1);
            const txReceipt = await assetProxyOwner.registerFunctionCallBypassWalet.awaitTransactionSuccessAsync(
                true,
                reg.functionSelectors[0],
                reg.destinations[0],
                reg.functionCallTimeLockSeconds[0],
            );
            expect(txReceipt.logs.length).to.eq(1);
            const logArgs = (txReceipt.logs[0] as LogWithDecodedArgs<
                AssetProxyOwnerFunctionCallTimeLockRegistrationEventArgs
            >).args;
            expect(logArgs.functionSelector).to.eq(reg.functionSelectors[0]);
            expect(logArgs.destination).to.eq(reg.destinations[0]);
            expect(logArgs.hasCustomTimeLock).to.eq(true);
            expect(logArgs.newSecondsTimeLocked).to.bignumber.eq(reg.functionCallTimeLockSeconds[0]);
            const timelock = await assetProxyOwner.functionCallTimeLocks.callAsync(
                reg.functionSelectors[0],
                reg.destinations[0],
            );
            expect(timelock[0]).to.equal(true);
            expect(timelock[1]).to.bignumber.equal(reg.functionCallTimeLockSeconds[0]);
        });
        it('should be able to overwrite existing function calls', async () => {
            const reg = createFunctionRegistration(1, 1, 1);
            await assetProxyOwner.registerFunctionCallBypassWalet.awaitTransactionSuccessAsync(
                true,
                reg.functionSelectors[0],
                reg.destinations[0],
                reg.functionCallTimeLockSeconds[0],
            );
            const newTimeLock = reg.functionCallTimeLockSeconds[0].plus(1000);
            await assetProxyOwner.registerFunctionCallBypassWalet.awaitTransactionSuccessAsync(
                true,
                reg.functionSelectors[0],
                reg.destinations[0],
                newTimeLock,
            );
            const timelock = await assetProxyOwner.functionCallTimeLocks.callAsync(
                reg.functionSelectors[0],
                reg.destinations[0],
            );
            expect(timelock[0]).to.equal(true);
            expect(timelock[1]).to.bignumber.equal(newTimeLock);
        });
        it('should clear the function timelock if hasCustomTimeLock is set to false', async () => {
            const reg = createFunctionRegistration(1, 1, 1);
            await assetProxyOwner.registerFunctionCallBypassWalet.awaitTransactionSuccessAsync(
                true,
                reg.functionSelectors[0],
                reg.destinations[0],
                reg.functionCallTimeLockSeconds[0],
            );
            await assetProxyOwner.registerFunctionCallBypassWalet.awaitTransactionSuccessAsync(
                false,
                reg.functionSelectors[0],
                reg.destinations[0],
                reg.functionCallTimeLockSeconds[0],
            );
            const timelock = await assetProxyOwner.functionCallTimeLocks.callAsync(
                reg.functionSelectors[0],
                reg.destinations[0],
            );
            expect(timelock[0]).to.equal(false);
            expect(timelock[1]).to.bignumber.equal(constants.ZERO_AMOUNT);
        });
    });

    describe('assertValidFunctionCall', () => {
        it('should revert if the data is less than 4 bytes long', async () => {
            const result = assetProxyOwner.assertValidFunctionCall.callAsync(
                constants.ZERO_AMOUNT,
                constants.NULL_BYTES,
                constants.NULL_ADDRESS,
            );
            const expectedError = new LibBytesRevertErrors.InvalidByteOperationError(
                LibBytesRevertErrors.InvalidByteOperationErrorCodes.LengthGreaterThanOrEqualsFourRequired,
                constants.ZERO_AMOUNT,
                new BigNumber(4),
            );
            expect(result).to.revertWith(expectedError);
        });
        it('should revert if an unregistered function is called before the default timelock', async () => {
            const latestTimestamp = await getLatestBlockTimestampAsync();
            const transactionConfirmationTime = new BigNumber(latestTimestamp);
            const reg = createFunctionRegistration(1, 1, 1);
            const result = assetProxyOwner.assertValidFunctionCall.callAsync(
                transactionConfirmationTime,
                reg.functionSelectors[0],
                reg.destinations[0],
            );
            expect(result).to.revertWith(RevertReason.DefaultTimeLockIncomplete);
        });
        it('should revert if a registered function is called before the custom timelock', async () => {
            const reg = createFunctionRegistration(1, 1, 1);
            await assetProxyOwner.registerFunctionCallBypassWalet.awaitTransactionSuccessAsync(
                true,
                reg.functionSelectors[0],
                reg.destinations[0],
                reg.functionCallTimeLockSeconds[0],
            );
            const latestTimestamp = await getLatestBlockTimestampAsync();
            const transactionConfirmationTime = new BigNumber(latestTimestamp);
            const result = assetProxyOwner.assertValidFunctionCall.callAsync(
                transactionConfirmationTime,
                reg.functionSelectors[0],
                reg.destinations[0],
            );
            expect(result).to.revertWith(RevertReason.CustomTimeLockIncomplete);
        });
        it('should be successful if an unregistered function is called after the default timelock', async () => {
            const latestTimestamp = await getLatestBlockTimestampAsync();
            const transactionConfirmationTime = new BigNumber(latestTimestamp).minus(DEFAULT_TIME_LOCK);
            const reg = createFunctionRegistration(1, 1, 1);
            const result = assetProxyOwner.assertValidFunctionCall.callAsync(
                transactionConfirmationTime,
                reg.functionSelectors[0],
                reg.destinations[0],
            );
            expect(result).to.be.fulfilled('');
        });
        it('should be successful if a registered function is called after the custom timelock', async () => {
            const reg = createFunctionRegistration(1, 1, 1);
            await assetProxyOwner.registerFunctionCallBypassWalet.awaitTransactionSuccessAsync(
                true,
                reg.functionSelectors[0],
                reg.destinations[0],
                reg.functionCallTimeLockSeconds[0],
            );
            const latestTimestamp = await getLatestBlockTimestampAsync();
            const transactionConfirmationTime = new BigNumber(latestTimestamp).minus(
                reg.functionCallTimeLockSeconds[0],
            );
            const result = assetProxyOwner.assertValidFunctionCall.callAsync(
                transactionConfirmationTime,
                reg.functionSelectors[0],
                reg.destinations[0],
            );
            expect(result).to.be.fulfilled('');
        });
        it('should allow a custom timelock to be set to 0', async () => {});
    });

    blockchainTests.resets('executeTransaction', () => {
        function assertReceiverCalledFromLogs(
            logs: LogEntry[],
            data: string[],
            destinations: string[],
            txId: BigNumber,
            values?: BigNumber[],
        ): void {
            expect(logs.length).to.eq(data.length + 1);
            data.forEach((calldata: string, i: number) => {
                expect(logs[i].address).to.eq(destinations[i]);
                const contractCallLogArgs = (logs[i] as LogWithDecodedArgs<ContractCallReceiverEventArgs>).args;
                expect(contractCallLogArgs.functionSelector).to.eq(data[i].slice(0, 10));
                expect(contractCallLogArgs.data).to.eq(data[i]);
                const value = values === undefined ? constants.ZERO_AMOUNT : values[i];
                expect(contractCallLogArgs.value).to.bignumber.eq(value);
            });
            const executionLog = logs[data.length] as LogWithDecodedArgs<AssetProxyOwnerExecutionEventArgs>;
            expect(executionLog.event).to.eq('Execution');
            expect(executionLog.args.transactionId).to.bignumber.eq(txId);
        }
        it('should revert if the transaction is not confirmed by the required amount of signers', async () => {
            const data = [hexRandom()];
            const destinations = [receiver.address];
            const results = await assetProxyOwnerWrapper.submitTransactionAsync(data, destinations, signerAddresses[0]);
            const tx = assetProxyOwner.executeTransaction.awaitTransactionSuccessAsync(results.txId, {
                from: signerAddresses[1],
            });
            expect(tx).to.revertWith(RevertReason.TxNotFullyConfirmed);
        });
        it('should be able to execute an unregistered function after the default timelock with no value', async () => {
            const data = [hexRandom()];
            const destinations = [receiver.address];
            const results = await assetProxyOwnerWrapper.submitConfirmAndExecuteTransactionAsync(
                data,
                destinations,
                signerAddresses,
                DEFAULT_TIME_LOCK,
            );
            assertReceiverCalledFromLogs(results.executionTxReceipt.logs, data, destinations, results.txId);
        });
        it('should be able to execute an unregistered function after the default timelock with a value', async () => {
            const data = [hexRandom()];
            const destinations = [receiver.address];
            const values = [INITIAL_BALANCE];
            const results = await assetProxyOwnerWrapper.submitConfirmAndExecuteTransactionAsync(
                data,
                destinations,
                signerAddresses,
                DEFAULT_TIME_LOCK,
                { values },
            );
            assertReceiverCalledFromLogs(results.executionTxReceipt.logs, data, destinations, results.txId, values);
        });
        it('should be able to execute a registered function after a custom timelock with no value', async () => {
            const data = [hexRandom()];
            const destinations = [receiver.address];
            const newTimeLock = new BigNumber(DEFAULT_TIME_LOCK).dividedToIntegerBy(2);
            await assetProxyOwner.registerFunctionCallBypassWalet.awaitTransactionSuccessAsync(
                true,
                data[0].slice(0, 10),
                receiver.address,
                newTimeLock,
            );
            const results = await assetProxyOwnerWrapper.submitConfirmAndExecuteTransactionAsync(
                data,
                destinations,
                signerAddresses,
                newTimeLock.toNumber(),
            );
            assertReceiverCalledFromLogs(results.executionTxReceipt.logs, data, destinations, results.txId);
        });
        it('should be able to execute a registered function with no timelock', async () => {
            const data = [hexRandom()];
            const destinations = [receiver.address];
            const newTimeLock = constants.ZERO_AMOUNT;
            await assetProxyOwner.registerFunctionCallBypassWalet.awaitTransactionSuccessAsync(
                true,
                data[0].slice(0, 10),
                receiver.address,
                newTimeLock,
            );
            const results = await assetProxyOwnerWrapper.submitConfirmAndExecuteTransactionAsync(
                data,
                destinations,
                signerAddresses,
                newTimeLock.toNumber(),
            );
            assertReceiverCalledFromLogs(results.executionTxReceipt.logs, data, destinations, results.txId);
        });
        it('should be able to execute a registered function after a custom timelock with a value', async () => {
            const data = [hexRandom()];
            const destinations = [receiver.address];
            const newTimeLock = new BigNumber(DEFAULT_TIME_LOCK).dividedToIntegerBy(2);
            await assetProxyOwner.registerFunctionCallBypassWalet.awaitTransactionSuccessAsync(
                true,
                data[0].slice(0, 10),
                receiver.address,
                newTimeLock,
            );
            const values = [INITIAL_BALANCE];
            const results = await assetProxyOwnerWrapper.submitConfirmAndExecuteTransactionAsync(
                data,
                destinations,
                signerAddresses,
                newTimeLock.toNumber(),
                { values },
            );
            assertReceiverCalledFromLogs(results.executionTxReceipt.logs, data, destinations, results.txId, values);
        });
        it('should be able to call multiple functions with a single destination and no values', async () => {
            const data = [hexRandom(), hexRandom()];
            const destinations = [receiver.address, receiver.address];
            const results = await assetProxyOwnerWrapper.submitConfirmAndExecuteTransactionAsync(
                data,
                destinations,
                signerAddresses,
                DEFAULT_TIME_LOCK,
            );
            assertReceiverCalledFromLogs(results.executionTxReceipt.logs, data, destinations, results.txId);
        });
        it('should be able to call multiple functions with different destinations and values', async () => {
            const receiver2 = await ContractCallReceiverContract.deployFrom0xArtifactAsync(
                artifacts.ContractCallReceiver,
                env.provider,
                env.txDefaults,
                {},
            );
            const data = [hexRandom(), hexRandom()];
            const destinations = [receiver.address, receiver2.address];
            const values = [INITIAL_BALANCE.dividedToIntegerBy(4), INITIAL_BALANCE.dividedToIntegerBy(3)];
            const results = await assetProxyOwnerWrapper.submitConfirmAndExecuteTransactionAsync(
                data,
                destinations,
                signerAddresses,
                DEFAULT_TIME_LOCK,
                { values },
            );
            assertReceiverCalledFromLogs(results.executionTxReceipt.logs, data, destinations, results.txId, values);
        });
        it('should be able to call a combination of registered and unregistered functions', async () => {
            const data = [hexRandom(), hexRandom()];
            const destinations = [receiver.address, receiver.address];
            const newTimeLock = new BigNumber(DEFAULT_TIME_LOCK).dividedToIntegerBy(2);
            await assetProxyOwner.registerFunctionCallBypassWalet.awaitTransactionSuccessAsync(
                true,
                data[0].slice(0, 10),
                receiver.address,
                newTimeLock,
            );
            const results = await assetProxyOwnerWrapper.submitConfirmAndExecuteTransactionAsync(
                data,
                destinations,
                signerAddresses,
                DEFAULT_TIME_LOCK,
            );
            assertReceiverCalledFromLogs(results.executionTxReceipt.logs, data, destinations, results.txId);
        });
        it('should fail if a single function has not passed the timelock', async () => {
            const data = [hexRandom(), hexRandom()];
            const destinations = [receiver.address, receiver.address];
            const newTimeLock = new BigNumber(DEFAULT_TIME_LOCK).dividedToIntegerBy(2);
            await assetProxyOwner.registerFunctionCallBypassWalet.awaitTransactionSuccessAsync(
                true,
                data[0].slice(0, 10),
                receiver.address,
                newTimeLock,
            );
            const tx = assetProxyOwnerWrapper.submitConfirmAndExecuteTransactionAsync(
                data,
                destinations,
                signerAddresses,
                newTimeLock.toNumber(),
            );
            expect(tx).to.revertWith(RevertReason.DefaultTimeLockIncomplete);
        });
        it('should be able to execute a transaction if called by any address', async () => {
            const data = [hexRandom()];
            const destinations = [receiver.address];
            const results = await assetProxyOwnerWrapper.submitConfirmAndExecuteTransactionAsync(
                data,
                destinations,
                signerAddresses,
                DEFAULT_TIME_LOCK,
                { executeFromAddress: notSignerAddress },
            );
            assertReceiverCalledFromLogs(results.executionTxReceipt.logs, data, destinations, results.txId);
        });
        it('should be able to send value without data if past the default timelock', async () => {
            // NOTE: elements of `data` must be at least 4 bytes long
            const data = [constants.NULL_BYTES4];
            const destinations = [receiver.address];
            const results = await assetProxyOwnerWrapper.submitConfirmAndExecuteTransactionAsync(
                data,
                destinations,
                signerAddresses,
                DEFAULT_TIME_LOCK,
            );
            assertReceiverCalledFromLogs(results.executionTxReceipt.logs, data, destinations, results.txId);
        });
        it('should not call a function if the input array lengths are 0', async () => {
            const data: string[] = [];
            const destinations: string[] = [];
            const results = await assetProxyOwnerWrapper.submitConfirmAndExecuteTransactionAsync(
                data,
                destinations,
                signerAddresses,
                DEFAULT_TIME_LOCK,
            );
            assertReceiverCalledFromLogs(results.executionTxReceipt.logs, data, destinations, results.txId);
        });
        it('should revert if destinations.length != data.length', async () => {
            const data = [hexRandom(), hexRandom()];
            const destinations = [receiver.address];
            const tx = assetProxyOwnerWrapper.submitConfirmAndExecuteTransactionAsync(
                data,
                destinations,
                signerAddresses,
                DEFAULT_TIME_LOCK,
            );
            expect(tx).to.revertWith(RevertReason.EqualLengthsRequired);
        });
        it('should revert if values.length != data.length', async () => {
            const data = [hexRandom()];
            const destinations = [receiver.address];
            const values = [constants.ZERO_AMOUNT, constants.ZERO_AMOUNT];
            const tx = assetProxyOwnerWrapper.submitConfirmAndExecuteTransactionAsync(
                data,
                destinations,
                signerAddresses,
                DEFAULT_TIME_LOCK,
                { values },
            );
            expect(tx).to.revertWith(RevertReason.EqualLengthsRequired);
        });
        it('should revert if the transaction is already executed', async () => {
            const data = [hexRandom()];
            const destinations = [receiver.address];
            const results = await assetProxyOwnerWrapper.submitConfirmAndExecuteTransactionAsync(
                data,
                destinations,
                signerAddresses,
                DEFAULT_TIME_LOCK,
            );
            const tx = assetProxyOwner.executeTransaction.awaitTransactionSuccessAsync(results.txId);
            expect(tx).to.revertWith(RevertReason.TxAlreadyExecuted);
        });
        it('should be able to call registerFunctionCall after the default timelock', async () => {
            const reg = createFunctionRegistration(1, 1, 1);
            const data = [
                assetProxyOwner.registerFunctionCall.getABIEncodedTransactionData(
                    true,
                    reg.functionSelectors[0],
                    reg.destinations[0],
                    reg.functionCallTimeLockSeconds[0],
                ),
            ];
            const destinations = [assetProxyOwner.address];
            const results = await assetProxyOwnerWrapper.submitConfirmAndExecuteTransactionAsync(
                data,
                destinations,
                signerAddresses,
                DEFAULT_TIME_LOCK,
            );
            expect(results.executionTxReceipt.logs.length).to.eq(2);
            const registrationLogArgs = (results.executionTxReceipt.logs[0] as LogWithDecodedArgs<
                AssetProxyOwnerFunctionCallTimeLockRegistrationEventArgs
            >).args;
            expect(registrationLogArgs.destination).to.eq(reg.destinations[0]);
            expect(registrationLogArgs.functionSelector).to.eq(reg.functionSelectors[0]);
            expect(registrationLogArgs.hasCustomTimeLock).to.eq(true);
            expect(registrationLogArgs.newSecondsTimeLocked).to.bignumber.eq(reg.functionCallTimeLockSeconds[0]);
        });
    });
});
