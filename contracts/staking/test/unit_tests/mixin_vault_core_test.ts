import { blockchainTests, expect, filterLogsToArguments } from '@0x/contracts-test-utils';
import { StakingRevertErrors } from '@0x/order-utils';
import { AuthorizableRevertErrors } from '@0x/utils';

import { constants } from '../utils/constants';

import {
    artifacts,
    TestMixinVaultCoreContract,
    TestMixinVaultCoreInCatastrophicFailureModeEventArgs,
    TestMixinVaultCoreStakingProxySetEventArgs,
} from '../../src';

blockchainTests.resets('MixinVaultCore', env => {
    let owner: string;
    let nonOwnerAddresses: string[];
    let testContract: TestMixinVaultCoreContract;

    before(async () => {
        [owner, ...nonOwnerAddresses] = await env.getAccountAddressesAsync();

        testContract = await TestMixinVaultCoreContract.deployFrom0xArtifactAsync(
            artifacts.TestMixinVaultCore,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    describe('Set staking proxy', () => {
        async function testAssertStakingProxyAsync(callerAddress: string): Promise<void> {
            const tx = testContract.assertStakingProxy.callAsync({ from: callerAddress });
            const expectedError = new StakingRevertErrors.OnlyCallableByStakingContractError(callerAddress);
            expect(tx).to.revertWith(expectedError);
        }

        it('Owner can set staking proxy', async () => {
            const newAddress = nonOwnerAddresses[0];
            const receipt = await testContract.setStakingProxy.awaitTransactionSuccessAsync(newAddress, {
                from: owner,
            });
            const eventArgs = filterLogsToArguments<TestMixinVaultCoreStakingProxySetEventArgs>(
                receipt.logs,
                'StakingProxySet',
            );
            expect(eventArgs.length).to.equal(1);
            expect(eventArgs[0].stakingProxyAddress).to.equal(newAddress);
            expect(await testContract.stakingProxyAddress.callAsync()).to.equal(newAddress);
            // The new staking proxy address should be able to pass the modifier check
            await testContract.assertStakingProxy.callAsync({ from: newAddress });
            return testAssertStakingProxyAsync(owner);
        });
        it('Non-authorized address cannot set staking proxy', async () => {
            const notAuthorized = nonOwnerAddresses[0];
            const newAddress = nonOwnerAddresses[1];
            const tx = testContract.setStakingProxy.awaitTransactionSuccessAsync(newAddress, {
                from: notAuthorized,
            });
            const expectedError = new AuthorizableRevertErrors.SenderNotAuthorizedError(notAuthorized);
            expect(tx).to.revertWith(expectedError);
            expect(await testContract.stakingProxyAddress.callAsync()).to.equal(constants.NIL_ADDRESS);
            return testAssertStakingProxyAsync(newAddress);
        });
    });

    describe('Catastrophic failure mode', () => {
        async function testCatastrophicFailureModeAsync(isInCatastrophicFailure: boolean): Promise<void> {
            const [expectToSucceed, expectToRevert] = isInCatastrophicFailure
                ? [testContract.assertInCatastrophicFailure, testContract.assertNotInCatastrophicFailure]
                : [testContract.assertNotInCatastrophicFailure, testContract.assertInCatastrophicFailure];
            const expectedError = isInCatastrophicFailure
                ? new StakingRevertErrors.OnlyCallableIfNotInCatastrophicFailureError()
                : new StakingRevertErrors.OnlyCallableIfInCatastrophicFailureError();
            await expectToSucceed.callAsync();
            expect(expectToRevert.callAsync()).to.revertWith(expectedError);
            expect(await testContract.isInCatastrophicFailure.callAsync()).to.equal(isInCatastrophicFailure);
        }

        it('Owner can turn on catastrophic failure mode', async () => {
            await testCatastrophicFailureModeAsync(false);
            const receipt = await testContract.enterCatastrophicFailure.awaitTransactionSuccessAsync({ from: owner });
            const eventArgs = filterLogsToArguments<TestMixinVaultCoreInCatastrophicFailureModeEventArgs>(
                receipt.logs,
                'InCatastrophicFailureMode',
            );
            expect(eventArgs.length).to.equal(1);
            expect(eventArgs[0].sender).to.equal(owner);
            return testCatastrophicFailureModeAsync(true);
        });
        it('Non-authorized address cannot turn on catastrophic failure mode', async () => {
            await testCatastrophicFailureModeAsync(false);
            const tx = testContract.enterCatastrophicFailure.awaitTransactionSuccessAsync({
                from: nonOwnerAddresses[0],
            });
            expect(tx).to.revertWith(new AuthorizableRevertErrors.SenderNotAuthorizedError(nonOwnerAddresses[0]));
            return testCatastrophicFailureModeAsync(false);
        });
    });
});
