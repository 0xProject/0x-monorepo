import { ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { blockchainTests, describe, expect, increaseTimeAndMineBlockAsync } from '@0x/contracts-test-utils';
import { StringRevertError } from '@0x/utils';
import { LogWithDecodedArgs } from 'ethereum-types';

import { ZrxVaultInCatastrophicFailureModeEventArgs } from '../src';

import { deployAndConfigureContractsAsync, StakingApiWrapper } from './utils/api_wrapper';
blockchainTests.resets('ZrxVaultBackstop', env => {
    let stakingApiWrapper: StakingApiWrapper;
    let authorizedAddress: string;
    let notAuthorizedAddress: string;
    before(async () => {
        const accounts = await env.web3Wrapper.getAvailableAddressesAsync();
        [authorizedAddress, notAuthorizedAddress] = accounts;
        const erc20Wrapper = new ERC20Wrapper(env.provider, [], authorizedAddress);
        stakingApiWrapper = await deployAndConfigureContractsAsync(env, authorizedAddress, erc20Wrapper);
    });

    describe('enterCatastrophicFailureIfProlongedReadOnlyMode', () => {
        it('should revert if read-only mode is not set', async () => {
            const expectedError = new StringRevertError('READ_ONLY_MODE_NOT_SET');
            expect(
                stakingApiWrapper.zrxVaultBackstopContract.enterCatastrophicFailureIfProlongedReadOnlyMode.awaitTransactionSuccessAsync(),
            ).to.revertWith(expectedError);
        });
        it('should revert if read-only mode has been set for less than 40 days', async () => {
            await stakingApiWrapper.stakingProxyContract.setReadOnlyMode.awaitTransactionSuccessAsync(true, {
                from: authorizedAddress,
            });
            const expectedError = new StringRevertError('READ_ONLY_MODE_DURATION_TOO_SHORT');
            expect(
                stakingApiWrapper.zrxVaultBackstopContract.enterCatastrophicFailureIfProlongedReadOnlyMode.awaitTransactionSuccessAsync(),
            ).to.revertWith(expectedError);
        });
        it('should enter catastophic failure mode if read-only mode has been set for 40 days', async () => {
            await stakingApiWrapper.stakingProxyContract.setReadOnlyMode.awaitTransactionSuccessAsync(true, {
                from: authorizedAddress,
            });
            const fourtyDaysInSec = 40 * 24 * 60 * 60;
            await increaseTimeAndMineBlockAsync(fourtyDaysInSec);
            const txReceipt = await stakingApiWrapper.zrxVaultBackstopContract.enterCatastrophicFailureIfProlongedReadOnlyMode.awaitTransactionSuccessAsync(
                { from: notAuthorizedAddress },
            );
            expect(txReceipt.logs.length).to.equal(1);
            // tslint:disable:no-unnecessary-type-assertion
            const logArgs = (txReceipt.logs[0] as LogWithDecodedArgs<ZrxVaultInCatastrophicFailureModeEventArgs>).args;
            expect(logArgs.sender).to.equal(stakingApiWrapper.zrxVaultBackstopContract.address);
        });
    });
});
