import { BlockchainLifecycle } from '@0x/dev-utils';
import { EthRPCClient } from '@0x/eth-rpc-client';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';

import { WETH9Contract } from '../../generated-wrappers/weth9';
import { artifacts } from '../../src/artifacts';
import { expectInsufficientFundsAsync, expectTransactionFailedWithoutReasonAsync } from '../utils/assertions';
import { chaiSetup } from '../utils/chai_setup';
import { constants } from '../utils/constants';
import { ethRPCClient, provider, txDefaults } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(ethRPCClient);

describe('EtherToken', () => {
    let account: string;
    const gasPrice = EthRPCClient.toBaseUnitAmount(new BigNumber(20), 9);
    let etherToken: WETH9Contract;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        const accounts = await ethRPCClient.getAvailableAddressesAsync();
        account = accounts[0];

        etherToken = await WETH9Contract.deployFrom0xArtifactAsync(artifacts.WETH9, provider, {
            gasPrice,
            ...txDefaults,
        });
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('deposit', () => {
        it('should throw if caller attempts to deposit more Ether than caller balance', async () => {
            const initEthBalance = await ethRPCClient.getBalanceInWeiAsync(account);
            const ethToDeposit = initEthBalance.plus(1);

            return expectInsufficientFundsAsync(etherToken.deposit.sendTransactionAsync({ value: ethToDeposit }));
        });

        it('should convert deposited Ether to wrapped Ether tokens', async () => {
            const initEthBalance = await ethRPCClient.getBalanceInWeiAsync(account);
            const initEthTokenBalance = await etherToken.balanceOf.callAsync(account);

            const ethToDeposit = new BigNumber(EthRPCClient.toWei(new BigNumber(1)));

            const txHash = await etherToken.deposit.sendTransactionAsync({ value: ethToDeposit });
            const receipt = await ethRPCClient.awaitTransactionSuccessAsync(
                txHash,
                constants.AWAIT_TRANSACTION_MINED_MS,
            );

            const ethSpentOnGas = gasPrice.times(receipt.gasUsed);
            const finalEthBalance = await ethRPCClient.getBalanceInWeiAsync(account);
            const finalEthTokenBalance = await etherToken.balanceOf.callAsync(account);

            expect(finalEthBalance).to.be.bignumber.equal(initEthBalance.minus(ethToDeposit.plus(ethSpentOnGas)));
            expect(finalEthTokenBalance).to.be.bignumber.equal(initEthTokenBalance.plus(ethToDeposit));
        });
    });

    describe('withdraw', () => {
        it('should throw if caller attempts to withdraw greater than caller balance', async () => {
            const initEthTokenBalance = await etherToken.balanceOf.callAsync(account);
            const ethTokensToWithdraw = initEthTokenBalance.plus(1);

            return expectTransactionFailedWithoutReasonAsync(
                etherToken.withdraw.sendTransactionAsync(ethTokensToWithdraw),
            );
        });

        it('should convert ether tokens to ether with sufficient balance', async () => {
            const ethToDeposit = new BigNumber(EthRPCClient.toWei(new BigNumber(1)));
            await ethRPCClient.awaitTransactionSuccessAsync(
                await etherToken.deposit.sendTransactionAsync({ value: ethToDeposit }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const initEthTokenBalance = await etherToken.balanceOf.callAsync(account);
            const initEthBalance = await ethRPCClient.getBalanceInWeiAsync(account);
            const ethTokensToWithdraw = initEthTokenBalance;
            expect(ethTokensToWithdraw).to.not.be.bignumber.equal(0);
            const txHash = await etherToken.withdraw.sendTransactionAsync(ethTokensToWithdraw, {
                gas: constants.MAX_ETHERTOKEN_WITHDRAW_GAS,
            });
            const receipt = await ethRPCClient.awaitTransactionSuccessAsync(
                txHash,
                constants.AWAIT_TRANSACTION_MINED_MS,
            );

            const ethSpentOnGas = gasPrice.times(receipt.gasUsed);
            const finalEthBalance = await ethRPCClient.getBalanceInWeiAsync(account);
            const finalEthTokenBalance = await etherToken.balanceOf.callAsync(account);

            expect(finalEthBalance).to.be.bignumber.equal(
                initEthBalance.plus(ethTokensToWithdraw.minus(ethSpentOnGas)),
            );
            expect(finalEthTokenBalance).to.be.bignumber.equal(initEthTokenBalance.minus(ethTokensToWithdraw));
        });
    });

    describe('fallback', () => {
        it('should convert sent ether to ether tokens', async () => {
            const initEthBalance = await ethRPCClient.getBalanceInWeiAsync(account);
            const initEthTokenBalance = await etherToken.balanceOf.callAsync(account);

            const ethToDeposit = EthRPCClient.toBaseUnitAmount(new BigNumber(1), 18);

            const txHash = await ethRPCClient.sendTransactionAsync({
                from: account,
                to: etherToken.address,
                value: ethToDeposit,
                gasPrice,
            });

            const receipt = await ethRPCClient.awaitTransactionSuccessAsync(
                txHash,
                constants.AWAIT_TRANSACTION_MINED_MS,
            );

            const ethSpentOnGas = gasPrice.times(receipt.gasUsed);
            const finalEthBalance = await ethRPCClient.getBalanceInWeiAsync(account);
            const finalEthTokenBalance = await etherToken.balanceOf.callAsync(account);

            expect(finalEthBalance).to.be.bignumber.equal(initEthBalance.minus(ethToDeposit.plus(ethSpentOnGas)));
            expect(finalEthTokenBalance).to.be.bignumber.equal(initEthTokenBalance.plus(ethToDeposit));
        });
    });
});
