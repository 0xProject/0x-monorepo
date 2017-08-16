import 'mocha';
import * as chai from 'chai';
import {chaiSetup} from './utils/chai_setup';
import * as Web3 from 'web3';
import * as BigNumber from 'bignumber.js';
import promisify = require('es6-promisify');
import {web3Factory} from './utils/web3_factory';
import {
    ZeroEx,
    ZeroExError,
    Token,
    SubscriptionOpts,
    TokenEvents,
    ContractEvent,
    TransferContractEventArgs,
    ApprovalContractEventArgs,
} from '../src';
import {BlockchainLifecycle} from './utils/blockchain_lifecycle';
import {DoneCallback} from '../src/types';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle();

describe('TokenWrapper', () => {
    let web3: Web3;
    let zeroEx: ZeroEx;
    let userAddresses: string[];
    let tokens: Token[];
    let coinbase: string;
    let addressWithoutFunds: string;
    before(async () => {
        web3 = web3Factory.create();
        zeroEx = new ZeroEx(web3.currentProvider);
        userAddresses = await promisify(web3.eth.getAccounts)();
        tokens = await zeroEx.tokenRegistry.getTokensAsync();
        coinbase = userAddresses[0];
        addressWithoutFunds = userAddresses[1];
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('#transferAsync', () => {
        let token: Token;
        let transferAmount: BigNumber.BigNumber;
        before(() => {
            token = tokens[0];
            transferAmount = new BigNumber(42);
        });
        it('should successfully transfer tokens', async () => {
            const fromAddress = coinbase;
            const toAddress = addressWithoutFunds;
            const preBalance = await zeroEx.token.getBalanceAsync(token.address, toAddress);
            expect(preBalance).to.be.bignumber.equal(0);
            await zeroEx.token.transferAsync(token.address, fromAddress, toAddress, transferAmount);
            const postBalance = await zeroEx.token.getBalanceAsync(token.address, toAddress);
            return expect(postBalance).to.be.bignumber.equal(transferAmount);
        });
        it('should fail to transfer tokens if fromAddress has an insufficient balance', async () => {
            const fromAddress = addressWithoutFunds;
            const toAddress = coinbase;
            return expect(zeroEx.token.transferAsync(
                token.address, fromAddress, toAddress, transferAmount,
            )).to.be.rejectedWith(ZeroExError.InsufficientBalanceForTransfer);
        });
        it('should throw a CONTRACT_DOES_NOT_EXIST error for a non-existent token contract', async () => {
            const nonExistentTokenAddress = '0x9dd402f14d67e001d8efbe6583e51bf9706aa065';
            const fromAddress = coinbase;
            const toAddress = coinbase;
            return expect(zeroEx.token.transferAsync(
                nonExistentTokenAddress, fromAddress, toAddress, transferAmount,
            )).to.be.rejectedWith(ZeroExError.ContractDoesNotExist);
        });
    });
    describe('#transferFromAsync', () => {
        let token: Token;
        let toAddress: string;
        let senderAddress: string;
        before(async () => {
            token = tokens[0];
            toAddress = addressWithoutFunds;
            senderAddress = userAddresses[2];
        });
        it('should fail to transfer tokens if fromAddress has insufficient allowance set', async () => {
            const fromAddress = coinbase;
            const transferAmount = new BigNumber(42);

            const fromAddressBalance = await zeroEx.token.getBalanceAsync(token.address, fromAddress);
            expect(fromAddressBalance).to.be.bignumber.greaterThan(transferAmount);

            const fromAddressAllowance = await zeroEx.token.getAllowanceAsync(token.address, fromAddress,
                                                                              toAddress);
            expect(fromAddressAllowance).to.be.bignumber.equal(0);

            return expect(zeroEx.token.transferFromAsync(
                token.address, fromAddress, toAddress, senderAddress, transferAmount,
            )).to.be.rejectedWith(ZeroExError.InsufficientAllowanceForTransfer);
        });
        it('[regression] should fail to transfer tokens if set allowance for toAddress instead of senderAddress',
            async () => {
            const fromAddress = coinbase;
            const transferAmount = new BigNumber(42);

            await zeroEx.token.setAllowanceAsync(token.address, fromAddress, toAddress, transferAmount);

            return expect(zeroEx.token.transferFromAsync(
                token.address, fromAddress, toAddress, senderAddress, transferAmount,
            )).to.be.rejectedWith(ZeroExError.InsufficientAllowanceForTransfer);
        });
        it('should fail to transfer tokens if fromAddress has insufficient balance', async () => {
            const fromAddress = addressWithoutFunds;
            const transferAmount = new BigNumber(42);

            const fromAddressBalance = await zeroEx.token.getBalanceAsync(token.address, fromAddress);
            expect(fromAddressBalance).to.be.bignumber.equal(0);

            await zeroEx.token.setAllowanceAsync(token.address, fromAddress, senderAddress, transferAmount);
            const fromAddressAllowance = await zeroEx.token.getAllowanceAsync(token.address, fromAddress,
                                                                              senderAddress);
            expect(fromAddressAllowance).to.be.bignumber.equal(transferAmount);

            return expect(zeroEx.token.transferFromAsync(
                token.address, fromAddress, toAddress, senderAddress, transferAmount,
            )).to.be.rejectedWith(ZeroExError.InsufficientBalanceForTransfer);
        });
        it('should successfully transfer tokens', async () => {
            const fromAddress = coinbase;

            const preBalance = await zeroEx.token.getBalanceAsync(token.address, toAddress);
            expect(preBalance).to.be.bignumber.equal(0);

            const transferAmount = new BigNumber(42);
            await zeroEx.token.setAllowanceAsync(token.address, fromAddress, senderAddress, transferAmount);

            await zeroEx.token.transferFromAsync(token.address, fromAddress, toAddress, senderAddress,
                                                 transferAmount);
            const postBalance = await zeroEx.token.getBalanceAsync(token.address, toAddress);
            return expect(postBalance).to.be.bignumber.equal(transferAmount);
        });
        it('should throw a CONTRACT_DOES_NOT_EXIST error for a non-existent token contract', async () => {
            const fromAddress = coinbase;
            const nonExistentTokenAddress = '0x9dd402f14d67e001d8efbe6583e51bf9706aa065';
            return expect(zeroEx.token.transferFromAsync(
                nonExistentTokenAddress, fromAddress, toAddress, senderAddress, new BigNumber(42),
            )).to.be.rejectedWith(ZeroExError.ContractDoesNotExist);
        });
    });
    describe('#getBalanceAsync', () => {
        describe('With web3 provider with accounts', () => {
            it('should return the balance for an existing ERC20 token', async () => {
                const token = tokens[0];
                const ownerAddress = coinbase;
                const balance = await zeroEx.token.getBalanceAsync(token.address, ownerAddress);
                const expectedBalance = new BigNumber('100000000000000000000000000');
                return expect(balance).to.be.bignumber.equal(expectedBalance);
            });
            it('should throw a CONTRACT_DOES_NOT_EXIST error for a non-existent token contract', async () => {
                const nonExistentTokenAddress = '0x9dd402f14d67e001d8efbe6583e51bf9706aa065';
                const ownerAddress = coinbase;
                return expect(zeroEx.token.getBalanceAsync(nonExistentTokenAddress, ownerAddress))
                    .to.be.rejectedWith(ZeroExError.ContractDoesNotExist);
            });
            it('should return a balance of 0 for a non-existent owner address', async () => {
                const token = tokens[0];
                const nonExistentOwner = '0x198C6Ad858F213Fb31b6FE809E25040E6B964593';
                const balance = await zeroEx.token.getBalanceAsync(token.address, nonExistentOwner);
                const expectedBalance = new BigNumber(0);
                return expect(balance).to.be.bignumber.equal(expectedBalance);
            });
        });
        describe('With web3 provider without accounts', () => {
            let zeroExWithoutAccounts: ZeroEx;
            before(async () => {
                const hasAddresses = false;
                const web3WithoutAccounts = web3Factory.create(hasAddresses);
                web3WithoutAccounts.eth.getAccounts(console.log);
                zeroExWithoutAccounts = new ZeroEx(web3WithoutAccounts.currentProvider);
            });
            it('should return balance even when called with Web3 provider instance without addresses', async () => {
                    const token = tokens[0];
                    const ownerAddress = coinbase;
                    const balance = await zeroExWithoutAccounts.token.getBalanceAsync(token.address, ownerAddress);
                    const expectedBalance = new BigNumber('100000000000000000000000000');
                    return expect(balance).to.be.bignumber.equal(expectedBalance);
            });
        });
    });
    describe('#setAllowanceAsync', () => {
        it('should set the spender\'s allowance', async () => {
            const token = tokens[0];
            const ownerAddress = coinbase;
            const spenderAddress = addressWithoutFunds;

            const allowanceBeforeSet = await zeroEx.token.getAllowanceAsync(token.address, ownerAddress,
                                                                            spenderAddress);
            const expectedAllowanceBeforeAllowanceSet = new BigNumber(0);
            expect(allowanceBeforeSet).to.be.bignumber.equal(expectedAllowanceBeforeAllowanceSet);

            const amountInBaseUnits = new BigNumber(50);
            await zeroEx.token.setAllowanceAsync(token.address, ownerAddress, spenderAddress, amountInBaseUnits);

            const allowanceAfterSet = await zeroEx.token.getAllowanceAsync(token.address, ownerAddress, spenderAddress);
            const expectedAllowanceAfterAllowanceSet = amountInBaseUnits;
            return expect(allowanceAfterSet).to.be.bignumber.equal(expectedAllowanceAfterAllowanceSet);
        });
    });
    describe('#getAllowanceAsync', () => {
        it('should get the proxy allowance', async () => {
            const token = tokens[0];
            const ownerAddress = coinbase;
            const spenderAddress = addressWithoutFunds;

            const amountInBaseUnits = new BigNumber(50);
            await zeroEx.token.setAllowanceAsync(token.address, ownerAddress, spenderAddress, amountInBaseUnits);

            const allowance = await zeroEx.token.getAllowanceAsync(token.address, ownerAddress, spenderAddress);
            const expectedAllowance = amountInBaseUnits;
            return expect(allowance).to.be.bignumber.equal(expectedAllowance);
        });
        it('should return 0 if no allowance set yet', async () => {
            const token = tokens[0];
            const ownerAddress = coinbase;
            const spenderAddress = addressWithoutFunds;
            const allowance = await zeroEx.token.getAllowanceAsync(token.address, ownerAddress, spenderAddress);
            const expectedAllowance = new BigNumber(0);
            return expect(allowance).to.be.bignumber.equal(expectedAllowance);
        });
    });
    describe('#getProxyAllowanceAsync', () => {
        it('should get the proxy allowance', async () => {
            const token = tokens[0];
            const ownerAddress = coinbase;

            const amountInBaseUnits = new BigNumber(50);
            await zeroEx.token.setProxyAllowanceAsync(token.address, ownerAddress, amountInBaseUnits);

            const allowance = await zeroEx.token.getProxyAllowanceAsync(token.address, ownerAddress);
            const expectedAllowance = amountInBaseUnits;
            return expect(allowance).to.be.bignumber.equal(expectedAllowance);
        });
    });
    describe('#setProxyAllowanceAsync', () => {
        it('should set the proxy allowance', async () => {
            const token = tokens[0];
            const ownerAddress = coinbase;

            const allowanceBeforeSet = await zeroEx.token.getProxyAllowanceAsync(token.address, ownerAddress);
            const expectedAllowanceBeforeAllowanceSet = new BigNumber(0);
            expect(allowanceBeforeSet).to.be.bignumber.equal(expectedAllowanceBeforeAllowanceSet);

            const amountInBaseUnits = new BigNumber(50);
            await zeroEx.token.setProxyAllowanceAsync(token.address, ownerAddress, amountInBaseUnits);

            const allowanceAfterSet = await zeroEx.token.getProxyAllowanceAsync(token.address, ownerAddress);
            const expectedAllowanceAfterAllowanceSet = amountInBaseUnits;
            return expect(allowanceAfterSet).to.be.bignumber.equal(expectedAllowanceAfterAllowanceSet);
        });
    });
    describe('#subscribeAsync', () => {
        const indexFilterValues = {};
        const shouldCheckTransfer = false;
        let tokenAddress: string;
        const subscriptionOpts: SubscriptionOpts = {
            fromBlock: 0,
            toBlock: 'latest',
        };
        const transferAmount = new BigNumber(42);
        const allowanceAmount = new BigNumber(42);
        before(() => {
            const token = tokens[0];
            tokenAddress = token.address;
        });
        afterEach(async () => {
            await zeroEx.token.stopWatchingAllEventsAsync();
        });
        // Hack: Mocha does not allow a test to be both async and have a `done` callback
        // Since we need to await the receipt of the event in the `subscribeAsync` callback,
        // we do need both. A hack is to make the top-level a sync fn w/ a done callback and then
        // wrap the rest of the test in an async block
        // Source: https://github.com/mochajs/mocha/issues/2407
        it('Should receive the Transfer event when an order is filled', (done: DoneCallback) => {
            (async () => {
                const zeroExEvent = await zeroEx.token.subscribeAsync(
                    tokenAddress, TokenEvents.Transfer, subscriptionOpts, indexFilterValues);
                zeroExEvent.watch((err: Error, event: ContractEvent) => {
                    expect(err).to.be.null();
                    expect(event).to.not.be.undefined();
                    const args = event.args as TransferContractEventArgs;
                    expect(args._from).to.be.equal(coinbase);
                    expect(args._to).to.be.equal(addressWithoutFunds);
                    expect(args._value).to.be.bignumber.equal(transferAmount);
                    done();
                });
                await zeroEx.token.transferAsync(tokenAddress, coinbase, addressWithoutFunds, transferAmount);
            })().catch(done);
        });
        it('Should receive the Approval event when an order is cancelled', (done: DoneCallback) => {
            (async () => {
                const zeroExEvent = await zeroEx.token.subscribeAsync(
                    tokenAddress, TokenEvents.Approval, subscriptionOpts, indexFilterValues);
                zeroExEvent.watch((err: Error, event: ContractEvent) => {
                    expect(err).to.be.null();
                    expect(event).to.not.be.undefined();
                    const args = event.args as ApprovalContractEventArgs;
                    expect(args._owner).to.be.equal(coinbase);
                    expect(args._spender).to.be.equal(addressWithoutFunds);
                    expect(args._value).to.be.bignumber.equal(allowanceAmount);
                    done();
                });
                await zeroEx.token.setAllowanceAsync(tokenAddress, coinbase, addressWithoutFunds, allowanceAmount);
            })().catch(done);
        });
        it('Outstanding subscriptions are cancelled when zeroEx.setProviderAsync called', (done: DoneCallback) => {
            (async () => {
                const eventSubscriptionToBeCancelled = await zeroEx.token.subscribeAsync(
                    tokenAddress, TokenEvents.Transfer, subscriptionOpts, indexFilterValues);
                eventSubscriptionToBeCancelled.watch((err: Error, event: ContractEvent) => {
                    done(new Error('Expected this subscription to have been cancelled'));
                });

                const newProvider = web3Factory.getRpcProvider();
                await zeroEx.setProviderAsync(newProvider);

                const eventSubscriptionToStay = await zeroEx.token.subscribeAsync(
                    tokenAddress, TokenEvents.Transfer, subscriptionOpts, indexFilterValues);
                eventSubscriptionToStay.watch((err: Error, event: ContractEvent) => {
                    expect(err).to.be.null();
                    expect(event).to.not.be.undefined();
                    done();
                });
                await zeroEx.token.transferAsync(tokenAddress, coinbase, addressWithoutFunds, transferAmount);
            })().catch(done);
        });
        it('Should stop watch for events when stopWatchingAsync called on the eventEmitter', (done: DoneCallback) => {
            (async () => {
                const eventSubscriptionToBeStopped = await zeroEx.token.subscribeAsync(
                    tokenAddress, TokenEvents.Transfer, subscriptionOpts, indexFilterValues);
                eventSubscriptionToBeStopped.watch((err: Error, event: ContractEvent) => {
                    done(new Error('Expected this subscription to have been stopped'));
                });
                await eventSubscriptionToBeStopped.stopWatchingAsync();
                await zeroEx.token.transferAsync(tokenAddress, coinbase, addressWithoutFunds, transferAmount);
                done();
            })().catch(done);
        });
        it('Should wrap all event args BigNumber instances in a newer version of BigNumber', (done: DoneCallback) => {
            (async () => {
                const zeroExEvent = await zeroEx.token.subscribeAsync(
                    tokenAddress, TokenEvents.Transfer, subscriptionOpts, indexFilterValues);
                zeroExEvent.watch((err: Error, event: ContractEvent) => {
                    const args = event.args as TransferContractEventArgs;
                    expect(args._value.isBigNumber).to.be.true();
                    done();
                });
                await zeroEx.token.transferAsync(tokenAddress, coinbase, addressWithoutFunds, transferAmount);
            })().catch(done);
        });
    });
});
