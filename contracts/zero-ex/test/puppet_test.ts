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
import { PuppetContract, TestPuppetTargetContract, TestPuppetTargetEvents } from './wrappers';

blockchainTests.resets('Puppets', env => {
    let owner: string;
    let puppet: PuppetContract;
    let puppetTarget: TestPuppetTargetContract;

    before(async () => {
        [owner] = await env.getAccountAddressesAsync();
        puppet = await PuppetContract.deployFrom0xArtifactAsync(
            artifacts.Puppet,
            env.provider,
            {
                ...env.txDefaults,
                from: owner,
            },
            artifacts,
        );
        puppetTarget = await TestPuppetTargetContract.deployFrom0xArtifactAsync(
            artifacts.TestPuppetTarget,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    const TARGET_RETURN_VALUE = hexUtils.rightPad('0x12345678');
    const REVERTING_DATA = '0x1337';

    it('owned by deployer', () => {
        return expect(puppet.owner().callAsync()).to.eventually.eq(owner);
    });

    describe('execute()', () => {
        it('non-owner cannot call execute()', async () => {
            const notOwner = randomAddress();
            const tx = puppet
                .execute(randomAddress(), hexUtils.random(), getRandomInteger(0, '100e18'))
                .callAsync({ from: notOwner });
            return expect(tx).to.revertWith(new OwnableRevertErrors.OnlyOwnerError(notOwner));
        });

        it('owner can call execute()', async () => {
            const targetData = hexUtils.random(128);
            const receipt = await puppet
                .execute(puppetTarget.address, targetData, constants.ZERO_AMOUNT)
                .awaitTransactionSuccessAsync({ from: owner });
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        context: puppetTarget.address,
                        sender: puppet.address,
                        data: targetData,
                        value: constants.ZERO_AMOUNT,
                    },
                ],
                TestPuppetTargetEvents.PuppetTargetCalled,
            );
        });

        it('owner can call execute() with attached ETH', async () => {
            const targetData = hexUtils.random(128);
            const callValue = getRandomInteger(1, '1e18');
            const receipt = await puppet
                .execute(puppetTarget.address, targetData, callValue)
                .awaitTransactionSuccessAsync({ from: owner, value: callValue });
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        context: puppetTarget.address,
                        sender: puppet.address,
                        data: targetData,
                        value: callValue,
                    },
                ],
                TestPuppetTargetEvents.PuppetTargetCalled,
            );
        });

        it('owner can call execute() can transfer less ETH than attached', async () => {
            const targetData = hexUtils.random(128);
            const callValue = getRandomInteger(1, '1e18');
            const receipt = await puppet
                .execute(puppetTarget.address, targetData, callValue.minus(1))
                .awaitTransactionSuccessAsync({ from: owner, value: callValue });
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        context: puppetTarget.address,
                        sender: puppet.address,
                        data: targetData,
                        value: callValue.minus(1),
                    },
                ],
                TestPuppetTargetEvents.PuppetTargetCalled,
            );
        });

        it('puppet returns call result', async () => {
            const result = await puppet
                .execute(puppetTarget.address, hexUtils.random(128), constants.ZERO_AMOUNT)
                .callAsync({ from: owner });
            expect(result).to.eq(TARGET_RETURN_VALUE);
        });

        it('puppet wraps call revert', async () => {
            const tx = puppet
                .execute(puppetTarget.address, REVERTING_DATA, constants.ZERO_AMOUNT)
                .callAsync({ from: owner });
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.Puppet.PuppetExecuteFailedError(
                    puppet.address,
                    puppetTarget.address,
                    REVERTING_DATA,
                    constants.ZERO_AMOUNT,
                    new StringRevertError('TestPuppetTarget/REVERT').encode(),
                ),
            );
        });

        it('puppet can receive ETH', async () => {
            await env.web3Wrapper.sendTransactionAsync({
                to: puppet.address,
                from: owner,
                value: 1,
            });
            const bal = await env.web3Wrapper.getBalanceInWeiAsync(puppet.address);
            expect(bal).to.bignumber.eq(1);
        });
    });

    describe('executeWith()', () => {
        it('non-owner cannot call executeWith()', async () => {
            const notOwner = randomAddress();
            const tx = puppet.executeWith(randomAddress(), hexUtils.random()).callAsync({ from: notOwner });
            return expect(tx).to.revertWith(new OwnableRevertErrors.OnlyOwnerError(notOwner));
        });

        it('owner can call executeWith()', async () => {
            const targetData = hexUtils.random(128);
            const receipt = await puppet
                .executeWith(puppetTarget.address, targetData)
                .awaitTransactionSuccessAsync({ from: owner });
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        context: puppet.address,
                        sender: owner,
                        data: targetData,
                        value: constants.ZERO_AMOUNT,
                    },
                ],
                TestPuppetTargetEvents.PuppetTargetCalled,
            );
        });

        it('executeWith() is payable', async () => {
            const targetData = hexUtils.random(128);
            const callValue = getRandomInteger(1, '1e18');
            const receipt = await puppet
                .executeWith(puppetTarget.address, targetData)
                .awaitTransactionSuccessAsync({ from: owner, value: callValue });
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        context: puppet.address,
                        sender: owner,
                        data: targetData,
                        value: callValue,
                    },
                ],
                TestPuppetTargetEvents.PuppetTargetCalled,
            );
        });

        it('puppet returns call result', async () => {
            const result = await puppet
                .executeWith(puppetTarget.address, hexUtils.random(128))
                .callAsync({ from: owner });
            expect(result).to.eq(TARGET_RETURN_VALUE);
        });

        it('puppet wraps call revert', async () => {
            const tx = puppet.executeWith(puppetTarget.address, REVERTING_DATA).callAsync({ from: owner });
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.Puppet.PuppetExecuteWithFailedError(
                    puppet.address,
                    puppetTarget.address,
                    REVERTING_DATA,
                    new StringRevertError('TestPuppetTarget/REVERT').encode(),
                ),
            );
        });
    });
});
