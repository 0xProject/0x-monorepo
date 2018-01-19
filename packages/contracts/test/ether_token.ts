import { ZeroEx, ZeroExError } from '0x.js';
import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { BigNumber, promisify } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import * as Web3 from 'web3';

import { Artifacts } from '../util/artifacts';
import { constants } from '../util/constants';

import { chaiSetup } from './utils/chai_setup';

const { EtherToken } = new Artifacts(artifacts);

chaiSetup.configure();
const expect = chai.expect;

// In order to benefit from type-safety, we re-assign the global web3 instance injected by Truffle
// with type `any` to a variable of type `Web3`.
const web3: Web3 = (global as any).web3;
const blockchainLifecycle = new BlockchainLifecycle(constants.RPC_URL);

describe.only('EtherToken', () => {
    const web3Wrapper = new Web3Wrapper(web3.currentProvider);
    let accounts: string[];
    let account: string;
    const gasPrice = ZeroEx.toBaseUnitAmount(new BigNumber(20), 9);
    let zeroEx: ZeroEx;
    let etherTokenAddress: string;
    const sendTransactionAsync = promisify<string>(web3.eth.sendTransaction);
    const getEthBalanceAsync = async (owner: string) => {
        const balanceStr = await promisify<string>(web3.eth.getBalance)(owner);
        const balance = new BigNumber(balanceStr);
        return balance;
    };
    before(async () => {
        accounts = await web3Wrapper.getAvailableAddressesAsync();
        account = accounts[0];
        etherTokenAddress = EtherToken.address;
        zeroEx = new ZeroEx(web3.currentProvider, {
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
            const initEthBalance = await getEthBalanceAsync(account);
            const ethToDeposit = initEthBalance.plus(1);

            return expect(zeroEx.etherToken.depositAsync(etherTokenAddress, ethToDeposit, account)).to.be.rejectedWith(
                ZeroExError.InsufficientEthBalanceForDeposit,
            );
        });

        it('should convert deposited Ether to wrapped Ether tokens', async () => {
            const initEthBalance = await getEthBalanceAsync(account);
            const initEthTokenBalance = await zeroEx.token.getBalanceAsync(etherTokenAddress, account);

            const ethToDeposit = new BigNumber(web3.toWei(1, 'ether'));

            const txHash = await zeroEx.etherToken.depositAsync(etherTokenAddress, ethToDeposit, account);
            const receipt = await zeroEx.awaitTransactionMinedAsync(txHash);

            const ethSpentOnGas = gasPrice.times(receipt.gasUsed);
            const finalEthBalance = await getEthBalanceAsync(account);
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
            ).to.be.rejectedWith(ZeroExError.InsufficientWEthBalanceForWithdrawal);
        });

        it('should convert ether tokens to ether with sufficient balance', async () => {
            const ethToDeposit = new BigNumber(web3.toWei(1, 'ether'));
            await zeroEx.etherToken.depositAsync(etherTokenAddress, ethToDeposit, account);
            const initEthTokenBalance = await zeroEx.token.getBalanceAsync(etherTokenAddress, account);
            const initEthBalance = await getEthBalanceAsync(account);
            const ethTokensToWithdraw = initEthTokenBalance;
            expect(ethTokensToWithdraw).to.not.be.bignumber.equal(0);
            const txHash = await zeroEx.etherToken.withdrawAsync(etherTokenAddress, ethTokensToWithdraw, account, {
                gasLimit: constants.MAX_ETHERTOKEN_WITHDRAW_GAS,
            });
            const receipt = await zeroEx.awaitTransactionMinedAsync(txHash);

            const ethSpentOnGas = gasPrice.times(receipt.gasUsed);
            const finalEthBalance = await getEthBalanceAsync(account);
            const finalEthTokenBalance = await zeroEx.token.getBalanceAsync(etherTokenAddress, account);

            expect(finalEthBalance).to.be.bignumber.equal(
                initEthBalance.plus(ethTokensToWithdraw.minus(ethSpentOnGas)),
            );
            expect(finalEthTokenBalance).to.be.bignumber.equal(initEthTokenBalance.minus(ethTokensToWithdraw));
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
