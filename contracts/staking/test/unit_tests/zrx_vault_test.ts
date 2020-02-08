import { ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { blockchainTests, constants, expect, filterLogsToArguments } from '@0x/contracts-test-utils';
import { assetDataUtils } from '@0x/order-utils';
import { RevertReason } from '@0x/types';
import { AuthorizableRevertErrors, BigNumber, SafeMathRevertErrors, StakingRevertErrors } from '@0x/utils';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { constants as stakingConstants } from '../../src/constants';

import { artifacts } from '../artifacts';
import {
    ZrxVaultContract,
    ZrxVaultDepositEventArgs,
    ZrxVaultInCatastrophicFailureModeEventArgs,
    ZrxVaultStakingProxySetEventArgs,
    ZrxVaultWithdrawEventArgs,
    ZrxVaultZrxProxySetEventArgs,
} from '../wrappers';

blockchainTests.resets('ZrxVault unit tests', env => {
    let accounts: string[];
    let owner: string;
    let nonOwnerAddresses: string[];
    let erc20Wrapper: ERC20Wrapper;
    let zrxVault: ZrxVaultContract;
    let zrxAssetData: string;
    let zrxProxyAddress: string;

    before(async () => {
        // create accounts
        accounts = await env.getAccountAddressesAsync();
        [owner, ...nonOwnerAddresses] = accounts;

        // set up ERC20Wrapper
        erc20Wrapper = new ERC20Wrapper(env.provider, accounts, owner);
        // deploy erc20 proxy
        const erc20ProxyContract = await erc20Wrapper.deployProxyAsync();
        zrxProxyAddress = erc20ProxyContract.address;
        // deploy zrx token
        const [zrxTokenContract] = await erc20Wrapper.deployDummyTokensAsync(1, constants.DUMMY_TOKEN_DECIMALS);
        zrxAssetData = assetDataUtils.encodeERC20AssetData(zrxTokenContract.address);

        await erc20Wrapper.setBalancesAndAllowancesAsync();

        zrxVault = await ZrxVaultContract.deployFrom0xArtifactAsync(
            artifacts.ZrxVault,
            env.provider,
            env.txDefaults,
            artifacts,
            zrxProxyAddress,
            zrxTokenContract.address,
        );

        await zrxVault.addAuthorizedAddress(owner).awaitTransactionSuccessAsync();

        // configure erc20 proxy to accept calls from zrx vault
        await erc20ProxyContract.addAuthorizedAddress(zrxVault.address).awaitTransactionSuccessAsync();
    });

    enum ZrxTransfer {
        Deposit,
        Withdrawal,
    }

    async function verifyTransferPostconditionsAsync(
        transferType: ZrxTransfer,
        staker: string,
        amount: BigNumber,
        initialVaultBalance: BigNumber,
        initialTokenBalance: BigNumber,
        receipt: TransactionReceiptWithDecodedLogs,
    ): Promise<void> {
        const eventArgs =
            transferType === ZrxTransfer.Deposit
                ? filterLogsToArguments<ZrxVaultDepositEventArgs>(receipt.logs, 'Deposit')
                : filterLogsToArguments<ZrxVaultWithdrawEventArgs>(receipt.logs, 'Withdraw');
        expect(eventArgs.length).to.equal(1);
        expect(eventArgs[0].staker).to.equal(staker);
        expect(eventArgs[0].amount).to.bignumber.equal(amount);

        const newVaultBalance = await zrxVault.balanceOf(staker).callAsync();
        const newTokenBalance = await erc20Wrapper.getBalanceAsync(staker, zrxAssetData);
        const [expectedVaultBalance, expectedTokenBalance] =
            transferType === ZrxTransfer.Deposit
                ? [initialVaultBalance.plus(amount), initialTokenBalance.minus(amount)]
                : [initialVaultBalance.minus(amount), initialTokenBalance.plus(amount)];
        expect(newVaultBalance).to.bignumber.equal(expectedVaultBalance);
        expect(newTokenBalance).to.bignumber.equal(expectedTokenBalance);
    }

    describe('Normal operation', () => {
        describe('Setting proxies', () => {
            async function verifyStakingProxySetAsync(
                receipt: TransactionReceiptWithDecodedLogs,
                newProxy: string,
            ): Promise<void> {
                const eventArgs = filterLogsToArguments<ZrxVaultStakingProxySetEventArgs>(
                    receipt.logs,
                    'StakingProxySet',
                );
                expect(eventArgs.length).to.equal(1);
                expect(eventArgs[0].stakingProxyAddress).to.equal(newProxy);
                const actualAddress = await zrxVault.stakingProxyAddress().callAsync();
                expect(actualAddress).to.equal(newProxy);
            }

            it('Owner can set the ZRX proxy', async () => {
                const newProxy = nonOwnerAddresses[0];
                const receipt = await zrxVault.setZrxProxy(newProxy).awaitTransactionSuccessAsync({
                    from: owner,
                });
                const eventArgs = filterLogsToArguments<ZrxVaultZrxProxySetEventArgs>(receipt.logs, 'ZrxProxySet');
                expect(eventArgs.length).to.equal(1);
                expect(eventArgs[0].zrxProxyAddress).to.equal(newProxy);
            });
            it('Authorized address can set the ZRX proxy', async () => {
                const [authorized, newProxy] = nonOwnerAddresses;
                await zrxVault.addAuthorizedAddress(authorized).awaitTransactionSuccessAsync({ from: owner });
                const receipt = await zrxVault.setZrxProxy(newProxy).awaitTransactionSuccessAsync({
                    from: authorized,
                });
                const eventArgs = filterLogsToArguments<ZrxVaultZrxProxySetEventArgs>(receipt.logs, 'ZrxProxySet');
                expect(eventArgs.length).to.equal(1);
                expect(eventArgs[0].zrxProxyAddress).to.equal(newProxy);
            });
            it('Non-authorized address cannot set the ZRX proxy', async () => {
                const [notAuthorized, newProxy] = nonOwnerAddresses;
                const tx = zrxVault.setZrxProxy(newProxy).awaitTransactionSuccessAsync({
                    from: notAuthorized,
                });
                const expectedError = new AuthorizableRevertErrors.SenderNotAuthorizedError(notAuthorized);
                expect(tx).to.revertWith(expectedError);
            });
            it('Owner can set the staking proxy', async () => {
                const newProxy = nonOwnerAddresses[0];
                const receipt = await zrxVault.setStakingProxy(newProxy).awaitTransactionSuccessAsync({
                    from: owner,
                });
                await verifyStakingProxySetAsync(receipt, newProxy);
            });
            it('Authorized address can set the staking proxy', async () => {
                const [authorized, newProxy] = nonOwnerAddresses;
                await zrxVault.addAuthorizedAddress(authorized).awaitTransactionSuccessAsync({ from: owner });
                const receipt = await zrxVault.setStakingProxy(newProxy).awaitTransactionSuccessAsync({
                    from: authorized,
                });
                await verifyStakingProxySetAsync(receipt, newProxy);
            });
            it('Non-authorized address cannot set the staking proxy', async () => {
                const [notAuthorized, newProxy] = nonOwnerAddresses;
                const tx = zrxVault.setStakingProxy(newProxy).awaitTransactionSuccessAsync({
                    from: notAuthorized,
                });
                const expectedError = new AuthorizableRevertErrors.SenderNotAuthorizedError(notAuthorized);
                expect(tx).to.revertWith(expectedError);
                const actualAddress = await zrxVault.stakingProxyAddress().callAsync();
                expect(actualAddress).to.equal(stakingConstants.NIL_ADDRESS);
            });
        });
        describe('ZRX management', () => {
            let staker: string;
            let stakingProxy: string;
            let initialVaultBalance: BigNumber;
            let initialTokenBalance: BigNumber;

            before(async () => {
                [staker, stakingProxy] = nonOwnerAddresses;
                await zrxVault.setStakingProxy(stakingProxy).awaitTransactionSuccessAsync({ from: owner });
                await zrxVault.depositFrom(staker, new BigNumber(10)).awaitTransactionSuccessAsync({
                    from: stakingProxy,
                });
            });

            beforeEach(async () => {
                initialVaultBalance = await zrxVault.balanceOf(staker).callAsync();
                initialTokenBalance = await erc20Wrapper.getBalanceAsync(staker, zrxAssetData);
            });

            describe('Deposit', () => {
                it('Staking proxy can deposit zero amount on behalf of staker', async () => {
                    const receipt = await zrxVault
                        .depositFrom(staker, constants.ZERO_AMOUNT)
                        .awaitTransactionSuccessAsync({
                            from: stakingProxy,
                        });
                    await verifyTransferPostconditionsAsync(
                        ZrxTransfer.Deposit,
                        staker,
                        constants.ZERO_AMOUNT,
                        initialVaultBalance,
                        initialTokenBalance,
                        receipt,
                    );
                });
                it('Staking proxy can deposit nonzero amount on behalf of staker', async () => {
                    const receipt = await zrxVault.depositFrom(staker, new BigNumber(1)).awaitTransactionSuccessAsync({
                        from: stakingProxy,
                    });
                    await verifyTransferPostconditionsAsync(
                        ZrxTransfer.Deposit,
                        staker,
                        new BigNumber(1),
                        initialVaultBalance,
                        initialTokenBalance,
                        receipt,
                    );
                });
                it('Staking proxy can deposit entire ZRX balance on behalf of staker', async () => {
                    const receipt = await zrxVault
                        .depositFrom(staker, initialTokenBalance)
                        .awaitTransactionSuccessAsync({
                            from: stakingProxy,
                        });
                    await verifyTransferPostconditionsAsync(
                        ZrxTransfer.Deposit,
                        staker,
                        initialTokenBalance,
                        initialVaultBalance,
                        initialTokenBalance,
                        receipt,
                    );
                });
                it("Reverts if attempting to deposit more than staker's ZRX balance", async () => {
                    const tx = zrxVault.depositFrom(staker, initialTokenBalance.plus(1)).sendTransactionAsync({
                        from: stakingProxy,
                    });
                    return expect(tx).to.revertWith(RevertReason.TransferFailed);
                });
            });
            describe('Withdrawal', () => {
                it('Staking proxy can withdraw zero amount on behalf of staker', async () => {
                    const receipt = await zrxVault
                        .withdrawFrom(staker, constants.ZERO_AMOUNT)
                        .awaitTransactionSuccessAsync({
                            from: stakingProxy,
                        });
                    await verifyTransferPostconditionsAsync(
                        ZrxTransfer.Withdrawal,
                        staker,
                        constants.ZERO_AMOUNT,
                        initialVaultBalance,
                        initialTokenBalance,
                        receipt,
                    );
                });
                it('Staking proxy can withdraw nonzero amount on behalf of staker', async () => {
                    const receipt = await zrxVault.withdrawFrom(staker, new BigNumber(1)).awaitTransactionSuccessAsync({
                        from: stakingProxy,
                    });
                    await verifyTransferPostconditionsAsync(
                        ZrxTransfer.Withdrawal,
                        staker,
                        new BigNumber(1),
                        initialVaultBalance,
                        initialTokenBalance,
                        receipt,
                    );
                });
                it('Staking proxy can withdraw entire vault balance on behalf of staker', async () => {
                    const receipt = await zrxVault
                        .withdrawFrom(staker, initialVaultBalance)
                        .awaitTransactionSuccessAsync({
                            from: stakingProxy,
                        });
                    await verifyTransferPostconditionsAsync(
                        ZrxTransfer.Withdrawal,
                        staker,
                        initialVaultBalance,
                        initialVaultBalance,
                        initialTokenBalance,
                        receipt,
                    );
                });
                it("Reverts if attempting to withdraw more than staker's vault balance", async () => {
                    const tx = zrxVault.withdrawFrom(staker, initialVaultBalance.plus(1)).awaitTransactionSuccessAsync({
                        from: stakingProxy,
                    });
                    const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                        SafeMathRevertErrors.BinOpErrorCodes.SubtractionUnderflow,
                        initialVaultBalance,
                        initialVaultBalance.plus(1),
                    );
                    expect(tx).to.revertWith(expectedError);
                });
            });
        });
    });

    describe('Catastrophic Failure Mode', () => {
        describe('Authorization', () => {
            async function verifyCatastrophicFailureModeAsync(
                sender: string,
                receipt: TransactionReceiptWithDecodedLogs,
            ): Promise<void> {
                const eventArgs = filterLogsToArguments<ZrxVaultInCatastrophicFailureModeEventArgs>(
                    receipt.logs,
                    'InCatastrophicFailureMode',
                );
                expect(eventArgs.length).to.equal(1);
                expect(eventArgs[0].sender).to.equal(sender);
                expect(await zrxVault.isInCatastrophicFailure().callAsync()).to.be.true();
            }

            it('Owner can turn on Catastrophic Failure Mode', async () => {
                const receipt = await zrxVault.enterCatastrophicFailure().awaitTransactionSuccessAsync({ from: owner });
                await verifyCatastrophicFailureModeAsync(owner, receipt);
            });
            it('Authorized address can turn on Catastrophic Failure Mode', async () => {
                const authorized = nonOwnerAddresses[0];
                await zrxVault.addAuthorizedAddress(authorized).awaitTransactionSuccessAsync({ from: owner });
                const receipt = await zrxVault.enterCatastrophicFailure().awaitTransactionSuccessAsync({
                    from: authorized,
                });
                await verifyCatastrophicFailureModeAsync(authorized, receipt);
            });
            it('Non-authorized address cannot turn on Catastrophic Failure Mode', async () => {
                const notAuthorized = nonOwnerAddresses[0];
                const tx = zrxVault.enterCatastrophicFailure().awaitTransactionSuccessAsync({
                    from: notAuthorized,
                });
                const expectedError = new AuthorizableRevertErrors.SenderNotAuthorizedError(notAuthorized);
                expect(tx).to.revertWith(expectedError);
                expect(await zrxVault.isInCatastrophicFailure().callAsync()).to.be.false();
            });
            it('Catastrophic Failure Mode can only be turned on once', async () => {
                const authorized = nonOwnerAddresses[0];
                await zrxVault.addAuthorizedAddress(authorized).awaitTransactionSuccessAsync({ from: owner });
                await zrxVault.enterCatastrophicFailure().awaitTransactionSuccessAsync({
                    from: authorized,
                });
                const expectedError = new StakingRevertErrors.OnlyCallableIfNotInCatastrophicFailureError();
                return expect(zrxVault.enterCatastrophicFailure().awaitTransactionSuccessAsync()).to.revertWith(
                    expectedError,
                );
            });
        });

        describe('Affected functionality', () => {
            let staker: string;
            let stakingProxy: string;
            let initialVaultBalance: BigNumber;
            let initialTokenBalance: BigNumber;

            before(async () => {
                [staker, stakingProxy, ...nonOwnerAddresses] = nonOwnerAddresses;
                await zrxVault.setStakingProxy(stakingProxy).awaitTransactionSuccessAsync({ from: owner });
                await zrxVault.depositFrom(staker, new BigNumber(10)).awaitTransactionSuccessAsync({
                    from: stakingProxy,
                });
                await zrxVault.enterCatastrophicFailure().awaitTransactionSuccessAsync({ from: owner });
            });

            beforeEach(async () => {
                initialVaultBalance = await zrxVault.balanceOf(staker).callAsync();
                initialTokenBalance = await erc20Wrapper.getBalanceAsync(staker, zrxAssetData);
            });

            it('Owner cannot set the ZRX proxy', async () => {
                const newProxy = nonOwnerAddresses[0];
                const tx = zrxVault.setZrxProxy(newProxy).awaitTransactionSuccessAsync({
                    from: owner,
                });
                const expectedError = new StakingRevertErrors.OnlyCallableIfNotInCatastrophicFailureError();
                expect(tx).to.revertWith(expectedError);
                const actualAddress = await zrxVault.zrxAssetProxy().callAsync();
                expect(actualAddress).to.equal(zrxProxyAddress);
            });
            it('Authorized address cannot set the ZRX proxy', async () => {
                const [authorized, newProxy] = nonOwnerAddresses;
                await zrxVault.addAuthorizedAddress(authorized).awaitTransactionSuccessAsync({ from: owner });
                const tx = zrxVault.setZrxProxy(newProxy).awaitTransactionSuccessAsync({
                    from: authorized,
                });
                const expectedError = new StakingRevertErrors.OnlyCallableIfNotInCatastrophicFailureError();
                expect(tx).to.revertWith(expectedError);
                const actualAddress = await zrxVault.zrxAssetProxy().callAsync();
                expect(actualAddress).to.equal(zrxProxyAddress);
            });
            it('Staking proxy cannot deposit ZRX', async () => {
                const tx = zrxVault.depositFrom(staker, new BigNumber(1)).awaitTransactionSuccessAsync({
                    from: stakingProxy,
                });
                const expectedError = new StakingRevertErrors.OnlyCallableIfNotInCatastrophicFailureError();
                expect(tx).to.revertWith(expectedError);
            });

            describe('Withdrawal', () => {
                it('Staking proxy cannot call `withdrawFrom`', async () => {
                    const tx = zrxVault.withdrawFrom(staker, new BigNumber(1)).awaitTransactionSuccessAsync({
                        from: stakingProxy,
                    });
                    const expectedError = new StakingRevertErrors.OnlyCallableIfNotInCatastrophicFailureError();
                    expect(tx).to.revertWith(expectedError);
                });
                it('Staker can withdraw all their ZRX', async () => {
                    const receipt = await zrxVault.withdrawAllFrom(staker).awaitTransactionSuccessAsync({
                        from: staker,
                    });
                    await verifyTransferPostconditionsAsync(
                        ZrxTransfer.Withdrawal,
                        staker,
                        initialVaultBalance,
                        initialVaultBalance,
                        initialTokenBalance,
                        receipt,
                    );
                });
                it('Owner can withdraw ZRX on behalf of a staker', async () => {
                    const receipt = await zrxVault.withdrawAllFrom(staker).awaitTransactionSuccessAsync({
                        from: owner,
                    });
                    await verifyTransferPostconditionsAsync(
                        ZrxTransfer.Withdrawal,
                        staker,
                        initialVaultBalance,
                        initialVaultBalance,
                        initialTokenBalance,
                        receipt,
                    );
                });
                it('Non-owner address can withdraw ZRX on behalf of a staker', async () => {
                    const receipt = await zrxVault.withdrawAllFrom(staker).awaitTransactionSuccessAsync({
                        from: nonOwnerAddresses[0],
                    });
                    await verifyTransferPostconditionsAsync(
                        ZrxTransfer.Withdrawal,
                        staker,
                        initialVaultBalance,
                        initialVaultBalance,
                        initialTokenBalance,
                        receipt,
                    );
                });
            });
        });
    });
});
