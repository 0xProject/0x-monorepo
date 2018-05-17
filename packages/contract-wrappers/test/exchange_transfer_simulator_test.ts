import { BlockchainLifecycle, devConstants } from '@0xproject/dev-utils';
import { BlockParamLiteral, Token } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import 'make-promises-safe';

import { ContractWrappers, ExchangeContractErrs } from '../src';
import { TradeSide, TransferType } from '../src/types';
import { ExchangeTransferSimulator } from '../src/utils/exchange_transfer_simulator';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('ExchangeTransferSimulator', () => {
    const config = {
        networkId: constants.TESTRPC_NETWORK_ID,
    };
    const contractWrappers = new ContractWrappers(provider, config);
    const transferAmount = new BigNumber(5);
    let userAddresses: string[];
    let tokens: Token[];
    let coinbase: string;
    let sender: string;
    let recipient: string;
    let exampleTokenAddress: string;
    let exchangeTransferSimulator: ExchangeTransferSimulator;
    let txHash: string;
    before(async () => {
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
        [coinbase, sender, recipient] = userAddresses;
        tokens = await contractWrappers.tokenRegistry.getTokensAsync();
        exampleTokenAddress = tokens[0].address;
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('#transferFromAsync', () => {
        beforeEach(() => {
            exchangeTransferSimulator = new ExchangeTransferSimulator(contractWrappers.token, BlockParamLiteral.Latest);
        });
        it("throws if the user doesn't have enough allowance", async () => {
            return expect(
                exchangeTransferSimulator.transferFromAsync(
                    exampleTokenAddress,
                    sender,
                    recipient,
                    transferAmount,
                    TradeSide.Taker,
                    TransferType.Trade,
                ),
            ).to.be.rejectedWith(ExchangeContractErrs.InsufficientTakerAllowance);
        });
        it("throws if the user doesn't have enough balance", async () => {
            txHash = await contractWrappers.token.setProxyAllowanceAsync(exampleTokenAddress, sender, transferAmount);
            await web3Wrapper.awaitTransactionMinedAsync(txHash);
            return expect(
                exchangeTransferSimulator.transferFromAsync(
                    exampleTokenAddress,
                    sender,
                    recipient,
                    transferAmount,
                    TradeSide.Maker,
                    TransferType.Trade,
                ),
            ).to.be.rejectedWith(ExchangeContractErrs.InsufficientMakerBalance);
        });
        it('updates balances and proxyAllowance after transfer', async () => {
            txHash = await contractWrappers.token.transferAsync(exampleTokenAddress, coinbase, sender, transferAmount);
            await web3Wrapper.awaitTransactionMinedAsync(txHash);
            txHash = await contractWrappers.token.setProxyAllowanceAsync(exampleTokenAddress, sender, transferAmount);
            await web3Wrapper.awaitTransactionMinedAsync(txHash);
            await exchangeTransferSimulator.transferFromAsync(
                exampleTokenAddress,
                sender,
                recipient,
                transferAmount,
                TradeSide.Taker,
                TransferType.Trade,
            );
            const store = (exchangeTransferSimulator as any)._store;
            const senderBalance = await store.getBalanceAsync(exampleTokenAddress, sender);
            const recipientBalance = await store.getBalanceAsync(exampleTokenAddress, recipient);
            const senderProxyAllowance = await store.getProxyAllowanceAsync(exampleTokenAddress, sender);
            expect(senderBalance).to.be.bignumber.equal(0);
            expect(recipientBalance).to.be.bignumber.equal(transferAmount);
            expect(senderProxyAllowance).to.be.bignumber.equal(0);
        });
        it("doesn't update proxyAllowance after transfer if unlimited", async () => {
            txHash = await contractWrappers.token.transferAsync(exampleTokenAddress, coinbase, sender, transferAmount);
            await web3Wrapper.awaitTransactionMinedAsync(txHash);
            txHash = await contractWrappers.token.setUnlimitedProxyAllowanceAsync(exampleTokenAddress, sender);
            await web3Wrapper.awaitTransactionMinedAsync(txHash);
            await exchangeTransferSimulator.transferFromAsync(
                exampleTokenAddress,
                sender,
                recipient,
                transferAmount,
                TradeSide.Taker,
                TransferType.Trade,
            );
            const store = (exchangeTransferSimulator as any)._store;
            const senderBalance = await store.getBalanceAsync(exampleTokenAddress, sender);
            const recipientBalance = await store.getBalanceAsync(exampleTokenAddress, recipient);
            const senderProxyAllowance = await store.getProxyAllowanceAsync(exampleTokenAddress, sender);
            expect(senderBalance).to.be.bignumber.equal(0);
            expect(recipientBalance).to.be.bignumber.equal(transferAmount);
            expect(senderProxyAllowance).to.be.bignumber.equal(
                contractWrappers.token.UNLIMITED_ALLOWANCE_IN_BASE_UNITS,
            );
        });
    });
});
