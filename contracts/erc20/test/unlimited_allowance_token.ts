import {
    chaiSetup,
    constants,
    expectContractCallFailedAsync,
    provider,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { RevertReason } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';

import { artifacts, DummyERC20TokenContract } from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('UnlimitedAllowanceToken', () => {
    let owner: string;
    let spender: string;
    const MAX_MINT_VALUE = new BigNumber(10000000000000000000000);
    let token: DummyERC20TokenContract;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        owner = accounts[0];
        spender = accounts[1];
        token = await DummyERC20TokenContract.deployFrom0xArtifactAsync(
            artifacts.DummyERC20Token,
            provider,
            txDefaults,
            artifacts,
            constants.DUMMY_TOKEN_NAME,
            constants.DUMMY_TOKEN_SYMBOL,
            constants.DUMMY_TOKEN_DECIMALS,
            constants.DUMMY_TOKEN_TOTAL_SUPPLY,
        );
        await web3Wrapper.awaitTransactionSuccessAsync(
            await token.mint(MAX_MINT_VALUE).sendTransactionAsync({ from: owner }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('transfer', () => {
        it('should revert if owner has insufficient balance', async () => {
            const ownerBalance = await token.balanceOf(owner).callAsync();
            const amountToTransfer = ownerBalance.plus(1);
            return expectContractCallFailedAsync(
                token.transfer(spender, amountToTransfer).callAsync({ from: owner }),
                RevertReason.Erc20InsufficientBalance,
            );
        });

        it('should transfer balance from sender to receiver', async () => {
            const receiver = spender;
            const initOwnerBalance = await token.balanceOf(owner).callAsync();
            const amountToTransfer = new BigNumber(1);
            await web3Wrapper.awaitTransactionSuccessAsync(
                await token.transfer(receiver, amountToTransfer).sendTransactionAsync({ from: owner }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const finalOwnerBalance = await token.balanceOf(owner).callAsync();
            const finalReceiverBalance = await token.balanceOf(receiver).callAsync();

            const expectedFinalOwnerBalance = initOwnerBalance.minus(amountToTransfer);
            const expectedFinalReceiverBalance = amountToTransfer;
            expect(finalOwnerBalance).to.be.bignumber.equal(expectedFinalOwnerBalance);
            expect(finalReceiverBalance).to.be.bignumber.equal(expectedFinalReceiverBalance);
        });

        it('should return true on a 0 value transfer', async () => {
            const didReturnTrue = await token.transfer(spender, new BigNumber(0)).callAsync({
                from: owner,
            });
            expect(didReturnTrue).to.be.true();
        });
    });

    describe('transferFrom', () => {
        it('should revert if owner has insufficient balance', async () => {
            const ownerBalance = await token.balanceOf(owner).callAsync();
            const amountToTransfer = ownerBalance.plus(1);
            await web3Wrapper.awaitTransactionSuccessAsync(
                await token.approve(spender, amountToTransfer).sendTransactionAsync({ from: owner }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            return expectContractCallFailedAsync(
                token.transferFrom(owner, spender, amountToTransfer).callAsync({
                    from: spender,
                }),
                RevertReason.Erc20InsufficientBalance,
            );
        });

        it('should revert if spender has insufficient allowance', async () => {
            const ownerBalance = await token.balanceOf(owner).callAsync();
            const amountToTransfer = ownerBalance;

            const spenderAllowance = await token.allowance(owner, spender).callAsync();
            const isSpenderAllowanceInsufficient = spenderAllowance.comparedTo(amountToTransfer) < 0;
            expect(isSpenderAllowanceInsufficient).to.be.true();

            return expectContractCallFailedAsync(
                token.transferFrom(owner, spender, amountToTransfer).callAsync({
                    from: spender,
                }),
                RevertReason.Erc20InsufficientAllowance,
            );
        });

        it('should return true on a 0 value transfer', async () => {
            const amountToTransfer = new BigNumber(0);
            const didReturnTrue = await token.transferFrom(owner, spender, amountToTransfer).callAsync({
                from: spender,
            });
            expect(didReturnTrue).to.be.true();
        });

        it('should not modify spender allowance if spender allowance is 2^256 - 1', async () => {
            const initOwnerBalance = await token.balanceOf(owner).callAsync();
            const amountToTransfer = initOwnerBalance;
            const initSpenderAllowance = constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS;
            await web3Wrapper.awaitTransactionSuccessAsync(
                await token.approve(spender, initSpenderAllowance).sendTransactionAsync({ from: owner }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await token.transferFrom(owner, spender, amountToTransfer).sendTransactionAsync({
                    from: spender,
                    gas: constants.MAX_TOKEN_TRANSFERFROM_GAS,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );

            const newSpenderAllowance = await token.allowance(owner, spender).callAsync();
            expect(initSpenderAllowance).to.be.bignumber.equal(newSpenderAllowance);
        });

        it('should transfer the correct balances if spender has sufficient allowance', async () => {
            const initOwnerBalance = await token.balanceOf(owner).callAsync();
            const amountToTransfer = initOwnerBalance;
            const initSpenderAllowance = initOwnerBalance;
            await web3Wrapper.awaitTransactionSuccessAsync(
                await token.approve(spender, initSpenderAllowance).sendTransactionAsync({ from: owner }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await token.transferFrom(owner, spender, amountToTransfer).sendTransactionAsync({
                    from: spender,
                    gas: constants.MAX_TOKEN_TRANSFERFROM_GAS,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );

            const newOwnerBalance = await token.balanceOf(owner).callAsync();
            const newSpenderBalance = await token.balanceOf(spender).callAsync();

            expect(newOwnerBalance).to.be.bignumber.equal(0);
            expect(newSpenderBalance).to.be.bignumber.equal(initOwnerBalance);
        });

        it('should modify allowance if spender has sufficient allowance less than 2^256 - 1', async () => {
            const initOwnerBalance = await token.balanceOf(owner).callAsync();
            const amountToTransfer = initOwnerBalance;
            const initSpenderAllowance = initOwnerBalance;
            await web3Wrapper.awaitTransactionSuccessAsync(
                await token.approve(spender, initSpenderAllowance).sendTransactionAsync({ from: owner }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await token.transferFrom(owner, spender, amountToTransfer).sendTransactionAsync({
                    from: spender,
                    gas: constants.MAX_TOKEN_TRANSFERFROM_GAS,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );

            const newSpenderAllowance = await token.allowance(owner, spender).callAsync();
            expect(newSpenderAllowance).to.be.bignumber.equal(0);
        });
    });
});
