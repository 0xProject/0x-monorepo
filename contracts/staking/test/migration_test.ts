import { blockchainTests, constants, expect, filterLogsToArguments } from '@0x/contracts-test-utils';
import { AuthorizableRevertErrors, BigNumber, StringRevertError } from '@0x/utils';

import {
    artifacts,
    StakingContract,
    StakingProxyContract,
    StakingRevertErrors,
    TestAssertStorageParamsContract,
    TestInitTargetContract,
    TestStakingProxyContract,
    TestStakingProxyStakingContractAttachedToProxyEventArgs,
} from '../src/';

import { constants as stakingConstants } from './utils/constants';

blockchainTests('Migration tests', env => {
    let authorizedAddress: string;
    let notAuthorizedAddress: string;

    let stakingContract: StakingContract;

    before(async () => {
        [authorizedAddress, notAuthorizedAddress] = await env.getAccountAddressesAsync();
        stakingContract = await StakingContract.deployFrom0xArtifactAsync(
            artifacts.TestStakingNoWETH,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        await stakingContract.addAuthorizedAddress.awaitTransactionSuccessAsync(authorizedAddress);
    });

    describe('StakingProxy', () => {
        const INIT_REVERT_ERROR = new StringRevertError('FORCED_INIT_REVERT');
        const STORAGE_PARAMS_REVERT_ERROR = new StringRevertError('FORCED_STORAGE_PARAMS_REVERT');
        let initTargetContract: TestInitTargetContract;
        let revertAddress: string;

        async function deployStakingProxyAsync(stakingContractAddress?: string): Promise<TestStakingProxyContract> {
            const proxyContract = await TestStakingProxyContract.deployFrom0xArtifactAsync(
                artifacts.TestStakingProxy,
                env.provider,
                env.txDefaults,
                artifacts,
                stakingContractAddress || constants.NULL_ADDRESS,
            );
            await proxyContract.addAuthorizedAddress.awaitTransactionSuccessAsync(authorizedAddress);
            return proxyContract;
        }

        before(async () => {
            [authorizedAddress, notAuthorizedAddress] = await env.getAccountAddressesAsync();
            initTargetContract = await TestInitTargetContract.deployFrom0xArtifactAsync(
                artifacts.TestInitTarget,
                env.provider,
                env.txDefaults,
                artifacts,
            );
            revertAddress = await initTargetContract.SHOULD_REVERT_ADDRESS.callAsync();
        });

        async function enableInitRevertsAsync(): Promise<void> {
            // Deposit some ether into `revertAddress` to signal `initTargetContract`
            // to fail.
            await env.web3Wrapper.awaitTransactionMinedAsync(
                await env.web3Wrapper.sendTransactionAsync({
                    ...env.txDefaults,
                    from: authorizedAddress,
                    to: revertAddress,
                    data: constants.NULL_BYTES,
                    value: new BigNumber(1),
                }),
            );
        }

        async function assertInitStateAsync(proxyContract: TestStakingProxyContract): Promise<void> {
            const [senderAddress, thisAddress] = await initTargetContract.getInitState.callAsync({
                to: proxyContract.address,
            });
            expect(senderAddress).to.eq(authorizedAddress);
            expect(thisAddress).to.eq(proxyContract.address);
            const attachedAddress = await proxyContract.stakingContract.callAsync();
            expect(attachedAddress).to.eq(initTargetContract.address);
        }

        blockchainTests.resets('StakingProxy constructor', async () => {
            it('calls init() and attaches the contract', async () => {
                const proxyContract = await deployStakingProxyAsync(initTargetContract.address);
                await assertInitStateAsync(proxyContract);
            });

            it('reverts if init() reverts', async () => {
                await enableInitRevertsAsync();
                const tx = deployStakingProxyAsync(initTargetContract.address);
                return expect(tx).to.revertWith(INIT_REVERT_ERROR);
            });

            it('reverts if assertValidStorageParams() fails', async () => {
                const tx = deployStakingProxyAsync(revertAddress);
                return expect(tx).to.revertWith(STORAGE_PARAMS_REVERT_ERROR);
            });

            it('should set the correct initial params', async () => {
                const stakingProxyContractAddress = (await StakingProxyContract.deployFrom0xArtifactAsync(
                    artifacts.StakingProxy,
                    env.provider,
                    env.txDefaults,
                    artifacts,
                    stakingContract.address,
                )).address;

                const stakingProxyContract = new StakingContract(
                    stakingProxyContractAddress,
                    env.provider,
                    env.txDefaults,
                );
                const params = await stakingProxyContract.getParams.callAsync();
                expect(params[0]).to.bignumber.eq(stakingConstants.DEFAULT_PARAMS.epochDurationInSeconds);
                expect(params[1]).to.bignumber.eq(stakingConstants.DEFAULT_PARAMS.rewardDelegatedStakeWeight);
                expect(params[2]).to.bignumber.eq(stakingConstants.DEFAULT_PARAMS.minimumPoolStake);
                expect(params[3]).to.bignumber.eq(stakingConstants.DEFAULT_PARAMS.cobbDouglasAlphaNumerator);
                expect(params[4]).to.bignumber.eq(stakingConstants.DEFAULT_PARAMS.cobbDouglasAlphaDenominator);
            });
        });

        blockchainTests.resets('attachStakingContract()', async () => {
            let proxyContract: TestStakingProxyContract;

            before(async () => {
                proxyContract = await deployStakingProxyAsync();
            });

            it('throws if not called by an authorized address', async () => {
                const tx = proxyContract.attachStakingContract.awaitTransactionSuccessAsync(
                    initTargetContract.address,
                    {
                        from: notAuthorizedAddress,
                    },
                );
                const expectedError = new AuthorizableRevertErrors.SenderNotAuthorizedError(notAuthorizedAddress);
                return expect(tx).to.revertWith(expectedError);
            });

            it('calls init() and attaches the contract', async () => {
                await proxyContract.attachStakingContract.awaitTransactionSuccessAsync(initTargetContract.address);
                await assertInitStateAsync(proxyContract);
            });

            it('emits a `StakingContractAttachedToProxy` event', async () => {
                const receipt = await proxyContract.attachStakingContract.awaitTransactionSuccessAsync(
                    initTargetContract.address,
                );
                const logsArgs = filterLogsToArguments<TestStakingProxyStakingContractAttachedToProxyEventArgs>(
                    receipt.logs,
                    'StakingContractAttachedToProxy',
                );
                expect(logsArgs.length).to.eq(1);
                for (const args of logsArgs) {
                    expect(args.newStakingContractAddress).to.eq(initTargetContract.address);
                }
                await assertInitStateAsync(proxyContract);
            });

            it('reverts if init() reverts', async () => {
                await enableInitRevertsAsync();
                const tx = proxyContract.attachStakingContract.awaitTransactionSuccessAsync(initTargetContract.address);
                return expect(tx).to.revertWith(INIT_REVERT_ERROR);
            });

            it('reverts if assertValidStorageParams() fails', async () => {
                const tx = proxyContract.attachStakingContract.awaitTransactionSuccessAsync(revertAddress);
                return expect(tx).to.revertWith(STORAGE_PARAMS_REVERT_ERROR);
            });
        });

        blockchainTests.resets('upgrades', async () => {
            it('modifies prior state', async () => {
                const proxyContract = await deployStakingProxyAsync(initTargetContract.address);
                await proxyContract.attachStakingContract.awaitTransactionSuccessAsync(initTargetContract.address);
                const initCounter = await initTargetContract.getInitCounter.callAsync({ to: proxyContract.address });
                expect(initCounter).to.bignumber.eq(2);
            });
        });
    });

    blockchainTests.resets('Staking.init()', async () => {
        it('throws if not called by an authorized address', async () => {
            const tx = stakingContract.init.awaitTransactionSuccessAsync({
                from: notAuthorizedAddress,
            });
            const expectedError = new AuthorizableRevertErrors.SenderNotAuthorizedError(notAuthorizedAddress);
            return expect(tx).to.revertWith(expectedError);
        });

        it('throws if already intitialized', async () => {
            await stakingContract.init.awaitTransactionSuccessAsync();
            const tx = stakingContract.init.awaitTransactionSuccessAsync();
            const expectedError = new StakingRevertErrors.InitializationError();
            return expect(tx).to.revertWith(expectedError);
        });
    });

    blockchainTests.resets('assertValidStorageParams', async () => {
        let proxyContract: TestAssertStorageParamsContract;
        const fiveDays = new BigNumber(5 * 24 * 60 * 60);
        const thirtyDays = new BigNumber(30 * 24 * 60 * 60);
        before(async () => {
            proxyContract = await TestAssertStorageParamsContract.deployFrom0xArtifactAsync(
                artifacts.TestAssertStorageParams,
                env.provider,
                env.txDefaults,
                artifacts,
            );
        });

        it('succeeds if all params are valid', async () => {
            const tx = proxyContract.setAndAssertParams.awaitTransactionSuccessAsync(stakingConstants.DEFAULT_PARAMS);
            expect(tx).to.be.fulfilled('');
        });

        it('reverts if epoch duration is < 5 days', async () => {
            const tx = proxyContract.setAndAssertParams.awaitTransactionSuccessAsync({
                ...stakingConstants.DEFAULT_PARAMS,
                epochDurationInSeconds: fiveDays.minus(1),
            });
            const expectedError = new StakingRevertErrors.InvalidParamValueError(
                StakingRevertErrors.InvalidParamValueErrorCodes.InvalidEpochDuration,
            );
            return expect(tx).to.revertWith(expectedError);
        });
        it('reverts if epoch duration is > 30 days', async () => {
            const tx = proxyContract.setAndAssertParams.awaitTransactionSuccessAsync({
                ...stakingConstants.DEFAULT_PARAMS,
                epochDurationInSeconds: thirtyDays.plus(1),
            });
            const expectedError = new StakingRevertErrors.InvalidParamValueError(
                StakingRevertErrors.InvalidParamValueErrorCodes.InvalidEpochDuration,
            );
            return expect(tx).to.revertWith(expectedError);
        });
        it('succeeds if epoch duration is 5 days', async () => {
            const tx = proxyContract.setAndAssertParams.awaitTransactionSuccessAsync({
                ...stakingConstants.DEFAULT_PARAMS,
                epochDurationInSeconds: fiveDays,
            });
            return expect(tx).to.be.fulfilled('');
        });
        it('succeeds if epoch duration is 30 days', async () => {
            const tx = proxyContract.setAndAssertParams.awaitTransactionSuccessAsync({
                ...stakingConstants.DEFAULT_PARAMS,
                epochDurationInSeconds: thirtyDays,
            });
            return expect(tx).to.be.fulfilled('');
        });
        it('reverts if alpha denominator is 0', async () => {
            const tx = proxyContract.setAndAssertParams.awaitTransactionSuccessAsync({
                ...stakingConstants.DEFAULT_PARAMS,
                cobbDouglasAlphaDenominator: constants.ZERO_AMOUNT,
            });
            const expectedError = new StakingRevertErrors.InvalidParamValueError(
                StakingRevertErrors.InvalidParamValueErrorCodes.InvalidCobbDouglasAlpha,
            );
            return expect(tx).to.revertWith(expectedError);
        });
        it('reverts if alpha > 1', async () => {
            const tx = proxyContract.setAndAssertParams.awaitTransactionSuccessAsync({
                ...stakingConstants.DEFAULT_PARAMS,
                cobbDouglasAlphaNumerator: new BigNumber(101),
                cobbDouglasAlphaDenominator: new BigNumber(100),
            });
            const expectedError = new StakingRevertErrors.InvalidParamValueError(
                StakingRevertErrors.InvalidParamValueErrorCodes.InvalidCobbDouglasAlpha,
            );
            return expect(tx).to.revertWith(expectedError);
        });
        it('succeeds if alpha == 1', async () => {
            const tx = proxyContract.setAndAssertParams.awaitTransactionSuccessAsync({
                ...stakingConstants.DEFAULT_PARAMS,
                cobbDouglasAlphaNumerator: new BigNumber(1),
                cobbDouglasAlphaDenominator: new BigNumber(1),
            });
            return expect(tx).to.be.fulfilled('');
        });
        it('succeeds if alpha == 0', async () => {
            const tx = proxyContract.setAndAssertParams.awaitTransactionSuccessAsync({
                ...stakingConstants.DEFAULT_PARAMS,
                cobbDouglasAlphaNumerator: constants.ZERO_AMOUNT,
                cobbDouglasAlphaDenominator: new BigNumber(1),
            });
            return expect(tx).to.be.fulfilled('');
        });
        it('reverts if delegation weight is > 100%', async () => {
            const tx = proxyContract.setAndAssertParams.awaitTransactionSuccessAsync({
                ...stakingConstants.DEFAULT_PARAMS,
                rewardDelegatedStakeWeight: new BigNumber(stakingConstants.PPM).plus(1),
            });
            const expectedError = new StakingRevertErrors.InvalidParamValueError(
                StakingRevertErrors.InvalidParamValueErrorCodes.InvalidRewardDelegatedStakeWeight,
            );
            return expect(tx).to.revertWith(expectedError);
        });
        it('succeeds if delegation weight is 100%', async () => {
            const tx = proxyContract.setAndAssertParams.awaitTransactionSuccessAsync({
                ...stakingConstants.DEFAULT_PARAMS,
                rewardDelegatedStakeWeight: new BigNumber(stakingConstants.PPM),
            });
            return expect(tx).to.be.fulfilled('');
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
