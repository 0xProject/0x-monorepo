import { BlockchainLifecycle, callbackErrorReporter, devConstants, web3Factory } from '@0xproject/dev-utils';
import { DoneCallback } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import 'mocha';

import {
    ApprovalContractEventArgs,
    BlockParamLiteral,
    BlockRange,
    ContractWrappers,
    ContractWrappersError,
    DecodedLogEvent,
    DepositContractEventArgs,
    EtherTokenEvents,
    Token,
    TransferContractEventArgs,
    WithdrawalContractEventArgs,
} from '../src';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';
import { TokenUtils } from './utils/token_utils';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

// Since the address depositing/withdrawing ETH/WETH also needs to pay gas costs for the transaction,
// a small amount of ETH will be used to pay this gas cost. We therefore check that the difference between
// the expected balance and actual balance (given the amount of ETH deposited), only deviates by the amount
// required to pay gas costs.
const MAX_REASONABLE_GAS_COST_IN_WEI = 62517;

describe('EtherTokenWrapper', () => {
    let contractWrappers: ContractWrappers;
    let tokens: Token[];
    let userAddresses: string[];
    let addressWithETH: string;
    let wethContractAddress: string;
    let depositWeiAmount: BigNumber;
    const decimalPlaces = 7;
    let addressWithoutFunds: string;
    const gasPrice = new BigNumber(1);
    const zeroExConfig = {
        gasPrice,
        networkId: constants.TESTRPC_NETWORK_ID,
    };
    const transferAmount = new BigNumber(42);
    const allowanceAmount = new BigNumber(42);
    const depositAmount = new BigNumber(42);
    const withdrawalAmount = new BigNumber(42);
    before(async () => {
        contractWrappers = new ContractWrappers(provider, zeroExConfig);
        tokens = await contractWrappers.tokenRegistry.getTokensAsync();
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
        addressWithETH = userAddresses[0];
        wethContractAddress = contractWrappers.etherToken.getContractAddressIfExists() as string;
        depositWeiAmount = Web3Wrapper.toWei(new BigNumber(5));
        addressWithoutFunds = userAddresses[1];
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('#getContractAddressIfExists', async () => {
        it('should return contract address if connected to a known network', () => {
            const contractAddressIfExists = contractWrappers.etherToken.getContractAddressIfExists();
            expect(contractAddressIfExists).to.not.be.undefined();
        });
        it('should throw if connected to a private network and contract addresses are not specified', () => {
            const UNKNOWN_NETWORK_NETWORK_ID = 10;
            expect(
                () =>
                    new ContractWrappers(provider, {
                        networkId: UNKNOWN_NETWORK_NETWORK_ID,
                    } as any),
            ).to.throw();
        });
    });
    describe('#depositAsync', () => {
        it('should successfully deposit ETH and issue Wrapped ETH tokens', async () => {
            const preETHBalance = await web3Wrapper.getBalanceInWeiAsync(addressWithETH);
            const preWETHBalance = await contractWrappers.token.getBalanceAsync(wethContractAddress, addressWithETH);
            expect(preETHBalance).to.be.bignumber.gt(0);
            expect(preWETHBalance).to.be.bignumber.equal(0);

            const txHash = await contractWrappers.etherToken.depositAsync(
                wethContractAddress,
                depositWeiAmount,
                addressWithETH,
            );
            await web3Wrapper.awaitTransactionMinedAsync(txHash);

            const postETHBalanceInWei = await web3Wrapper.getBalanceInWeiAsync(addressWithETH);
            const postWETHBalanceInBaseUnits = await contractWrappers.token.getBalanceAsync(
                wethContractAddress,
                addressWithETH,
            );

            expect(postWETHBalanceInBaseUnits).to.be.bignumber.equal(depositWeiAmount);
            const remainingETHInWei = preETHBalance.minus(depositWeiAmount);
            const gasCost = remainingETHInWei.minus(postETHBalanceInWei);
            expect(gasCost).to.be.bignumber.lte(MAX_REASONABLE_GAS_COST_IN_WEI);
        });
        it('should throw if user has insufficient ETH balance for deposit', async () => {
            const preETHBalance = await web3Wrapper.getBalanceInWeiAsync(addressWithETH);

            const extraETHBalance = Web3Wrapper.toWei(new BigNumber(5));
            const overETHBalanceinWei = preETHBalance.add(extraETHBalance);

            return expect(
                contractWrappers.etherToken.depositAsync(wethContractAddress, overETHBalanceinWei, addressWithETH),
            ).to.be.rejectedWith(ContractWrappersError.InsufficientEthBalanceForDeposit);
        });
    });
    describe('#withdrawAsync', () => {
        it('should successfully withdraw ETH in return for Wrapped ETH tokens', async () => {
            const ETHBalanceInWei = await web3Wrapper.getBalanceInWeiAsync(addressWithETH);

            await contractWrappers.etherToken.depositAsync(wethContractAddress, depositWeiAmount, addressWithETH);

            const expectedPreETHBalance = ETHBalanceInWei.minus(depositWeiAmount);
            const preETHBalance = await web3Wrapper.getBalanceInWeiAsync(addressWithETH);
            const preWETHBalance = await contractWrappers.token.getBalanceAsync(wethContractAddress, addressWithETH);
            let gasCost = expectedPreETHBalance.minus(preETHBalance);
            expect(gasCost).to.be.bignumber.lte(MAX_REASONABLE_GAS_COST_IN_WEI);
            expect(preWETHBalance).to.be.bignumber.equal(depositWeiAmount);

            const txHash = await contractWrappers.etherToken.withdrawAsync(
                wethContractAddress,
                depositWeiAmount,
                addressWithETH,
            );
            await web3Wrapper.awaitTransactionMinedAsync(txHash);

            const postETHBalance = await web3Wrapper.getBalanceInWeiAsync(addressWithETH);
            const postWETHBalanceInBaseUnits = await contractWrappers.token.getBalanceAsync(
                wethContractAddress,
                addressWithETH,
            );

            expect(postWETHBalanceInBaseUnits).to.be.bignumber.equal(0);
            const expectedETHBalance = preETHBalance.add(depositWeiAmount).round(decimalPlaces);
            gasCost = expectedETHBalance.minus(postETHBalance);
            expect(gasCost).to.be.bignumber.lte(MAX_REASONABLE_GAS_COST_IN_WEI);
        });
        it('should throw if user has insufficient WETH balance for withdrawal', async () => {
            const preWETHBalance = await contractWrappers.token.getBalanceAsync(wethContractAddress, addressWithETH);
            expect(preWETHBalance).to.be.bignumber.equal(0);

            // tslint:disable-next-line:custom-no-magic-numbers
            const overWETHBalance = preWETHBalance.add(999999999);

            return expect(
                contractWrappers.etherToken.withdrawAsync(wethContractAddress, overWETHBalance, addressWithETH),
            ).to.be.rejectedWith(ContractWrappersError.InsufficientWEthBalanceForWithdrawal);
        });
    });
    describe('#subscribe', () => {
        const indexFilterValues = {};
        let etherTokenAddress: string;
        before(() => {
            const tokenUtils = new TokenUtils(tokens);
            const etherToken = tokenUtils.getWethTokenOrThrow();
            etherTokenAddress = etherToken.address;
        });
        afterEach(() => {
            contractWrappers.etherToken.unsubscribeAll();
        });
        // Hack: Mocha does not allow a test to be both async and have a `done` callback
        // Since we need to await the receipt of the event in the `subscribe` callback,
        // we do need both. A hack is to make the top-level async fn w/ a done callback and then
        // wrap the rest of the test in an async block
        // Source: https://github.com/mochajs/mocha/issues/2407
        it('Should receive the Transfer event when tokens are transfered', (done: DoneCallback) => {
            (async () => {
                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<TransferContractEventArgs>) => {
                        expect(logEvent).to.not.be.undefined();
                        expect(logEvent.isRemoved).to.be.false();
                        expect(logEvent.log.logIndex).to.be.equal(0);
                        expect(logEvent.log.transactionIndex).to.be.equal(0);
                        expect(logEvent.log.blockNumber).to.be.a('number');
                        const args = logEvent.log.args;
                        expect(args._from).to.be.equal(addressWithETH);
                        expect(args._to).to.be.equal(addressWithoutFunds);
                        expect(args._value).to.be.bignumber.equal(transferAmount);
                    },
                );
                await contractWrappers.etherToken.depositAsync(etherTokenAddress, transferAmount, addressWithETH);
                contractWrappers.etherToken.subscribe(
                    etherTokenAddress,
                    EtherTokenEvents.Transfer,
                    indexFilterValues,
                    callback,
                );
                await contractWrappers.token.transferAsync(
                    etherTokenAddress,
                    addressWithETH,
                    addressWithoutFunds,
                    transferAmount,
                );
            })().catch(done);
        });
        it('Should receive the Approval event when allowance is being set', (done: DoneCallback) => {
            (async () => {
                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<ApprovalContractEventArgs>) => {
                        expect(logEvent).to.not.be.undefined();
                        expect(logEvent.isRemoved).to.be.false();
                        const args = logEvent.log.args;
                        expect(args._owner).to.be.equal(addressWithETH);
                        expect(args._spender).to.be.equal(addressWithoutFunds);
                        expect(args._value).to.be.bignumber.equal(allowanceAmount);
                    },
                );
                contractWrappers.etherToken.subscribe(
                    etherTokenAddress,
                    EtherTokenEvents.Approval,
                    indexFilterValues,
                    callback,
                );
                await contractWrappers.token.setAllowanceAsync(
                    etherTokenAddress,
                    addressWithETH,
                    addressWithoutFunds,
                    allowanceAmount,
                );
            })().catch(done);
        });
        it('Should receive the Deposit event when ether is being deposited', (done: DoneCallback) => {
            (async () => {
                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<DepositContractEventArgs>) => {
                        expect(logEvent).to.not.be.undefined();
                        expect(logEvent.isRemoved).to.be.false();
                        const args = logEvent.log.args;
                        expect(args._owner).to.be.equal(addressWithETH);
                        expect(args._value).to.be.bignumber.equal(depositAmount);
                    },
                );
                contractWrappers.etherToken.subscribe(
                    etherTokenAddress,
                    EtherTokenEvents.Deposit,
                    indexFilterValues,
                    callback,
                );
                await contractWrappers.etherToken.depositAsync(etherTokenAddress, depositAmount, addressWithETH);
            })().catch(done);
        });
        it('Should receive the Withdrawal event when ether is being withdrawn', (done: DoneCallback) => {
            (async () => {
                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<WithdrawalContractEventArgs>) => {
                        expect(logEvent).to.not.be.undefined();
                        expect(logEvent.isRemoved).to.be.false();
                        const args = logEvent.log.args;
                        expect(args._owner).to.be.equal(addressWithETH);
                        expect(args._value).to.be.bignumber.equal(depositAmount);
                    },
                );
                await contractWrappers.etherToken.depositAsync(etherTokenAddress, depositAmount, addressWithETH);
                contractWrappers.etherToken.subscribe(
                    etherTokenAddress,
                    EtherTokenEvents.Withdrawal,
                    indexFilterValues,
                    callback,
                );
                await contractWrappers.etherToken.withdrawAsync(etherTokenAddress, withdrawalAmount, addressWithETH);
            })().catch(done);
        });
        it('should cancel outstanding subscriptions when ZeroEx.setProvider is called', (done: DoneCallback) => {
            (async () => {
                const callbackNeverToBeCalled = callbackErrorReporter.reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<ApprovalContractEventArgs>) => {
                        done(new Error('Expected this subscription to have been cancelled'));
                    },
                );
                contractWrappers.etherToken.subscribe(
                    etherTokenAddress,
                    EtherTokenEvents.Transfer,
                    indexFilterValues,
                    callbackNeverToBeCalled,
                );
                const callbackToBeCalled = callbackErrorReporter.reportNodeCallbackErrors(done)();
                contractWrappers.setProvider(provider, constants.TESTRPC_NETWORK_ID);
                await contractWrappers.etherToken.depositAsync(etherTokenAddress, transferAmount, addressWithETH);
                contractWrappers.etherToken.subscribe(
                    etherTokenAddress,
                    EtherTokenEvents.Transfer,
                    indexFilterValues,
                    callbackToBeCalled,
                );
                await contractWrappers.token.transferAsync(
                    etherTokenAddress,
                    addressWithETH,
                    addressWithoutFunds,
                    transferAmount,
                );
            })().catch(done);
        });
        it('Should cancel subscription when unsubscribe called', (done: DoneCallback) => {
            (async () => {
                const callbackNeverToBeCalled = callbackErrorReporter.reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<ApprovalContractEventArgs>) => {
                        done(new Error('Expected this subscription to have been cancelled'));
                    },
                );
                await contractWrappers.etherToken.depositAsync(etherTokenAddress, transferAmount, addressWithETH);
                const subscriptionToken = contractWrappers.etherToken.subscribe(
                    etherTokenAddress,
                    EtherTokenEvents.Transfer,
                    indexFilterValues,
                    callbackNeverToBeCalled,
                );
                contractWrappers.etherToken.unsubscribe(subscriptionToken);
                await contractWrappers.token.transferAsync(
                    etherTokenAddress,
                    addressWithETH,
                    addressWithoutFunds,
                    transferAmount,
                );
                done();
            })().catch(done);
        });
    });
    describe('#getLogsAsync', () => {
        let etherTokenAddress: string;
        let tokenTransferProxyAddress: string;
        const blockRange: BlockRange = {
            fromBlock: 0,
            toBlock: BlockParamLiteral.Latest,
        };
        let txHash: string;
        before(() => {
            addressWithETH = userAddresses[0];
            const tokenUtils = new TokenUtils(tokens);
            const etherToken = tokenUtils.getWethTokenOrThrow();
            etherTokenAddress = etherToken.address;
            tokenTransferProxyAddress = contractWrappers.proxy.getContractAddress();
        });
        it('should get logs with decoded args emitted by Approval', async () => {
            txHash = await contractWrappers.token.setUnlimitedProxyAllowanceAsync(etherTokenAddress, addressWithETH);
            await web3Wrapper.awaitTransactionMinedAsync(txHash);
            const eventName = EtherTokenEvents.Approval;
            const indexFilterValues = {};
            const logs = await contractWrappers.etherToken.getLogsAsync<ApprovalContractEventArgs>(
                etherTokenAddress,
                eventName,
                blockRange,
                indexFilterValues,
            );
            expect(logs).to.have.length(1);
            const args = logs[0].args;
            expect(logs[0].event).to.be.equal(eventName);
            expect(args._owner).to.be.equal(addressWithETH);
            expect(args._spender).to.be.equal(tokenTransferProxyAddress);
            expect(args._value).to.be.bignumber.equal(contractWrappers.token.UNLIMITED_ALLOWANCE_IN_BASE_UNITS);
        });
        it('should get logs with decoded args emitted by Deposit', async () => {
            await contractWrappers.etherToken.depositAsync(etherTokenAddress, depositAmount, addressWithETH);
            const eventName = EtherTokenEvents.Deposit;
            const indexFilterValues = {};
            const logs = await contractWrappers.etherToken.getLogsAsync<DepositContractEventArgs>(
                etherTokenAddress,
                eventName,
                blockRange,
                indexFilterValues,
            );
            expect(logs).to.have.length(1);
            const args = logs[0].args;
            expect(logs[0].event).to.be.equal(eventName);
            expect(args._owner).to.be.equal(addressWithETH);
            expect(args._value).to.be.bignumber.equal(depositAmount);
        });
        it('should only get the logs with the correct event name', async () => {
            txHash = await contractWrappers.token.setUnlimitedProxyAllowanceAsync(etherTokenAddress, addressWithETH);
            await web3Wrapper.awaitTransactionMinedAsync(txHash);
            const differentEventName = EtherTokenEvents.Transfer;
            const indexFilterValues = {};
            const logs = await contractWrappers.etherToken.getLogsAsync(
                etherTokenAddress,
                differentEventName,
                blockRange,
                indexFilterValues,
            );
            expect(logs).to.have.length(0);
        });
        it('should only get the logs with the correct indexed fields', async () => {
            txHash = await contractWrappers.token.setUnlimitedProxyAllowanceAsync(etherTokenAddress, addressWithETH);
            await web3Wrapper.awaitTransactionMinedAsync(txHash);
            txHash = await contractWrappers.token.setUnlimitedProxyAllowanceAsync(
                etherTokenAddress,
                addressWithoutFunds,
            );
            await web3Wrapper.awaitTransactionMinedAsync(txHash);
            const eventName = EtherTokenEvents.Approval;
            const indexFilterValues = {
                _owner: addressWithETH,
            };
            const logs = await contractWrappers.etherToken.getLogsAsync<ApprovalContractEventArgs>(
                etherTokenAddress,
                eventName,
                blockRange,
                indexFilterValues,
            );
            expect(logs).to.have.length(1);
            const args = logs[0].args;
            expect(args._owner).to.be.equal(addressWithETH);
        });
    });
});
