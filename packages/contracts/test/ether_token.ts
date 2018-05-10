import { ContractWrappersError, ZeroEx } from '0x.js';
import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { BigNumber, promisify } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';

import { constants } from '../util/constants';
import { ContractName } from '../util/types';

import { chaiSetup } from './utils/chai_setup';
import { deployer } from './utils/deployer';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('EtherToken', () => {
    let account: string;
    const gasPrice = ZeroEx.toBaseUnitAmount(new BigNumber(20), 9);
    let zeroEx: ZeroEx;
    let etherTokenAddress: string;
    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        account = accounts[0];

        const etherToken = await deployer.deployAsync(ContractName.EtherToken);
        etherTokenAddress = etherToken.address;
        zeroEx = new ZeroEx(provider, {
            gasPrice,
            networkId: constants.TESTRPC_NETWORK_ID,
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

            return expect(zeroEx.etherToken.depositAsync(etherTokenAddress, ethToDeposit, account)).to.be.rejectedWith(
                ContractWrappersError.InsufficientEthBalanceForDeposit,
            );
        });

        it('should convert deposited Ether to wrapped Ether tokens', async () => {
            const initEthBalance = await web3Wrapper.getBalanceInWeiAsync(account);
            const initEthTokenBalance = await zeroEx.token.getBalanceAsync(etherTokenAddress, account);

            const ethToDeposit = new BigNumber(Web3Wrapper.toWei(new BigNumber(1)));

            const txHash = await zeroEx.etherToken.depositAsync(etherTokenAddress, ethToDeposit, account);
            const receipt = await zeroEx.awaitTransactionMinedAsync(txHash);

            const ethSpentOnGas = gasPrice.times(receipt.gasUsed);
            const finalEthBalance = await web3Wrapper.getBalanceInWeiAsync(account);
            const finalEthTokenBalance = await zeroEx.token.getBalanceAsync(etherTokenAddress, account);

            expect(finalEthBalance).to.be.bignumber.equal(initEthBalance.minus(ethToDeposit.plus(ethSpentOnGas)));
            expect(finalEthTokenBalance).to.be.bignumber.equal(initEthTokenBalance.plus(ethToDeposit));
        });
    });

    describe('withdraw', () => {
        it('should throw if caller attempts to withdraw greater than caller balance', async () => {
            const initEthTokenBalance = await zeroEx.token.getBalanceAsync(etherTokenAddress, account);
            const ethTokensToWithdraw = initEthTokenBalance.plus(1);

            return expect(
                zeroEx.etherToken.withdrawAsync(etherTokenAddress, ethTokensToWithdraw, account),
            ).to.be.rejectedWith(ContractWrappersError.InsufficientWEthBalanceForWithdrawal);
        });

        it('should convert ether tokens to ether with sufficient balance', async () => {
            const ethToDeposit = new BigNumber(Web3Wrapper.toWei(new BigNumber(1)));
            await zeroEx.etherToken.depositAsync(etherTokenAddress, ethToDeposit, account);
            const initEthTokenBalance = await zeroEx.token.getBalanceAsync(etherTokenAddress, account);
            const initEthBalance = await web3Wrapper.getBalanceInWeiAsync(account);
            const ethTokensToWithdraw = initEthTokenBalance;
            expect(ethTokensToWithdraw).to.not.be.bignumber.equal(0);
            const txHash = await zeroEx.etherToken.withdrawAsync(etherTokenAddress, ethTokensToWithdraw, account, {
                gasLimit: constants.MAX_ETHERTOKEN_WITHDRAW_GAS,
            });
            const receipt = await zeroEx.awaitTransactionMinedAsync(txHash);

            const ethSpentOnGas = gasPrice.times(receipt.gasUsed);
            const finalEthBalance = await web3Wrapper.getBalanceInWeiAsync(account);
            const finalEthTokenBalance = await zeroEx.token.getBalanceAsync(etherTokenAddress, account);

            expect(finalEthBalance).to.be.bignumber.equal(
                initEthBalance.plus(ethTokensToWithdraw.minus(ethSpentOnGas)),
            );
            expect(finalEthTokenBalance).to.be.bignumber.equal(initEthTokenBalance.minus(ethTokensToWithdraw));
        });
    });

    describe('fallback', () => {
        it('should convert sent ether to ether tokens', async () => {
            const initEthBalance = await web3Wrapper.getBalanceInWeiAsync(account);
            const initEthTokenBalance = await zeroEx.token.getBalanceAsync(etherTokenAddress, account);

            const ethToDeposit = ZeroEx.toBaseUnitAmount(new BigNumber(1), 18);

            const txHash = await web3Wrapper.sendTransactionAsync({
                from: account,
                to: etherTokenAddress,
                value: ethToDeposit,
                gasPrice,
            });

            const receipt = await zeroEx.awaitTransactionMinedAsync(txHash);

            const ethSpentOnGas = gasPrice.times(receipt.gasUsed);
            const finalEthBalance = await web3Wrapper.getBalanceInWeiAsync(account);
            const finalEthTokenBalance = await zeroEx.token.getBalanceAsync(etherTokenAddress, account);

            expect(finalEthBalance).to.be.bignumber.equal(initEthBalance.minus(ethToDeposit.plus(ethSpentOnGas)));
            expect(finalEthTokenBalance).to.be.bignumber.equal(initEthTokenBalance.plus(ethToDeposit));
        });
    });
});
