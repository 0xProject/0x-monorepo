import {
    blockchainTests,
    constants,
    expect,
    getRandomInteger,
    randomAddress,
    verifyEventsFromLogs,
} from '@0x/contracts-test-utils';
import { hexUtils, OwnableRevertErrors, StringRevertError, ZeroExRevertErrors } from '@0x/utils';

import { artifacts } from './artifacts';
import { FlashWalletContract, TestCallTargetContract, TestCallTargetEvents } from './wrappers';

blockchainTests.resets('FlashWallet', env => {
    let owner: string;
    let wallet: FlashWalletContract;
    let callTarget: TestCallTargetContract;

    before(async () => {
        [owner] = await env.getAccountAddressesAsync();
        wallet = await FlashWalletContract.deployFrom0xArtifactAsync(
            artifacts.FlashWallet,
            env.provider,
            {
                ...env.txDefaults,
                from: owner,
            },
            artifacts,
        );
        callTarget = await TestCallTargetContract.deployFrom0xArtifactAsync(
            artifacts.TestCallTarget,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    const TARGET_RETURN_VALUE = hexUtils.rightPad('0x12345678');
    const REVERTING_DATA = '0x1337';

    it('owned by deployer', () => {
        return expect(wallet.owner().callAsync()).to.eventually.eq(owner);
    });

    describe('executeCall()', () => {
        it('non-owner cannot call executeCall()', async () => {
            const notOwner = randomAddress();
            const tx = wallet
                .executeCall(randomAddress(), hexUtils.random(), getRandomInteger(0, '100e18'))
                .callAsync({ from: notOwner });
            return expect(tx).to.revertWith(new OwnableRevertErrors.OnlyOwnerError(notOwner));
        });

        it('owner can call executeCall()', async () => {
            const targetData = hexUtils.random(128);
            const receipt = await wallet
                .executeCall(callTarget.address, targetData, constants.ZERO_AMOUNT)
                .awaitTransactionSuccessAsync({ from: owner });
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        context: callTarget.address,
                        sender: wallet.address,
                        data: targetData,
                        value: constants.ZERO_AMOUNT,
                    },
                ],
                TestCallTargetEvents.CallTargetCalled,
            );
        });

        it('owner can call executeCall() with attached ETH', async () => {
            const targetData = hexUtils.random(128);
            const callValue = getRandomInteger(1, '1e18');
            const receipt = await wallet
                .executeCall(callTarget.address, targetData, callValue)
                .awaitTransactionSuccessAsync({ from: owner, value: callValue });
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        context: callTarget.address,
                        sender: wallet.address,
                        data: targetData,
                        value: callValue,
                    },
                ],
                TestCallTargetEvents.CallTargetCalled,
            );
        });

        it('owner can call executeCall() can transfer less ETH than attached', async () => {
            const targetData = hexUtils.random(128);
            const callValue = getRandomInteger(1, '1e18');
            const receipt = await wallet
                .executeCall(callTarget.address, targetData, callValue.minus(1))
                .awaitTransactionSuccessAsync({ from: owner, value: callValue });
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        context: callTarget.address,
                        sender: wallet.address,
                        data: targetData,
                        value: callValue.minus(1),
                    },
                ],
                TestCallTargetEvents.CallTargetCalled,
            );
        });

        it('wallet returns call result', async () => {
            const result = await wallet
                .executeCall(callTarget.address, hexUtils.random(128), constants.ZERO_AMOUNT)
                .callAsync({ from: owner });
            expect(result).to.eq(TARGET_RETURN_VALUE);
        });

        it('wallet wraps call revert', async () => {
            const tx = wallet
                .executeCall(callTarget.address, REVERTING_DATA, constants.ZERO_AMOUNT)
                .callAsync({ from: owner });
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.Wallet.WalletExecuteCallFailedError(
                    wallet.address,
                    callTarget.address,
                    REVERTING_DATA,
                    constants.ZERO_AMOUNT,
                    new StringRevertError('TestCallTarget/REVERT').encode(),
                ),
            );
        });

        it('wallet can receive ETH', async () => {
            await env.web3Wrapper.sendTransactionAsync({
                to: wallet.address,
                from: owner,
                value: 1,
            });
            const bal = await env.web3Wrapper.getBalanceInWeiAsync(wallet.address);
            expect(bal).to.bignumber.eq(1);
        });
    });

    describe('executeDelegateCall()', () => {
        it('non-owner cannot call executeDelegateCall()', async () => {
            const notOwner = randomAddress();
            const tx = wallet.executeDelegateCall(randomAddress(), hexUtils.random()).callAsync({ from: notOwner });
            return expect(tx).to.revertWith(new OwnableRevertErrors.OnlyOwnerError(notOwner));
        });

        it('owner can call executeDelegateCall()', async () => {
            const targetData = hexUtils.random(128);
            const receipt = await wallet
                .executeDelegateCall(callTarget.address, targetData)
                .awaitTransactionSuccessAsync({ from: owner });
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        context: wallet.address,
                        sender: owner,
                        data: targetData,
                        value: constants.ZERO_AMOUNT,
                    },
                ],
                TestCallTargetEvents.CallTargetCalled,
            );
        });

        it('executeDelegateCall() is payable', async () => {
            const targetData = hexUtils.random(128);
            const callValue = getRandomInteger(1, '1e18');
            const receipt = await wallet
                .executeDelegateCall(callTarget.address, targetData)
                .awaitTransactionSuccessAsync({ from: owner, value: callValue });
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        context: wallet.address,
                        sender: owner,
                        data: targetData,
                        value: callValue,
                    },
                ],
                TestCallTargetEvents.CallTargetCalled,
            );
        });

        it('wallet returns call result', async () => {
            const result = await wallet
                .executeDelegateCall(callTarget.address, hexUtils.random(128))
                .callAsync({ from: owner });
            expect(result).to.eq(TARGET_RETURN_VALUE);
        });

        it('wallet wraps call revert', async () => {
            const tx = wallet.executeDelegateCall(callTarget.address, REVERTING_DATA).callAsync({ from: owner });
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.Wallet.WalletExecuteDelegateCallFailedError(
                    wallet.address,
                    callTarget.address,
                    REVERTING_DATA,
                    new StringRevertError('TestCallTarget/REVERT').encode(),
                ),
            );
        });
    });
});
