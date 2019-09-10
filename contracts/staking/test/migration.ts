import { blockchainTests, constants, expect, hexRandom } from '@0x/contracts-test-utils';
import { StakingRevertErrors } from '@0x/order-utils';
import { BigNumber, OwnableRevertErrors, StringRevertError } from '@0x/utils';

import { artifacts, StakingContract, TestInitTargetContract, TestStakingProxyContract } from '../src/';

blockchainTests('Migration tests', env => {
    let ownerAddress: string;
    let notOwnerAddress: string;

    before(async () => {
        [ownerAddress, notOwnerAddress] = await env.getAccountAddressesAsync();
    });

    describe('StakingProxy', () => {
        const REVERT_ERROR = new StringRevertError('FORCED_REVERT');
        let initTargetContract: TestInitTargetContract;

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
            [ownerAddress, notOwnerAddress] = await env.getAccountAddressesAsync();
            initTargetContract = await TestInitTargetContract.deployFrom0xArtifactAsync(
                artifacts.TestInitTarget,
                env.provider,
                env.txDefaults,
                artifacts,
            );
        });

        function randomAddress(): string {
            return hexRandom(constants.ADDRESS_LENGTH);
        }

        async function enableInitRevertsAsync(): Promise<void> {
            const revertAddress = await initTargetContract.SHOULD_REVERT_ADDRESS.callAsync();
            // Deposit some ether into `revertAddress` to signal `initTargetContract`
            // to fail.
            await env.web3Wrapper.awaitTransactionMinedAsync(
                await env.web3Wrapper.sendTransactionAsync({
                    ...env.txDefaults,
                    from: ownerAddress,
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
            expect(senderAddress).to.eq(ownerAddress);
            expect(thisAddress).to.eq(proxyContract.address);
            const attachedAddress = await proxyContract.getAttachedContract.callAsync();
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
                return expect(tx).to.revertWith(REVERT_ERROR);
            });
        });

        blockchainTests.resets('attachStakingContract()', async () => {
            let proxyContract: TestStakingProxyContract;

            before(async () => {
                proxyContract = await deployStakingProxyAsync();
            });

            it('throws if not called by owner', async () => {
                const attachedAddress = randomAddress();
                const tx = proxyContract.attachStakingContract.awaitTransactionSuccessAsync(attachedAddress, {
                    from: notOwnerAddress,
                });
                const expectedError = new OwnableRevertErrors.OnlyOwnerError(notOwnerAddress, ownerAddress);
                return expect(tx).to.revertWith(expectedError);
            });

            it('calls init() and attaches the contract', async () => {
                await proxyContract.attachStakingContract.awaitTransactionSuccessAsync(initTargetContract.address);
                await assertInitStateAsync(proxyContract);
            });

            it('reverts if init() reverts', async () => {
                await enableInitRevertsAsync();
                const tx = proxyContract.attachStakingContract.awaitTransactionSuccessAsync(initTargetContract.address);
                return expect(tx).to.revertWith(REVERT_ERROR);
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
        let stakingContract: StakingContract;

        before(async () => {
            stakingContract = await StakingContract.deployFrom0xArtifactAsync(
                artifacts.Staking,
                env.provider,
                env.txDefaults,
                artifacts,
            );
        });

        it('throws if not called by owner', async () => {
            const tx = stakingContract.init.awaitTransactionSuccessAsync({ from: notOwnerAddress });
            const expectedError = new OwnableRevertErrors.OnlyOwnerError(notOwnerAddress, ownerAddress);
            return expect(tx).to.revertWith(expectedError);
        });

        it('throws if already intiialized', async () => {
            await stakingContract.init.awaitTransactionSuccessAsync();
            const tx = stakingContract.init.awaitTransactionSuccessAsync();
            const expectedError = new StakingRevertErrors.InitializationError();
            return expect(tx).to.revertWith(expectedError);
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
