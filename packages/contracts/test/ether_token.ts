import { ContractWrappers, ContractWrappersError } from '@0xproject/contract-wrappers';
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
    let contractWrappers: ContractWrappers;
    let etherTokenAddress: string;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        account = accounts[0];

        const etherToken = await WETH9Contract.deployFrom0xArtifactAsync(artifacts.EtherToken, provider, txDefaults);
        etherTokenAddress = etherToken.address;
        contractWrappers = new ContractWrappers(provider, {
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

            return expect(
                contractWrappers.etherToken.depositAsync(etherTokenAddress, ethToDeposit, account),
            ).to.be.rejectedWith(ContractWrappersError.InsufficientEthBalanceForDeposit);
        });

        it('should convert deposited Ether to wrapped Ether tokens', async () => {
            const initEthBalance = await web3Wrapper.getBalanceInWeiAsync(account);
            const initEthTokenBalance = await contractWrappers.token.getBalanceAsync(etherTokenAddress, account);

            const ethToDeposit = new BigNumber(Web3Wrapper.toWei(new BigNumber(1)));

            const txHash = await contractWrappers.etherToken.depositAsync(etherTokenAddress, ethToDeposit, account);
            const receipt = await web3Wrapper.awaitTransactionSuccessAsync(
                txHash,
                constants.AWAIT_TRANSACTION_MINED_MS,
            );

            const ethSpentOnGas = gasPrice.times(receipt.gasUsed);
            const finalEthBalance = await web3Wrapper.getBalanceInWeiAsync(account);
            const finalEthTokenBalance = await contractWrappers.token.getBalanceAsync(etherTokenAddress, account);

            expect(finalEthBalance).to.be.bignumber.equal(initEthBalance.minus(ethToDeposit.plus(ethSpentOnGas)));
            expect(finalEthTokenBalance).to.be.bignumber.equal(initEthTokenBalance.plus(ethToDeposit));
        });
    });

    describe('withdraw', () => {
        it('should throw if caller attempts to withdraw greater than caller balance', async () => {
            const initEthTokenBalance = await contractWrappers.token.getBalanceAsync(etherTokenAddress, account);
            const ethTokensToWithdraw = initEthTokenBalance.plus(1);

            return expect(
                contractWrappers.etherToken.withdrawAsync(etherTokenAddress, ethTokensToWithdraw, account),
            ).to.be.rejectedWith(ContractWrappersError.InsufficientWEthBalanceForWithdrawal);
        });

        it('should convert ether tokens to ether with sufficient balance', async () => {
            const ethToDeposit = new BigNumber(Web3Wrapper.toWei(new BigNumber(1)));
            await contractWrappers.etherToken.depositAsync(etherTokenAddress, ethToDeposit, account);
            const initEthTokenBalance = await contractWrappers.token.getBalanceAsync(etherTokenAddress, account);
            const initEthBalance = await web3Wrapper.getBalanceInWeiAsync(account);
            const ethTokensToWithdraw = initEthTokenBalance;
            expect(ethTokensToWithdraw).to.not.be.bignumber.equal(0);
            const txHash = await contractWrappers.etherToken.withdrawAsync(
                etherTokenAddress,
                ethTokensToWithdraw,
                account,
                {
                    gasLimit: constants.MAX_ETHERTOKEN_WITHDRAW_GAS,
                },
            );
            const receipt = await web3Wrapper.awaitTransactionSuccessAsync(
                txHash,
                constants.AWAIT_TRANSACTION_MINED_MS,
            );

            const ethSpentOnGas = gasPrice.times(receipt.gasUsed);
            const finalEthBalance = await web3Wrapper.getBalanceInWeiAsync(account);
            const finalEthTokenBalance = await contractWrappers.token.getBalanceAsync(etherTokenAddress, account);

            expect(finalEthBalance).to.be.bignumber.equal(
                initEthBalance.plus(ethTokensToWithdraw.minus(ethSpentOnGas)),
            );
            expect(finalEthTokenBalance).to.be.bignumber.equal(initEthTokenBalance.minus(ethTokensToWithdraw));
        });
    });

    describe('fallback', () => {
        it('should convert sent ether to ether tokens', async () => {
            const initEthBalance = await web3Wrapper.getBalanceInWeiAsync(account);
            const initEthTokenBalance = await contractWrappers.token.getBalanceAsync(etherTokenAddress, account);

            const ethToDeposit = Web3Wrapper.toBaseUnitAmount(new BigNumber(1), 18);

            const txHash = await web3Wrapper.sendTransactionAsync({
                from: account,
                to: etherTokenAddress,
                value: ethToDeposit,
                gasPrice,
            });

            const receipt = await web3Wrapper.awaitTransactionSuccessAsync(
                txHash,
                constants.AWAIT_TRANSACTION_MINED_MS,
            );

            const ethSpentOnGas = gasPrice.times(receipt.gasUsed);
            const finalEthBalance = await web3Wrapper.getBalanceInWeiAsync(account);
            const finalEthTokenBalance = await contractWrappers.token.getBalanceAsync(etherTokenAddress, account);

            expect(finalEthBalance).to.be.bignumber.equal(initEthBalance.minus(ethToDeposit.plus(ethSpentOnGas)));
            expect(finalEthTokenBalance).to.be.bignumber.equal(initEthTokenBalance.plus(ethToDeposit));
        });
    });
});
