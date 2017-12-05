import {ZeroEx, ZeroExError} from '0x.js';
import {BigNumber} from 'bignumber.js';
import * as chai from 'chai';
import promisify = require('es6-promisify');
import Web3 = require('web3');

import {Artifacts} from '../../util/artifacts';

import {chaiSetup} from './utils/chai_setup';

const {EtherTokenV2} = new Artifacts(artifacts);

chaiSetup.configure();
const expect = chai.expect;

// In order to benefit from type-safety, we re-assign the global web3 instance injected by Truffle
// with type `any` to a variable of type `Web3`.
const web3: Web3 = (global as any).web3;

contract('EtherTokenV2', (accounts: string[]) => {
    const account = accounts[0];
    const gasPrice = ZeroEx.toBaseUnitAmount(new BigNumber(20), 9);
    let zeroEx: ZeroEx;
    let etherTokenAddress: string;
    beforeEach(async () => {
        const etherToken = await EtherTokenV2.new();
        etherTokenAddress = etherToken.address;
        zeroEx = new ZeroEx(web3.currentProvider, {
                gasPrice,
                etherTokenContractAddress: etherTokenAddress,
        });
    });

    const sendTransactionAsync = promisify(web3.eth.sendTransaction);
    const getEthBalanceAsync = async (owner: string) => {
        const balanceStr = await promisify(web3.eth.getBalance)(owner);
        const balance = new BigNumber(balanceStr);
        return balance;
    };

    describe('deposit', () => {
        it('should throw if caller attempts to deposit more Ether than caller balance', async () => {
            const initEthBalance = await getEthBalanceAsync(account);
            const ethToDeposit = initEthBalance.plus(1);

            return expect(zeroEx.etherToken.depositAsync(ethToDeposit, account))
                .to.be.rejectedWith(ZeroExError.InsufficientEthBalanceForDeposit);
        });

        it('should convert deposited Ether to wrapped Ether tokens', async () => {
            const initEthBalance = await getEthBalanceAsync(account);
            const initEthTokenBalance = await zeroEx.token.getBalanceAsync(etherTokenAddress, account);

            const ethToDeposit = new BigNumber(web3.toWei(1, 'ether'));

            const txHash = await zeroEx.etherToken.depositAsync(ethToDeposit, account);
            const receipt = await zeroEx.awaitTransactionMinedAsync(txHash);

            const ethSpentOnGas = gasPrice.times(receipt.gasUsed);
            const finalEthBalance = await getEthBalanceAsync(account);
            const finalEthTokenBalance = await zeroEx.token.getBalanceAsync(etherTokenAddress, account);

            expect(finalEthBalance).to.be.bignumber.equal(initEthBalance.minus(ethToDeposit.plus(ethSpentOnGas)));
            expect(finalEthTokenBalance).to.be.bignumber.equal(initEthTokenBalance.plus(ethToDeposit));
        });

        it('should log 1 event with correct arguments', async () => {
            const ethToDeposit = new BigNumber(web3.toWei(1, 'ether'));

            const txHash = await zeroEx.etherToken.depositAsync(ethToDeposit, account);
            const receipt = await zeroEx.awaitTransactionMinedAsync(txHash);

            const logs = receipt.logs;
            expect(logs.length).to.equal(1);

            const expectedFrom = ZeroEx.NULL_ADDRESS;
            const expectedTo = account;
            const expectedValue = ethToDeposit;
            const logArgs = logs[0].args;
            expect(logArgs._from).to.equal(expectedFrom);
            expect(logArgs._to).to.equal(expectedTo);
            expect(logArgs._value).to.be.bignumber.equal(ethToDeposit);
        });
    });

    describe('withdraw', () => {
        beforeEach(async () => {
            const ethToDeposit = new BigNumber(web3.toWei(1, 'ether'));
            await zeroEx.etherToken.depositAsync(ethToDeposit, account);
        });

        it('should throw if caller attempts to withdraw greater than caller balance', async () => {
            const initEthTokenBalance = await zeroEx.token.getBalanceAsync(etherTokenAddress, account);
            const ethTokensToWithdraw = initEthTokenBalance.plus(1);

            return expect(zeroEx.etherToken.withdrawAsync(ethTokensToWithdraw, account))
                .to.be.rejectedWith(ZeroExError.InsufficientWEthBalanceForWithdrawal);
        });

        it('should convert ether tokens to ether with sufficient balance', async () => {
            const initEthTokenBalance = await zeroEx.token.getBalanceAsync(etherTokenAddress, account);
            const initEthBalance = await getEthBalanceAsync(account);
            const ethTokensToWithdraw = initEthTokenBalance;
            expect(ethTokensToWithdraw).to.not.be.bignumber.equal(0);
            const txHash = await zeroEx.etherToken.withdrawAsync(ethTokensToWithdraw, account);
            const receipt = await zeroEx.awaitTransactionMinedAsync(txHash);

            const ethSpentOnGas = gasPrice.times(receipt.gasUsed);
            const finalEthBalance = await getEthBalanceAsync(account);
            const finalEthTokenBalance = await zeroEx.token.getBalanceAsync(etherTokenAddress, account);

            expect(finalEthBalance).to.be.bignumber
                .equal(initEthBalance.plus(ethTokensToWithdraw.minus(ethSpentOnGas)));
            expect(finalEthTokenBalance).to.be.bignumber.equal(initEthTokenBalance.minus(ethTokensToWithdraw));
        });

        it('should log 1 event with correct arguments', async () => {
            const initEthTokenBalance = await zeroEx.token.getBalanceAsync(etherTokenAddress, account);
            const initEthBalance = await getEthBalanceAsync(account);
            const ethTokensToWithdraw = initEthTokenBalance;
            expect(ethTokensToWithdraw).to.not.be.bignumber.equal(0);
            const txHash = await zeroEx.etherToken.withdrawAsync(ethTokensToWithdraw, account);
            const receipt = await zeroEx.awaitTransactionMinedAsync(txHash);

            const logs = receipt.logs;
            expect(logs.length).to.equal(1);

            const expectedFrom = account;
            const expectedTo = ZeroEx.NULL_ADDRESS;
            const expectedValue = ethTokensToWithdraw;
            const logArgs = logs[0].args;
            expect(logArgs._from).to.equal(expectedFrom);
            expect(logArgs._to).to.equal(expectedTo);
            expect(logArgs._value).to.be.bignumber.equal(ethTokensToWithdraw);
        });
    });

    describe('fallback', () => {
        it('should convert sent ether to ether tokens', async () => {
            const initEthBalance = await getEthBalanceAsync(account);
            const initEthTokenBalance = await zeroEx.token.getBalanceAsync(etherTokenAddress, account);

            const ethToDeposit = ZeroEx.toBaseUnitAmount(new BigNumber(1), 18);

            const txHash = await sendTransactionAsync({
                from: account,
                to: etherTokenAddress,
                value: ethToDeposit,
                gasPrice,
            });

            const receipt = await zeroEx.awaitTransactionMinedAsync(txHash);

            const ethSpentOnGas = gasPrice.times(receipt.gasUsed);
            const finalEthBalance = await getEthBalanceAsync(account);
            const finalEthTokenBalance = await zeroEx.token.getBalanceAsync(etherTokenAddress, account);

            expect(finalEthBalance).to.be.bignumber.equal(initEthBalance.minus(ethToDeposit.plus(ethSpentOnGas)));
            expect(finalEthTokenBalance).to.be.bignumber.equal(initEthTokenBalance.plus(ethToDeposit));
        });
    });
});
