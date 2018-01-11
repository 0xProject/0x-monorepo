import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import 'mocha';
import * as Web3 from 'web3';

import {
    ApprovalContractEventArgs,
    BlockParamLiteral,
    BlockRange,
    DecodedLogEvent,
    DepositContractEventArgs,
    EtherTokenEvents,
    Token,
    TransferContractEventArgs,
    WithdrawalContractEventArgs,
    ZeroEx,
    ZeroExError,
} from '../src';
import { artifacts } from '../src/artifacts';
import { DoneCallback } from '../src/types';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';
import { reportNodeCallbackErrors } from './utils/report_callback_errors';
import { TokenUtils } from './utils/token_utils';
import { web3Factory } from './utils/web3_factory';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(constants.RPC_URL);

// Since the address depositing/withdrawing ETH/WETH also needs to pay gas costs for the transaction,
// a small amount of ETH will be used to pay this gas cost. We therefore check that the difference between
// the expected balance and actual balance (given the amount of ETH deposited), only deviates by the amount
// required to pay gas costs.
const MAX_REASONABLE_GAS_COST_IN_WEI = 62517;

describe('EtherTokenWrapper', () => {
    let web3: Web3;
    let zeroEx: ZeroEx;
    let tokens: Token[];
    let userAddresses: string[];
    let addressWithETH: string;
    let wethContractAddress: string;
    let depositWeiAmount: BigNumber;
    let decimalPlaces: number;
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
        web3 = web3Factory.create();
        zeroEx = new ZeroEx(web3.currentProvider, zeroExConfig);
        tokens = await zeroEx.tokenRegistry.getTokensAsync();
        userAddresses = await zeroEx.getAvailableAddressesAsync();
        addressWithETH = userAddresses[0];
        wethContractAddress = (zeroEx.etherToken as any)._getContractAddress(artifacts.EtherTokenArtifact);
        depositWeiAmount = (zeroEx as any)._web3Wrapper.toWei(new BigNumber(5));
        decimalPlaces = 7;
        addressWithoutFunds = userAddresses[1];
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('#depositAsync', () => {
        it('should successfully deposit ETH and issue Wrapped ETH tokens', async () => {
            const preETHBalance = await (zeroEx as any)._web3Wrapper.getBalanceInWeiAsync(addressWithETH);
            const preWETHBalance = await zeroEx.token.getBalanceAsync(wethContractAddress, addressWithETH);
            expect(preETHBalance).to.be.bignumber.gt(0);
            expect(preWETHBalance).to.be.bignumber.equal(0);

            const txHash = await zeroEx.etherToken.depositAsync(wethContractAddress, depositWeiAmount, addressWithETH);
            await zeroEx.awaitTransactionMinedAsync(txHash);

            const postETHBalanceInWei = await (zeroEx as any)._web3Wrapper.getBalanceInWeiAsync(addressWithETH);
            const postWETHBalanceInBaseUnits = await zeroEx.token.getBalanceAsync(wethContractAddress, addressWithETH);

            expect(postWETHBalanceInBaseUnits).to.be.bignumber.equal(depositWeiAmount);
            const remainingETHInWei = preETHBalance.minus(depositWeiAmount);
            const gasCost = remainingETHInWei.minus(postETHBalanceInWei);
            expect(gasCost).to.be.bignumber.lte(MAX_REASONABLE_GAS_COST_IN_WEI);
        });
        it('should throw if user has insufficient ETH balance for deposit', async () => {
            const preETHBalance = await (zeroEx as any)._web3Wrapper.getBalanceInWeiAsync(addressWithETH);

            const extraETHBalance = (zeroEx as any)._web3Wrapper.toWei(5, 'ether');
            const overETHBalanceinWei = preETHBalance.add(extraETHBalance);

            return expect(
                zeroEx.etherToken.depositAsync(wethContractAddress, overETHBalanceinWei, addressWithETH),
            ).to.be.rejectedWith(ZeroExError.InsufficientEthBalanceForDeposit);
        });
    });
    describe('#withdrawAsync', () => {
        it('should successfully withdraw ETH in return for Wrapped ETH tokens', async () => {
            const ETHBalanceInWei = await (zeroEx as any)._web3Wrapper.getBalanceInWeiAsync(addressWithETH);

            await zeroEx.etherToken.depositAsync(wethContractAddress, depositWeiAmount, addressWithETH);

            const expectedPreETHBalance = ETHBalanceInWei.minus(depositWeiAmount);
            const preETHBalance = await (zeroEx as any)._web3Wrapper.getBalanceInWeiAsync(addressWithETH);
            const preWETHBalance = await zeroEx.token.getBalanceAsync(wethContractAddress, addressWithETH);
            let gasCost = expectedPreETHBalance.minus(preETHBalance);
            expect(gasCost).to.be.bignumber.lte(MAX_REASONABLE_GAS_COST_IN_WEI);
            expect(preWETHBalance).to.be.bignumber.equal(depositWeiAmount);

            const txHash = await zeroEx.etherToken.withdrawAsync(wethContractAddress, depositWeiAmount, addressWithETH);
            await zeroEx.awaitTransactionMinedAsync(txHash);

            const postETHBalance = await (zeroEx as any)._web3Wrapper.getBalanceInWeiAsync(addressWithETH);
            const postWETHBalanceInBaseUnits = await zeroEx.token.getBalanceAsync(wethContractAddress, addressWithETH);

            expect(postWETHBalanceInBaseUnits).to.be.bignumber.equal(0);
            const expectedETHBalance = preETHBalance.add(depositWeiAmount).round(decimalPlaces);
            gasCost = expectedETHBalance.minus(postETHBalance);
            expect(gasCost).to.be.bignumber.lte(MAX_REASONABLE_GAS_COST_IN_WEI);
        });
        it('should throw if user has insufficient WETH balance for withdrawl', async () => {
            const preWETHBalance = await zeroEx.token.getBalanceAsync(wethContractAddress, addressWithETH);
            expect(preWETHBalance).to.be.bignumber.equal(0);

            const overWETHBalance = preWETHBalance.add(999999999);

            return expect(
                zeroEx.etherToken.withdrawAsync(wethContractAddress, overWETHBalance, addressWithETH),
            ).to.be.rejectedWith(ZeroExError.InsufficientWEthBalanceForWithdrawal);
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
            zeroEx.etherToken.unsubscribeAll();
        });
        // Hack: Mocha does not allow a test to be both async and have a `done` callback
        // Since we need to await the receipt of the event in the `subscribe` callback,
        // we do need both. A hack is to make the top-level async fn w/ a done callback and then
        // wrap the rest of the test in an async block
        // Source: https://github.com/mochajs/mocha/issues/2407
        it('Should receive the Transfer event when tokens are transfered', (done: DoneCallback) => {
            (async () => {
                const callback = reportNodeCallbackErrors(done)(
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
                await zeroEx.etherToken.depositAsync(etherTokenAddress, transferAmount, addressWithETH);
                zeroEx.etherToken.subscribe(etherTokenAddress, EtherTokenEvents.Transfer, indexFilterValues, callback);
                await zeroEx.token.transferAsync(
                    etherTokenAddress,
                    addressWithETH,
                    addressWithoutFunds,
                    transferAmount,
                );
            })().catch(done);
        });
        it('Should receive the Approval event when allowance is being set', (done: DoneCallback) => {
            (async () => {
                const callback = reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<ApprovalContractEventArgs>) => {
                        expect(logEvent).to.not.be.undefined();
                        expect(logEvent.isRemoved).to.be.false();
                        const args = logEvent.log.args;
                        expect(args._owner).to.be.equal(addressWithETH);
                        expect(args._spender).to.be.equal(addressWithoutFunds);
                        expect(args._value).to.be.bignumber.equal(allowanceAmount);
                    },
                );
                zeroEx.etherToken.subscribe(etherTokenAddress, EtherTokenEvents.Approval, indexFilterValues, callback);
                await zeroEx.token.setAllowanceAsync(
                    etherTokenAddress,
                    addressWithETH,
                    addressWithoutFunds,
                    allowanceAmount,
                );
            })().catch(done);
        });
        it('Should receive the Deposit event when ether is being deposited', (done: DoneCallback) => {
            (async () => {
                const callback = reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<DepositContractEventArgs>) => {
                        expect(logEvent).to.not.be.undefined();
                        expect(logEvent.isRemoved).to.be.false();
                        const args = logEvent.log.args;
                        expect(args._owner).to.be.equal(addressWithETH);
                        expect(args._value).to.be.bignumber.equal(depositAmount);
                    },
                );
                zeroEx.etherToken.subscribe(etherTokenAddress, EtherTokenEvents.Deposit, indexFilterValues, callback);
                await zeroEx.etherToken.depositAsync(etherTokenAddress, depositAmount, addressWithETH);
            })().catch(done);
        });
        it('Should receive the Withdrawal event when ether is being withdrawn', (done: DoneCallback) => {
            (async () => {
                const callback = reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<WithdrawalContractEventArgs>) => {
                        expect(logEvent).to.not.be.undefined();
                        expect(logEvent.isRemoved).to.be.false();
                        const args = logEvent.log.args;
                        expect(args._owner).to.be.equal(addressWithETH);
                        expect(args._value).to.be.bignumber.equal(depositAmount);
                    },
                );
                await zeroEx.etherToken.depositAsync(etherTokenAddress, depositAmount, addressWithETH);
                zeroEx.etherToken.subscribe(
                    etherTokenAddress,
                    EtherTokenEvents.Withdrawal,
                    indexFilterValues,
                    callback,
                );
                await zeroEx.etherToken.withdrawAsync(etherTokenAddress, withdrawalAmount, addressWithETH);
            })().catch(done);
        });
        it('should cancel outstanding subscriptions when ZeroEx.setProvider is called', (done: DoneCallback) => {
            (async () => {
                const callbackNeverToBeCalled = reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<ApprovalContractEventArgs>) => {
                        done(new Error('Expected this subscription to have been cancelled'));
                    },
                );
                zeroEx.etherToken.subscribe(
                    etherTokenAddress,
                    EtherTokenEvents.Transfer,
                    indexFilterValues,
                    callbackNeverToBeCalled,
                );
                const callbackToBeCalled = reportNodeCallbackErrors(done)();
                const newProvider = web3Factory.getRpcProvider();
                zeroEx.setProvider(newProvider, constants.TESTRPC_NETWORK_ID);
                await zeroEx.etherToken.depositAsync(etherTokenAddress, transferAmount, addressWithETH);
                zeroEx.etherToken.subscribe(
                    etherTokenAddress,
                    EtherTokenEvents.Transfer,
                    indexFilterValues,
                    callbackToBeCalled,
                );
                await zeroEx.token.transferAsync(
                    etherTokenAddress,
                    addressWithETH,
                    addressWithoutFunds,
                    transferAmount,
                );
            })().catch(done);
        });
        it('Should cancel subscription when unsubscribe called', (done: DoneCallback) => {
            (async () => {
                const callbackNeverToBeCalled = reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<ApprovalContractEventArgs>) => {
                        done(new Error('Expected this subscription to have been cancelled'));
                    },
                );
                await zeroEx.etherToken.depositAsync(etherTokenAddress, transferAmount, addressWithETH);
                const subscriptionToken = zeroEx.etherToken.subscribe(
                    etherTokenAddress,
                    EtherTokenEvents.Transfer,
                    indexFilterValues,
                    callbackNeverToBeCalled,
                );
                zeroEx.etherToken.unsubscribe(subscriptionToken);
                await zeroEx.token.transferAsync(
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
            tokenTransferProxyAddress = zeroEx.proxy.getContractAddress();
        });
        it('should get logs with decoded args emitted by Approval', async () => {
            txHash = await zeroEx.token.setUnlimitedProxyAllowanceAsync(etherTokenAddress, addressWithETH);
            await zeroEx.awaitTransactionMinedAsync(txHash);
            const eventName = EtherTokenEvents.Approval;
            const indexFilterValues = {};
            const logs = await zeroEx.etherToken.getLogsAsync<ApprovalContractEventArgs>(
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
            expect(args._value).to.be.bignumber.equal(zeroEx.token.UNLIMITED_ALLOWANCE_IN_BASE_UNITS);
        });
        it('should get logs with decoded args emitted by Deposit', async () => {
            await zeroEx.etherToken.depositAsync(etherTokenAddress, depositAmount, addressWithETH);
            const eventName = EtherTokenEvents.Deposit;
            const indexFilterValues = {};
            const logs = await zeroEx.etherToken.getLogsAsync<DepositContractEventArgs>(
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
            txHash = await zeroEx.token.setUnlimitedProxyAllowanceAsync(etherTokenAddress, addressWithETH);
            await zeroEx.awaitTransactionMinedAsync(txHash);
            const differentEventName = EtherTokenEvents.Transfer;
            const indexFilterValues = {};
            const logs = await zeroEx.etherToken.getLogsAsync(
                etherTokenAddress,
                differentEventName,
                blockRange,
                indexFilterValues,
            );
            expect(logs).to.have.length(0);
        });
        it('should only get the logs with the correct indexed fields', async () => {
            txHash = await zeroEx.token.setUnlimitedProxyAllowanceAsync(etherTokenAddress, addressWithETH);
            await zeroEx.awaitTransactionMinedAsync(txHash);
            txHash = await zeroEx.token.setUnlimitedProxyAllowanceAsync(etherTokenAddress, addressWithoutFunds);
            await zeroEx.awaitTransactionMinedAsync(txHash);
            const eventName = EtherTokenEvents.Approval;
            const indexFilterValues = {
                _owner: addressWithETH,
            };
            const logs = await zeroEx.etherToken.getLogsAsync<ApprovalContractEventArgs>(
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
