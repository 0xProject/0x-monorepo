import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { BigNumber, promisify } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import 'make-promises-safe';

import { WETH9Contract } from '../src/contract_wrappers/generated/weth9';
import { artifacts } from '../src/utils/artifacts';
import { chaiSetup } from '../src/utils/chai_setup';
import { constants } from '../src/utils/constants';
import { provider, txDefaults, web3Wrapper } from '../src/utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('EtherToken', () => {
    let account: string;
    const gasPrice = Web3Wrapper.toBaseUnitAmount(new BigNumber(20), 9);
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

        etherToken = await WETH9Contract.deployFrom0xArtifactAsync(artifacts.EtherToken, provider, {
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
            const initEthBalance = await web3Wrapper.getBalanceInWeiAsync(account);
            const ethToDeposit = initEthBalance.plus(1);

            return expect(etherToken.deposit.sendTransactionAsync({ value: ethToDeposit })).to.be.rejectedWith(
                "ender doesn't have enough funds to send tx.",
            );
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
        it('should throw if caller attempts to withdraw greater than caller balance', async () => {
            const initEthTokenBalance = await etherToken.balanceOf.callAsync(account);
            const ethTokensToWithdraw = initEthTokenBalance.plus(1);

            return expect(etherToken.withdraw.sendTransactionAsync(ethTokensToWithdraw)).to.be.rejectedWith(
                constants.REVERT,
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
