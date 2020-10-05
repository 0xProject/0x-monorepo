import { blockchainTests, constants, expect, randomAddress, verifyEventsFromLogs } from '@0x/contracts-test-utils';
import { AuthorizableRevertErrors, BigNumber, hexUtils, StringRevertError } from '@0x/utils';

import { artifacts } from './artifacts';
import { AllowanceTargetContract, TestCallTargetContract, TestCallTargetEvents, TestTokenSpenderERC20TokenContract, TestTokenSpenderERC20TokenEvents, IAllowanceTargetContract } from './wrappers';

blockchainTests.resets('AllowanceTarget', env => {
    let owner: string;
    let authority: string;
    let allowanceTarget: IAllowanceTargetContract;
    let callTarget: TestCallTargetContract;
    let token: TestTokenSpenderERC20TokenContract;

    before(async () => {
        [owner, authority] = await env.getAccountAddressesAsync();
        let allowanceTargetImpl = await AllowanceTargetContract.deployFrom0xArtifactAsync(
            artifacts.AllowanceTarget,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        allowanceTarget = new IAllowanceTargetContract(
            allowanceTargetImpl.address, env.provider, env.txDefaults,
            {
                "TestCallTarget": artifacts.TestCallTarget.compilerOutput.abi,
                "TestTokenSpenderERC20Token": artifacts.TestTokenSpenderERC20Token.compilerOutput.abi
            }); // logDecodeDependencies
        await allowanceTarget.addAuthorizedAddress(authority).awaitTransactionSuccessAsync();
        callTarget = await TestCallTargetContract.deployFrom0xArtifactAsync(
            artifacts.TestCallTarget,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        token = await TestTokenSpenderERC20TokenContract.deployFrom0xArtifactAsync(
            artifacts.TestTokenSpenderERC20Token,
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

        it('executeCall() returns call result', async () => {
            const result = await allowanceTarget
                .executeCall(callTarget.address, hexUtils.random(128))
                .rawCallAsync({ from: authority });
            expect(result).to.eq(TARGET_RETURN_VALUE);
        });

        it('executeCall() returns raw call revert', async () => {
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

    describe('transferFrom()', () => {
        const fromAddress = randomAddress();
        const toAddress = randomAddress();
        const tokenAmount = new BigNumber(123456);

        it('non-authority cannot call transferFrom()', async () => {
            const notAuthority = randomAddress();
            const tx = allowanceTarget
                .transferFrom(callTarget.address, fromAddress, toAddress, tokenAmount)
                .callAsync({ from: notAuthority });
            return expect(tx).to.revertWith(new AuthorizableRevertErrors.SenderNotAuthorizedError(notAuthority));
        });

        it('authority can call transferFrom()', async () => {
            const receipt = await allowanceTarget
                .transferFrom(token.address, fromAddress, toAddress, tokenAmount)
                .awaitTransactionSuccessAsync({ from: authority });
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        sender: allowanceTarget.address,
                        from: fromAddress,
                        to: toAddress,
                        amount: tokenAmount,
                    },
                ],
                TestTokenSpenderERC20TokenEvents.TransferFromCalled,
            );
        });

        it('transferFrom() returns raw call result', async () => {
            const result = await allowanceTarget
                .transferFrom(callTarget.address, fromAddress, toAddress, tokenAmount)
                .rawCallAsync({ from: authority });
            expect(result).to.eq(TARGET_RETURN_VALUE);
        });
    });
});
