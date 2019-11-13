import {
    chaiSetup,
    constants,
    expectInsufficientFundsAsync,
    expectTransactionFailedWithoutReasonAsync,
    provider,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';

import { WETH9Contract } from './wrappers';

import { artifacts } from './artifacts';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('EtherToken', () => {
    let account: string;
    const gasPrice = new BigNumber(constants.DEFAULT_GAS_PRICE);
    let etherToken: WETH9Contract;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        account = accounts[0];

        etherToken = await WETH9Contract.deployFrom0xArtifactAsync(
            artifacts.WETH9,
            provider,
            {
                gasPrice,
                ...txDefaults,
            },
            artifacts,
        );
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('deposit', () => {
        it('should revert if caller attempts to deposit more Ether than caller balance', async () => {
            const initEthBalance = await web3Wrapper.getBalanceInWeiAsync(account);
            const ethToDeposit = initEthBalance.plus(1);

            return expectInsufficientFundsAsync(etherToken.deposit.sendTransactionAsync({ value: ethToDeposit }));
        });

        it('should convert deposited Ether to wrapped Ether tokens', async () => {
            const initEthBalance = await web3Wrapper.getBalanceInWeiAsync(account);
            const initEthTokenBalance = await etherToken.balanceOf.callAsync(account);

            const ethToDeposit = new BigNumber(Web3Wrapper.toWei(new BigNumber(1)));

            const txHash = await etherToken.deposit.sendTransactionAsync({ value: ethToDeposit });
            const receipt = await web3Wrapper.awaitTransactionSuccessAsync(
                txHash,
                constants.AWAIT_TRANSACTION_MINED_MS,
            );

            const ethSpentOnGas = gasPrice.times(receipt.gasUsed);
            const finalEthBalance = await web3Wrapper.getBalanceInWeiAsync(account);
            const finalEthTokenBalance = await etherToken.balanceOf.callAsync(account);

            expect(finalEthBalance).to.be.bignumber.equal(initEthBalance.minus(ethToDeposit.plus(ethSpentOnGas)));
            expect(finalEthTokenBalance).to.be.bignumber.equal(initEthTokenBalance.plus(ethToDeposit));
        });
    });

    describe('withdraw', () => {
        it('should revert if caller attempts to withdraw greater than caller balance', async () => {
            const initEthTokenBalance = await etherToken.balanceOf.callAsync(account);
            const ethTokensToWithdraw = initEthTokenBalance.plus(1);

            return expectTransactionFailedWithoutReasonAsync(
                etherToken.withdraw.sendTransactionAsync(ethTokensToWithdraw),
            );
        });

        it('should convert ether tokens to ether with sufficient balance', async () => {
            const ethToDeposit = new BigNumber(Web3Wrapper.toWei(new BigNumber(1)));
            await web3Wrapper.awaitTransactionSuccessAsync(
                await etherToken.deposit.sendTransactionAsync({ value: ethToDeposit }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const initEthTokenBalance = await etherToken.balanceOf.callAsync(account);
            const initEthBalance = await web3Wrapper.getBalanceInWeiAsync(account);
            const ethTokensToWithdraw = initEthTokenBalance;
            expect(ethTokensToWithdraw).to.not.be.bignumber.equal(0);
            const txHash = await etherToken.withdraw.sendTransactionAsync(ethTokensToWithdraw, {
                gas: constants.MAX_ETHERTOKEN_WITHDRAW_GAS,
            });
            const receipt = await web3Wrapper.awaitTransactionSuccessAsync(
                txHash,
                constants.AWAIT_TRANSACTION_MINED_MS,
            );

            const ethSpentOnGas = gasPrice.times(receipt.gasUsed);
            const finalEthBalance = await web3Wrapper.getBalanceInWeiAsync(account);
            const finalEthTokenBalance = await etherToken.balanceOf.callAsync(account);

            expect(finalEthBalance).to.be.bignumber.equal(
                initEthBalance.plus(ethTokensToWithdraw.minus(ethSpentOnGas)),
            );
            expect(finalEthTokenBalance).to.be.bignumber.equal(initEthTokenBalance.minus(ethTokensToWithdraw));
        });
    });

    describe('fallback', () => {
        it('should convert sent ether to ether tokens', async () => {
            const initEthBalance = await web3Wrapper.getBalanceInWeiAsync(account);
            const initEthTokenBalance = await etherToken.balanceOf.callAsync(account);

            const ethToDeposit = Web3Wrapper.toBaseUnitAmount(new BigNumber(1), 18);

            const txHash = await web3Wrapper.sendTransactionAsync({
                from: account,
                to: etherToken.address,
                value: ethToDeposit,
                gasPrice,
            });

            const receipt = await web3Wrapper.awaitTransactionSuccessAsync(
                txHash,
                constants.AWAIT_TRANSACTION_MINED_MS,
            );

            const ethSpentOnGas = gasPrice.times(receipt.gasUsed);
            const finalEthBalance = await web3Wrapper.getBalanceInWeiAsync(account);
            const finalEthTokenBalance = await etherToken.balanceOf.callAsync(account);

            expect(finalEthBalance).to.be.bignumber.equal(initEthBalance.minus(ethToDeposit.plus(ethSpentOnGas)));
            expect(finalEthTokenBalance).to.be.bignumber.equal(initEthTokenBalance.plus(ethToDeposit));
        });
    });
});
