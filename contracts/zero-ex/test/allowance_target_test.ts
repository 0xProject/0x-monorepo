import { blockchainTests, constants, expect, randomAddress, verifyEventsFromLogs } from '@0x/contracts-test-utils';
import { AuthorizableRevertErrors, hexUtils, StringRevertError } from '@0x/utils';

import { artifacts } from './artifacts';
import { AllowanceTargetContract, TestPuppetTargetContract, TestPuppetTargetEvents } from './wrappers';

blockchainTests.resets('AllowanceTarget', env => {
    let owner: string;
    let authority: string;
    let allowanceTarget: AllowanceTargetContract;
    let puppetTarget: TestPuppetTargetContract;

    before(async () => {
        [owner, authority] = await env.getAccountAddressesAsync();
        allowanceTarget = await AllowanceTargetContract.deployFrom0xArtifactAsync(
            artifacts.AllowanceTarget,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        await allowanceTarget.addAuthorizedAddress(authority).awaitTransactionSuccessAsync();
        puppetTarget = await TestPuppetTargetContract.deployFrom0xArtifactAsync(
            artifacts.TestPuppetTarget,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    const TARGET_RETURN_VALUE = hexUtils.rightPad('0x12345678');
    const REVERTING_DATA = '0x1337';

    describe('execute()', () => {
        it('non-authority cannot call execute()', async () => {
            const notAuthority = randomAddress();
            const tx = allowanceTarget.execute(randomAddress(), hexUtils.random()).callAsync({ from: notAuthority });
            return expect(tx).to.revertWith(new AuthorizableRevertErrors.SenderNotAuthorizedError(notAuthority));
        });

        it('authority can call execute()', async () => {
            const targetData = hexUtils.random(128);
            const receipt = await allowanceTarget
                .execute(puppetTarget.address, targetData)
                .awaitTransactionSuccessAsync({ from: authority });
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        context: puppetTarget.address,
                        sender: allowanceTarget.address,
                        data: targetData,
                        value: constants.ZERO_AMOUNT,
                    },
                ],
                TestPuppetTargetEvents.PuppetTargetCalled,
            );
        });

        it('AllowanceTarget returns call result', async () => {
            const result = await allowanceTarget
                .execute(puppetTarget.address, hexUtils.random(128))
                .callAsync({ from: authority });
            expect(result).to.eq(TARGET_RETURN_VALUE);
        });

        it('AllowanceTarget returns raw call revert', async () => {
            const tx = allowanceTarget.execute(puppetTarget.address, REVERTING_DATA).callAsync({ from: authority });
            return expect(tx).to.revertWith(new StringRevertError('TestPuppetTarget/REVERT'));
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
