import { blockchainTests, constants, expect, randomAddress, verifyEventsFromLogs } from '@0x/contracts-test-utils';
import { AuthorizableRevertErrors, hexUtils, StringRevertError } from '@0x/utils';

import { artifacts } from './artifacts';
import { AllowanceTargetContract, TestCallTargetContract, TestCallTargetEvents } from './wrappers';

blockchainTests.resets('AllowanceTarget', env => {
    let owner: string;
    let authority: string;
    let allowanceTarget: AllowanceTargetContract;
    let callTarget: TestCallTargetContract;

    before(async () => {
        [owner, authority] = await env.getAccountAddressesAsync();
        allowanceTarget = await AllowanceTargetContract.deployFrom0xArtifactAsync(
            artifacts.AllowanceTarget,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        await allowanceTarget.addAuthorizedAddress(authority).awaitTransactionSuccessAsync();
        callTarget = await TestCallTargetContract.deployFrom0xArtifactAsync(
            artifacts.TestCallTarget,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    const TARGET_RETURN_VALUE = hexUtils.rightPad('0x12345678');
    const REVERTING_DATA = '0x1337';

    describe('executeCall()', () => {
        it('non-authority cannot call executeCall()', async () => {
            const notAuthority = randomAddress();
            const tx = allowanceTarget
                .executeCall(randomAddress(), hexUtils.random())
                .callAsync({ from: notAuthority });
            return expect(tx).to.revertWith(new AuthorizableRevertErrors.SenderNotAuthorizedError(notAuthority));
        });

        it('authority can call executeCall()', async () => {
            const targetData = hexUtils.random(128);
            const receipt = await allowanceTarget
                .executeCall(callTarget.address, targetData)
                .awaitTransactionSuccessAsync({ from: authority });
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        context: callTarget.address,
                        sender: allowanceTarget.address,
                        data: targetData,
                        value: constants.ZERO_AMOUNT,
                    },
                ],
                TestCallTargetEvents.CallTargetCalled,
            );
        });

        it('AllowanceTarget returns call result', async () => {
            const result = await allowanceTarget
                .executeCall(callTarget.address, hexUtils.random(128))
                .callAsync({ from: authority });
            expect(result).to.eq(TARGET_RETURN_VALUE);
        });

        it('AllowanceTarget returns raw call revert', async () => {
            const tx = allowanceTarget.executeCall(callTarget.address, REVERTING_DATA).callAsync({ from: authority });
            return expect(tx).to.revertWith(new StringRevertError('TestCallTarget/REVERT'));
        });

        it('AllowanceTarget cannot receive ETH', async () => {
            const tx = env.web3Wrapper.sendTransactionAsync({
                to: allowanceTarget.address,
                from: owner,
                value: 0,
            });
            return expect(tx).to.eventually.be.rejected();
        });
    });
});
