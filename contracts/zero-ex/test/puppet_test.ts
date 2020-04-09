import {
    blockchainTests,
    constants,
    expect,
    getRandomInteger,
    randomAddress,
    verifyEventsFromLogs,
} from '@0x/contracts-test-utils';
import { AuthorizableRevertErrors, hexUtils, StringRevertError, ZeroExRevertErrors } from '@0x/utils';

import { artifacts } from './artifacts';
import { PuppetContract, TestPuppetTargetContract, TestPuppetTargetEvents } from './wrappers';

blockchainTests.resets('Puppets', env => {
    let owner: string;
    let authority: string;
    let puppet: PuppetContract;
    let puppetTarget: TestPuppetTargetContract;

    before(async () => {
        [owner, authority] = await env.getAccountAddressesAsync();
        puppet = await PuppetContract.deployFrom0xArtifactAsync(
            artifacts.Puppet,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        await puppet.addAuthorizedAddress(authority).awaitTransactionSuccessAsync();
        puppetTarget = await TestPuppetTargetContract.deployFrom0xArtifactAsync(
            artifacts.TestPuppetTarget,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    it('non-authority cannot call execute()', async () => {
        const notAuthority = randomAddress();
        const tx = puppet
            .execute(randomAddress(), hexUtils.random(), getRandomInteger(0, '100e18'))
            .callAsync({ from: notAuthority });
        return expect(tx).to.revertWith(new AuthorizableRevertErrors.SenderNotAuthorizedError(notAuthority));
    });

    it('authority can call execute()', async () => {
        const targetData = hexUtils.random(128);
        const receipt = await puppet
            .execute(puppetTarget.address, targetData, constants.ZERO_AMOUNT)
            .awaitTransactionSuccessAsync({ from: authority });
        verifyEventsFromLogs(
            receipt.logs,
            [
                {
                    sender: puppet.address,
                    data: targetData,
                    value: constants.ZERO_AMOUNT,
                },
            ],
            TestPuppetTargetEvents.PuppetTargetCalled,
        );
    });

    it('authority can call execute() with attached ETH', async () => {
        const targetData = hexUtils.random(128);
        const callValue = getRandomInteger(1, '1e18');
        const receipt = await puppet
            .execute(puppetTarget.address, targetData, callValue)
            .awaitTransactionSuccessAsync({ from: authority, value: callValue });
        verifyEventsFromLogs(
            receipt.logs,
            [
                {
                    sender: puppet.address,
                    data: targetData,
                    value: callValue,
                },
            ],
            TestPuppetTargetEvents.PuppetTargetCalled,
        );
    });

    const TARGET_RETURN_VALUE = hexUtils.rightPad('0x12345678');

    it('puppet returns call result', async () => {
        const result = await puppet
            .execute(puppetTarget.address, hexUtils.random(128), constants.ZERO_AMOUNT)
            .callAsync({ from: authority });
        expect(result).to.eq(TARGET_RETURN_VALUE);
    });

    const REVERTING_DATA = '0x1337';

    it('puppet wraps call revert', async () => {
        const tx = puppet
            .execute(puppetTarget.address, REVERTING_DATA, constants.ZERO_AMOUNT)
            .callAsync({ from: authority });
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
