import { blockchainTests, constants, expect, verifyEventsFromLogs } from '@0x/contracts-test-utils';
import { StakingRevertErrors } from '@0x/order-utils';
import { AuthorizableRevertErrors, BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { artifacts } from '../artifacts';
import {
    StakingProxyEvents,
    TestProxyDestinationContract,
    TestProxyDestinationEvents,
    TestStakingProxyUnitContract,
} from '../wrappers';

import { constants as stakingConstants } from '.../src/constants';

blockchainTests.resets('StakingProxy unit tests', env => {
    const testString = 'Hello, World!';
    const testRevertString = 'Goodbye, World!';
    let accounts: string[];
    let owner: string;
    let authorizedAddress: string;
    let notAuthorizedAddresses: string[];
    let testProxyContract: TestStakingProxyUnitContract;
    let testContractViaProxy: TestProxyDestinationContract;
    let testContract: TestProxyDestinationContract;
    let testContract2: TestProxyDestinationContract;

    before(async () => {
        // Create accounts
        accounts = await env.getAccountAddressesAsync();
        [owner, authorizedAddress, ...notAuthorizedAddresses] = accounts;

        // Deploy contracts
        testContract = await TestProxyDestinationContract.deployFrom0xArtifactAsync(
            artifacts.TestProxyDestination,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        testContract2 = await TestProxyDestinationContract.deployFrom0xArtifactAsync(
            artifacts.TestProxyDestination,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        testProxyContract = await TestStakingProxyUnitContract.deployFrom0xArtifactAsync(
            artifacts.TestStakingProxyUnit,
            env.provider,
            env.txDefaults,
            artifacts,
            testContract.address,
        );
        const logDecoderDependencies = _.mapValues(artifacts, v => v.compilerOutput.abi);
        testContractViaProxy = new TestProxyDestinationContract(
            testProxyContract.address,
            env.provider,
            env.txDefaults,
            logDecoderDependencies,
        );

        // Add authorized address to Staking Proxy
        await testProxyContract.addAuthorizedAddress.sendTransactionAsync(authorizedAddress, { from: owner });
    });

    describe('Fallback function', () => {
        it('should pass back the return value of the destination contract', async () => {
            const returnValue = await testContractViaProxy.echo.callAsync(testString);
            expect(returnValue).to.equal(testString);
        });

        it('should revert with correct value when destination reverts', async () => {
            return expect(testContractViaProxy.die.callAsync()).to.revertWith(testRevertString);
        });

        it('should revert if no staking contract is attached', async () => {
            await testProxyContract.detachStakingContract.awaitTransactionSuccessAsync({ from: authorizedAddress });
            const expectedError = new StakingRevertErrors.ProxyDestinationCannotBeNilError();
            const tx = testContractViaProxy.echo.callAsync(testString);
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('attachStakingContract', () => {
        it('should successfully attaching a new staking contract', async () => {
            // Cache existing staking contract and attach a new one
            const initStakingContractAddress = await testProxyContract.stakingContract.callAsync();
            const txReceipt = await testProxyContract.attachStakingContract.awaitTransactionSuccessAsync(
                testContract2.address,
                { from: authorizedAddress },
            );

            // Validate `ContractAttachedToProxy` event
            verifyEventsFromLogs(
                txReceipt.logs,
                [
                    {
                        newStakingContractAddress: testContract2.address,
                    },
                ],
                StakingProxyEvents.StakingContractAttachedToProxy,
            );

            // Check that `init` was called on destination contract
            verifyEventsFromLogs(
                txReceipt.logs,
                [
                    {
                        initCalled: true,
                    },
                ],
                TestProxyDestinationEvents.InitCalled,
            );

            // Validate new staking contract address
            const finalStakingContractAddress = await testProxyContract.stakingContract.callAsync();
            expect(finalStakingContractAddress).to.be.equal(testContract2.address);
            expect(finalStakingContractAddress).to.not.equal(initStakingContractAddress);
        });

        it('should revert if call to `init` on new staking contract fails', async () => {
            await testProxyContract.setInitFailFlag.awaitTransactionSuccessAsync();
            const tx = testProxyContract.attachStakingContract.awaitTransactionSuccessAsync(testContract2.address, {
                from: authorizedAddress,
            });
            const expectedError = 'INIT_FAIL_FLAG_SET';
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if called by unauthorized address', async () => {
            const tx = testProxyContract.attachStakingContract.awaitTransactionSuccessAsync(testContract2.address, {
                from: notAuthorizedAddresses[0],
            });
            const expectedError = new AuthorizableRevertErrors.SenderNotAuthorizedError(notAuthorizedAddresses[0]);
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('detachStakingContract', () => {
        it('should detach staking contract', async () => {
            // Cache existing staking contract and attach a new one
            const initStakingContractAddress = await testProxyContract.stakingContract.callAsync();
            const txReceipt = await testProxyContract.detachStakingContract.awaitTransactionSuccessAsync({
                from: authorizedAddress,
            });

            // Validate that event was emitted
            verifyEventsFromLogs(txReceipt.logs, [{}], StakingProxyEvents.StakingContractDetachedFromProxy);

            // Validate staking contract address was unset
            const finalStakingContractAddress = await testProxyContract.stakingContract.callAsync();
            expect(finalStakingContractAddress).to.be.equal(stakingConstants.NIL_ADDRESS);
            expect(finalStakingContractAddress).to.not.equal(initStakingContractAddress);
        });

        it('should revert if called by unauthorized address', async () => {
            const tx = testProxyContract.detachStakingContract.awaitTransactionSuccessAsync({
                from: notAuthorizedAddresses[0],
            });
            const expectedError = new AuthorizableRevertErrors.SenderNotAuthorizedError(notAuthorizedAddresses[0]);
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('batchExecute', () => {
        it('should execute no-op if no calls to make', async () => {
            await testProxyContract.batchExecute.awaitTransactionSuccessAsync([]);
        });

        it('should call one function and return the output', async () => {
            const calls = [testContract.echo.getABIEncodedTransactionData(testString)];
            const rawResults = await testProxyContract.batchExecute.callAsync(calls);
            expect(rawResults.length).to.equal(1);
            const returnValues = [testContract.echo.getABIDecodedReturnData(rawResults[0])];
            expect(returnValues[0]).to.equal(testString);
        });

        it('should call multiple functions and return their outputs', async () => {
            const calls = [
                testContract.echo.getABIEncodedTransactionData(testString),
                testContract.doMath.getABIEncodedTransactionData(new BigNumber(2), new BigNumber(1)),
            ];
            const rawResults = await testProxyContract.batchExecute.callAsync(calls);
            expect(rawResults.length).to.equal(2);
            const returnValues = [
                testContract.echo.getABIDecodedReturnData(rawResults[0]),
                testContract.doMath.getABIDecodedReturnData(rawResults[1]),
            ];
            expect(returnValues[0]).to.equal(testString);
            expect(returnValues[1][0]).to.bignumber.equal(new BigNumber(3));
            expect(returnValues[1][1]).to.bignumber.equal(new BigNumber(1));
        });

        it('should revert if a call reverts', async () => {
            const calls = [
                testContract.echo.getABIEncodedTransactionData(testString),
                testContract.die.getABIEncodedTransactionData(),
                testContract.doMath.getABIEncodedTransactionData(new BigNumber(2), new BigNumber(1)),
            ];
            const tx = testProxyContract.batchExecute.callAsync(calls);
            const expectedError = testRevertString;
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if no staking contract is attached', async () => {
            await testProxyContract.detachStakingContract.awaitTransactionSuccessAsync({ from: authorizedAddress });
            const calls = [testContract.echo.getABIEncodedTransactionData(testString)];

            const tx = testProxyContract.batchExecute.callAsync(calls);
            const expectedError = new StakingRevertErrors.ProxyDestinationCannotBeNilError();
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('assertValidStorageParams', () => {
        const validStorageParams = {
            epochDurationInSeconds: new BigNumber(stakingConstants.ONE_DAY_IN_SECONDS * 5),
            cobbDouglasAlphaNumerator: new BigNumber(1),
            cobbDouglasAlphaDenominator: new BigNumber(1),
            rewardDelegatedStakeWeight: constants.PPM_DENOMINATOR,
            minimumPoolStake: new BigNumber(100),
        };
        it('should not revert if all storage params are valid', async () => {
            await testProxyContract.setTestStorageParams.awaitTransactionSuccessAsync(validStorageParams);
            await testProxyContract.assertValidStorageParams.callAsync();
        });
        it('should revert if `epochDurationInSeconds` is less than 5 days', async () => {
            const invalidStorageParams = {
                ...validStorageParams,
                epochDurationInSeconds: new BigNumber(0),
            };
            await testProxyContract.setTestStorageParams.awaitTransactionSuccessAsync(invalidStorageParams);
            const tx = testProxyContract.assertValidStorageParams.callAsync();
            const expectedError = new StakingRevertErrors.InvalidParamValueError(
                StakingRevertErrors.InvalidParamValueErrorCodes.InvalidEpochDuration,
            );
            return expect(tx).to.revertWith(expectedError);
        });
        it('should revert if `epochDurationInSeconds` is greater than 30 days', async () => {
            const invalidStorageParams = {
                ...validStorageParams,
                epochDurationInSeconds: new BigNumber(stakingConstants.ONE_DAY_IN_SECONDS * 31),
            };
            await testProxyContract.setTestStorageParams.awaitTransactionSuccessAsync(invalidStorageParams);
            const tx = testProxyContract.assertValidStorageParams.callAsync();
            const expectedError = new StakingRevertErrors.InvalidParamValueError(
                StakingRevertErrors.InvalidParamValueErrorCodes.InvalidEpochDuration,
            );
            return expect(tx).to.revertWith(expectedError);
        });
        it('should revert if `cobbDouglasAlphaNumerator` is greater than `cobbDouglasAlphaDenominator`', async () => {
            const invalidStorageParams = {
                ...validStorageParams,
                cobbDouglasAlphaNumerator: new BigNumber(2),
                cobbDouglasAlphaDenominator: new BigNumber(1),
            };
            await testProxyContract.setTestStorageParams.awaitTransactionSuccessAsync(invalidStorageParams);
            const tx = testProxyContract.assertValidStorageParams.callAsync();
            const expectedError = new StakingRevertErrors.InvalidParamValueError(
                StakingRevertErrors.InvalidParamValueErrorCodes.InvalidCobbDouglasAlpha,
            );
            return expect(tx).to.revertWith(expectedError);
        });
        it('should revert if `cobbDouglasAlphaDenominator` equals zero', async () => {
            const invalidStorageParams = {
                ...validStorageParams,
                cobbDouglasAlphaDenominator: new BigNumber(0),
            };
            await testProxyContract.setTestStorageParams.awaitTransactionSuccessAsync(invalidStorageParams);
            const tx = testProxyContract.assertValidStorageParams.callAsync();
            const expectedError = new StakingRevertErrors.InvalidParamValueError(
                StakingRevertErrors.InvalidParamValueErrorCodes.InvalidCobbDouglasAlpha,
            );
            return expect(tx).to.revertWith(expectedError);
        });
        it('should revert if `rewardDelegatedStakeWeight` is greater than PPM_DENOMINATOR', async () => {
            const invalidStorageParams = {
                ...validStorageParams,
                rewardDelegatedStakeWeight: new BigNumber(constants.PPM_DENOMINATOR + 1),
            };
            await testProxyContract.setTestStorageParams.awaitTransactionSuccessAsync(invalidStorageParams);
            const tx = testProxyContract.assertValidStorageParams.callAsync();
            const expectedError = new StakingRevertErrors.InvalidParamValueError(
                StakingRevertErrors.InvalidParamValueErrorCodes.InvalidRewardDelegatedStakeWeight,
            );
            return expect(tx).to.revertWith(expectedError);
        });
        it('should revert if `minimumPoolStake` is less than two', async () => {
            const invalidStorageParams = {
                ...validStorageParams,
                minimumPoolStake: new BigNumber(1),
            };
            await testProxyContract.setTestStorageParams.awaitTransactionSuccessAsync(invalidStorageParams);
            const tx = testProxyContract.assertValidStorageParams.callAsync();
            const expectedError = new StakingRevertErrors.InvalidParamValueError(
                StakingRevertErrors.InvalidParamValueErrorCodes.InvalidMinimumPoolStake,
            );
            return expect(tx).to.revertWith(expectedError);
        });
    });
});
// tslint:disable: max-file-line-count
