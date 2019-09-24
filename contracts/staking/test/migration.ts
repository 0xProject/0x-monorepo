import { blockchainTests, constants, expect, filterLogsToArguments, randomAddress } from '@0x/contracts-test-utils';
import { StakingRevertErrors } from '@0x/order-utils';
import { AuthorizableRevertErrors, BigNumber, StringRevertError } from '@0x/utils';

import {
    artifacts,
    StakingContract,
    StakingProxyContract,
    TestAssertStorageParamsContract,
    TestInitTargetContract,
    TestInitTargetInitAddressesEventArgs,
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
    });

    describe('StakingProxy', () => {
        const INIT_REVERT_ERROR = new StringRevertError('FORCED_INIT_REVERT');
        const STORAGE_PARAMS_REVERT_ERROR = new StringRevertError('FORCED_STORAGE_PARAMS_REVERT');
        let initTargetContract: TestInitTargetContract;
        let revertAddress: string;

        async function deployStakingProxyAsync(stakingContractAddress?: string): Promise<TestStakingProxyContract> {
            return TestStakingProxyContract.deployFrom0xArtifactAsync(
                artifacts.TestStakingProxy,
                env.provider,
                env.txDefaults,
                artifacts,
                stakingContractAddress || constants.NULL_ADDRESS,
            );
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
                const wethProxyAddress = randomAddress();
                const zrxVaultAddress = randomAddress();

                const stakingProxyContractAddress = (await StakingProxyContract.deployFrom0xArtifactAsync(
                    artifacts.StakingProxy,
                    env.provider,
                    env.txDefaults,
                    artifacts,
                    stakingContract.address,
                    stakingContract.address,
                    wethProxyAddress,
                    zrxVaultAddress,
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
                expect(params[3]).to.bignumber.eq(stakingConstants.DEFAULT_PARAMS.maximumMakersInPool);
                expect(params[4]).to.bignumber.eq(stakingConstants.DEFAULT_PARAMS.cobbDouglasAlphaNumerator);
                expect(params[5]).to.bignumber.eq(stakingConstants.DEFAULT_PARAMS.cobbDouglasAlphaDenominator);
                expect(params[6]).to.eq(wethProxyAddress);
                expect(params[7]).to.eq(zrxVaultAddress);
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
                    constants.NULL_ADDRESS,
                    constants.NULL_ADDRESS,
                    {
                        from: notAuthorizedAddress,
                    },
                );
                const expectedError = new AuthorizableRevertErrors.SenderNotAuthorizedError(notAuthorizedAddress);
                return expect(tx).to.revertWith(expectedError);
            });

            it('calls init() and attaches the contract', async () => {
                await proxyContract.attachStakingContract.awaitTransactionSuccessAsync(
                    initTargetContract.address,
                    constants.NULL_ADDRESS,
                    constants.NULL_ADDRESS,
                );
                await assertInitStateAsync(proxyContract);
            });

            it('emits a `StakingContractAttachedToProxy` event', async () => {
                const receipt = await proxyContract.attachStakingContract.awaitTransactionSuccessAsync(
                    initTargetContract.address,
                    constants.NULL_ADDRESS,
                    constants.NULL_ADDRESS,
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
                const tx = proxyContract.attachStakingContract.awaitTransactionSuccessAsync(
                    initTargetContract.address,
                    constants.NULL_ADDRESS,
                    constants.NULL_ADDRESS,
                );
                return expect(tx).to.revertWith(INIT_REVERT_ERROR);
            });

            it('calls init with initialized addresses if passed in args are null', async () => {
                const wethProxyAddress = randomAddress();
                const zrxVaultAddress = randomAddress();
                await proxyContract.setAddressParams.awaitTransactionSuccessAsync(wethProxyAddress, zrxVaultAddress);
                const receipt = await proxyContract.attachStakingContract.awaitTransactionSuccessAsync(
                    initTargetContract.address,
                    constants.NULL_ADDRESS,
                    constants.NULL_ADDRESS,
                );
                const logsArgs = filterLogsToArguments<TestInitTargetInitAddressesEventArgs>(
                    receipt.logs,
                    'InitAddresses',
                );
                for (const args of logsArgs) {
                    expect(args.wethProxyAddress).to.eq(wethProxyAddress);
                    expect(args.zrxVaultAddress).to.eq(zrxVaultAddress);
                }
            });
            it('calls init with passed in addresses if they are not null', async () => {
                const wethProxyAddress = randomAddress();
                const zrxVaultAddress = randomAddress();
                const receipt = await proxyContract.attachStakingContract.awaitTransactionSuccessAsync(
                    initTargetContract.address,
                    wethProxyAddress,
                    zrxVaultAddress,
                );
                const logsArgs = filterLogsToArguments<TestInitTargetInitAddressesEventArgs>(
                    receipt.logs,
                    'InitAddresses',
                );
                for (const args of logsArgs) {
                    expect(args.wethProxyAddress).to.eq(wethProxyAddress);
                    expect(args.zrxVaultAddress).to.eq(zrxVaultAddress);
                }
            });

            it('reverts if assertValidStorageParams() fails', async () => {
                const tx = proxyContract.attachStakingContract.awaitTransactionSuccessAsync(
                    revertAddress,
                    constants.NULL_ADDRESS,
                    constants.NULL_ADDRESS,
                );
                return expect(tx).to.revertWith(STORAGE_PARAMS_REVERT_ERROR);
            });
        });

        blockchainTests.resets('upgrades', async () => {
            it('modifies prior state', async () => {
                const proxyContract = await deployStakingProxyAsync(initTargetContract.address);
                await proxyContract.attachStakingContract.awaitTransactionSuccessAsync(
                    initTargetContract.address,
                    constants.NULL_ADDRESS,
                    constants.NULL_ADDRESS,
                );
                const initCounter = await initTargetContract.getInitCounter.callAsync({ to: proxyContract.address });
                expect(initCounter).to.bignumber.eq(2);
            });
        });
    });

    blockchainTests.resets('Staking.init()', async () => {
        it('throws if not called by an authorized address', async () => {
            const tx = stakingContract.init.awaitTransactionSuccessAsync(randomAddress(), randomAddress(), {
                from: notAuthorizedAddress,
            });
            const expectedError = new AuthorizableRevertErrors.SenderNotAuthorizedError(notAuthorizedAddress);
            return expect(tx).to.revertWith(expectedError);
        });

        it('throws if already intitialized', async () => {
            await stakingContract.init.awaitTransactionSuccessAsync(randomAddress(), randomAddress());
            const tx = stakingContract.init.awaitTransactionSuccessAsync(randomAddress(), randomAddress());
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
                StakingRevertErrors.InvalidParamValueErrorCode.InvalidEpochDuration,
            );
            expect(tx).to.revertWith(expectedError);
        });
        it('reverts if epoch duration is > 30 days', async () => {
            const tx = proxyContract.setAndAssertParams.awaitTransactionSuccessAsync({
                ...stakingConstants.DEFAULT_PARAMS,
                epochDurationInSeconds: thirtyDays.plus(1),
            });
            const expectedError = new StakingRevertErrors.InvalidParamValueError(
                StakingRevertErrors.InvalidParamValueErrorCode.InvalidEpochDuration,
            );
            expect(tx).to.revertWith(expectedError);
        });
        it('succeeds if epoch duration is 5 days', async () => {
            const tx = proxyContract.setAndAssertParams.awaitTransactionSuccessAsync({
                ...stakingConstants.DEFAULT_PARAMS,
                epochDurationInSeconds: fiveDays,
            });
            expect(tx).to.be.fulfilled('');
        });
        it('succeeds if epoch duration is 30 days', async () => {
            const tx = proxyContract.setAndAssertParams.awaitTransactionSuccessAsync({
                ...stakingConstants.DEFAULT_PARAMS,
                epochDurationInSeconds: thirtyDays,
            });
            expect(tx).to.be.fulfilled('');
        });
        it('reverts if alpha denominator is 0', async () => {
            const tx = proxyContract.setAndAssertParams.awaitTransactionSuccessAsync({
                ...stakingConstants.DEFAULT_PARAMS,
                cobbDouglasAlphaDenominator: constants.ZERO_AMOUNT,
            });
            const expectedError = new StakingRevertErrors.InvalidParamValueError(
                StakingRevertErrors.InvalidParamValueErrorCode.InvalidCobbDouglasAlpha,
            );
            expect(tx).to.revertWith(expectedError);
        });
        it('reverts if alpha > 1', async () => {
            const tx = proxyContract.setAndAssertParams.awaitTransactionSuccessAsync({
                ...stakingConstants.DEFAULT_PARAMS,
                cobbDouglasAlphaNumerator: new BigNumber(101),
                cobbDouglasAlphaDenominator: new BigNumber(100),
            });
            const expectedError = new StakingRevertErrors.InvalidParamValueError(
                StakingRevertErrors.InvalidParamValueErrorCode.InvalidCobbDouglasAlpha,
            );
            expect(tx).to.revertWith(expectedError);
        });
        it('succeeds if alpha == 1', async () => {
            const tx = proxyContract.setAndAssertParams.awaitTransactionSuccessAsync({
                ...stakingConstants.DEFAULT_PARAMS,
                cobbDouglasAlphaNumerator: new BigNumber(1),
                cobbDouglasAlphaDenominator: new BigNumber(1),
            });
            expect(tx).to.be.fulfilled('');
        });
        it('succeeds if alpha == 0', async () => {
            const tx = proxyContract.setAndAssertParams.awaitTransactionSuccessAsync({
                ...stakingConstants.DEFAULT_PARAMS,
                cobbDouglasAlphaNumerator: constants.ZERO_AMOUNT,
                cobbDouglasAlphaDenominator: new BigNumber(1),
            });
            expect(tx).to.be.fulfilled('');
        });
        it('reverts if delegation weight is > 100%', async () => {
            const tx = proxyContract.setAndAssertParams.awaitTransactionSuccessAsync({
                ...stakingConstants.DEFAULT_PARAMS,
                rewardDelegatedStakeWeight: new BigNumber(stakingConstants.PPM).plus(1),
            });
            const expectedError = new StakingRevertErrors.InvalidParamValueError(
                StakingRevertErrors.InvalidParamValueErrorCode.InvalidRewardDelegatedStakeWeight,
            );
            expect(tx).to.revertWith(expectedError);
        });
        it('succeeds if delegation weight is 100%', async () => {
            const tx = proxyContract.setAndAssertParams.awaitTransactionSuccessAsync({
                ...stakingConstants.DEFAULT_PARAMS,
                rewardDelegatedStakeWeight: new BigNumber(stakingConstants.PPM),
            });
            expect(tx).to.be.fulfilled('');
        });
        it('reverts if max makers in pool is 0', async () => {
            const tx = proxyContract.setAndAssertParams.awaitTransactionSuccessAsync({
                ...stakingConstants.DEFAULT_PARAMS,
                maximumMakersInPool: constants.ZERO_AMOUNT,
            });
            const expectedError = new StakingRevertErrors.InvalidParamValueError(
                StakingRevertErrors.InvalidParamValueErrorCode.InvalidMaximumMakersInPool,
            );
            expect(tx).to.revertWith(expectedError);
        });
        it('reverts if wethAssetProxy is 0', async () => {
            const tx = proxyContract.setAndAssertParams.awaitTransactionSuccessAsync({
                ...stakingConstants.DEFAULT_PARAMS,
                wethProxyAddress: constants.NULL_ADDRESS,
            });
            const expectedError = new StakingRevertErrors.InvalidParamValueError(
                StakingRevertErrors.InvalidParamValueErrorCode.InvalidWethProxyAddress,
            );
            expect(tx).to.revertWith(expectedError);
        });
        it('reverts if zrxVault is 0', async () => {
            const tx = proxyContract.setAndAssertParams.awaitTransactionSuccessAsync({
                ...stakingConstants.DEFAULT_PARAMS,
                zrxVaultAddress: constants.NULL_ADDRESS,
            });
            const expectedError = new StakingRevertErrors.InvalidParamValueError(
                StakingRevertErrors.InvalidParamValueErrorCode.InvalidZrxVaultAddress,
            );
            expect(tx).to.revertWith(expectedError);
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
