import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { ExchangeContractErrs, Token } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import { BlockParamLiteral } from 'ethereum-types';
import * as _ from 'lodash';
import 'make-promises-safe';

import { artifacts } from '../src/artifacts';
import { constants } from '../src/constants';
import { ExchangeTransferSimulator } from '../src/exchange_transfer_simulator';
import { DummyERC20TokenContract } from '../src/generated_contract_wrappers/dummy_e_r_c20_token';
import { BalanceAndProxyAllowanceLazyStore } from '../src/store/balance_and_proxy_allowance_lazy_store';
import { TradeSide, TransferType } from '../src/types';

import { chaiSetup } from './utils/chai_setup';
import { SimpleERC20BalanceAndProxyAllowanceFetcher } from './utils/simple_erc20_balance_and_proxy_allowance_fetcher';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('ExchangeTransferSimulator', async () => {
    const transferAmount = new BigNumber(5);
    let userAddresses: string[];
    let dummyERC20Token: DummyERC20TokenContract;
    let coinbase: string;
    let sender: string;
    let recipient: string;
    let exampleTokenAddress: string;
    let exchangeTransferSimulator: ExchangeTransferSimulator;
    let txHash: string;
    let erc20ProxyAddress: string;
    before(async () => {
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
        [coinbase, sender, recipient] = userAddresses;

        erc20ProxyAddress = getAddressFromArtifact(artifacts.ERC20Proxy, constants.TESTRPC_NETWORK_ID);

        const wethArtifact = artifacts.DummyERC20Token;
        const wethAddress = getAddressFromArtifact(wethArtifact, constants.TESTRPC_NETWORK_ID);
        dummyERC20Token = new DummyERC20TokenContract(
            artifacts.DummyERC20Token.compilerOutput.abi,
            wethAddress,
            provider,
        );
        exampleTokenAddress = dummyERC20Token.address;
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('#transferFromAsync', function(): void {
        // HACK: For some reason these tests need a slightly longer timeout
        const mochaTestTimeoutMs = 3000;
        this.timeout(mochaTestTimeoutMs);

        beforeEach(() => {
            const simpleERC20BalanceAndProxyAllowanceFetcher = new SimpleERC20BalanceAndProxyAllowanceFetcher(
                dummyERC20Token,
                erc20ProxyAddress,
            );
            const balanceAndProxyAllowanceLazyStore = new BalanceAndProxyAllowanceLazyStore(
                simpleERC20BalanceAndProxyAllowanceFetcher,
            );
            exchangeTransferSimulator = new ExchangeTransferSimulator(balanceAndProxyAllowanceLazyStore);
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
            txHash = await dummyERC20Token.approve.sendTransactionAsync(erc20ProxyAddress, transferAmount, {
                from: sender,
            });
            await web3Wrapper.awaitTransactionSuccessAsync(txHash);
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
        it('updates balances and proxyAllowance after transfer', async function(): Promise<void> {
            txHash = await dummyERC20Token.transfer.sendTransactionAsync(sender, transferAmount, {
                from: coinbase,
            });
            await web3Wrapper.awaitTransactionSuccessAsync(txHash);

            txHash = await dummyERC20Token.approve.sendTransactionAsync(erc20ProxyAddress, transferAmount, {
                from: sender,
            });
            await web3Wrapper.awaitTransactionSuccessAsync(txHash);

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
            txHash = await dummyERC20Token.transfer.sendTransactionAsync(sender, transferAmount, {
                from: coinbase,
            });
            await web3Wrapper.awaitTransactionSuccessAsync(txHash);
            txHash = await dummyERC20Token.approve.sendTransactionAsync(
                erc20ProxyAddress,
                constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS,
                {
                    from: sender,
                },
            );
            await web3Wrapper.awaitTransactionSuccessAsync(txHash);
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
            expect(senderProxyAllowance).to.be.bignumber.equal(constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS);
        });
    });
});

function getAddressFromArtifact(artifact: any, networkId: number): string {
    if (_.isUndefined(artifact.networks[networkId])) {
        throw new Error(`Contract ${artifact.contractName} not deployed to network ${networkId}`);
    }
    const contractAddress = artifact.networks[networkId].address.toLowerCase();
    return contractAddress;
}
