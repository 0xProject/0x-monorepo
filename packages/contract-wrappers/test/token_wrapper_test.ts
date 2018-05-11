import { BlockchainLifecycle, callbackErrorReporter, devConstants } from '@0xproject/dev-utils';
import { EmptyWalletSubprovider } from '@0xproject/subproviders';
import { DoneCallback, Provider } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import 'mocha';
import Web3ProviderEngine = require('web3-provider-engine');

import {
    ApprovalContractEventArgs,
    BlockParamLiteral,
    BlockRange,
    ContractWrappers,
    ContractWrappersError,
    DecodedLogEvent,
    Token,
    TokenEvents,
    TransferContractEventArgs,
} from '../src';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';
import { TokenUtils } from './utils/token_utils';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('TokenWrapper', () => {
    let contractWrappers: ContractWrappers;
    let userAddresses: string[];
    let tokens: Token[];
    let tokenUtils: TokenUtils;
    let coinbase: string;
    let addressWithoutFunds: string;
    const config = {
        networkId: constants.TESTRPC_NETWORK_ID,
    };
    before(async () => {
        contractWrappers = new ContractWrappers(provider, config);
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
        tokens = await contractWrappers.tokenRegistry.getTokensAsync();
        tokenUtils = new TokenUtils(tokens);
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
        let transferAmount: BigNumber;
        before(() => {
            token = tokens[0];
            transferAmount = new BigNumber(42);
        });
        it('should successfully transfer tokens', async () => {
            const fromAddress = coinbase;
            const toAddress = addressWithoutFunds;
            const preBalance = await contractWrappers.token.getBalanceAsync(token.address, toAddress);
            expect(preBalance).to.be.bignumber.equal(0);
            await contractWrappers.token.transferAsync(token.address, fromAddress, toAddress, transferAmount);
            const postBalance = await contractWrappers.token.getBalanceAsync(token.address, toAddress);
            return expect(postBalance).to.be.bignumber.equal(transferAmount);
        });
        it('should fail to transfer tokens if fromAddress has an insufficient balance', async () => {
            const fromAddress = addressWithoutFunds;
            const toAddress = coinbase;
            return expect(
                contractWrappers.token.transferAsync(token.address, fromAddress, toAddress, transferAmount),
            ).to.be.rejectedWith(ContractWrappersError.InsufficientBalanceForTransfer);
        });
        it('should throw a CONTRACT_DOES_NOT_EXIST error for a non-existent token contract', async () => {
            const nonExistentTokenAddress = '0x9dd402f14d67e001d8efbe6583e51bf9706aa065';
            const fromAddress = coinbase;
            const toAddress = coinbase;
            return expect(
                contractWrappers.token.transferAsync(nonExistentTokenAddress, fromAddress, toAddress, transferAmount),
            ).to.be.rejectedWith(ContractWrappersError.TokenContractDoesNotExist);
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

            const fromAddressBalance = await contractWrappers.token.getBalanceAsync(token.address, fromAddress);
            expect(fromAddressBalance).to.be.bignumber.greaterThan(transferAmount);

            const fromAddressAllowance = await contractWrappers.token.getAllowanceAsync(
                token.address,
                fromAddress,
                toAddress,
            );
            expect(fromAddressAllowance).to.be.bignumber.equal(0);

            return expect(
                contractWrappers.token.transferFromAsync(
                    token.address,
                    fromAddress,
                    toAddress,
                    senderAddress,
                    transferAmount,
                ),
            ).to.be.rejectedWith(ContractWrappersError.InsufficientAllowanceForTransfer);
        });
        it('[regression] should fail to transfer tokens if set allowance for toAddress instead of senderAddress', async () => {
            const fromAddress = coinbase;
            const transferAmount = new BigNumber(42);

            await contractWrappers.token.setAllowanceAsync(token.address, fromAddress, toAddress, transferAmount);

            return expect(
                contractWrappers.token.transferFromAsync(
                    token.address,
                    fromAddress,
                    toAddress,
                    senderAddress,
                    transferAmount,
                ),
            ).to.be.rejectedWith(ContractWrappersError.InsufficientAllowanceForTransfer);
        });
        it('should fail to transfer tokens if fromAddress has insufficient balance', async () => {
            const fromAddress = addressWithoutFunds;
            const transferAmount = new BigNumber(42);

            const fromAddressBalance = await contractWrappers.token.getBalanceAsync(token.address, fromAddress);
            expect(fromAddressBalance).to.be.bignumber.equal(0);

            await contractWrappers.token.setAllowanceAsync(token.address, fromAddress, senderAddress, transferAmount);
            const fromAddressAllowance = await contractWrappers.token.getAllowanceAsync(
                token.address,
                fromAddress,
                senderAddress,
            );
            expect(fromAddressAllowance).to.be.bignumber.equal(transferAmount);

            return expect(
                contractWrappers.token.transferFromAsync(
                    token.address,
                    fromAddress,
                    toAddress,
                    senderAddress,
                    transferAmount,
                ),
            ).to.be.rejectedWith(ContractWrappersError.InsufficientBalanceForTransfer);
        });
        it('should successfully transfer tokens', async () => {
            const fromAddress = coinbase;

            const preBalance = await contractWrappers.token.getBalanceAsync(token.address, toAddress);
            expect(preBalance).to.be.bignumber.equal(0);

            const transferAmount = new BigNumber(42);
            await contractWrappers.token.setAllowanceAsync(token.address, fromAddress, senderAddress, transferAmount);

            await contractWrappers.token.transferFromAsync(
                token.address,
                fromAddress,
                toAddress,
                senderAddress,
                transferAmount,
            );
            const postBalance = await contractWrappers.token.getBalanceAsync(token.address, toAddress);
            return expect(postBalance).to.be.bignumber.equal(transferAmount);
        });
        it('should throw a CONTRACT_DOES_NOT_EXIST error for a non-existent token contract', async () => {
            const fromAddress = coinbase;
            const nonExistentTokenAddress = '0x9dd402f14d67e001d8efbe6583e51bf9706aa065';
            return expect(
                contractWrappers.token.transferFromAsync(
                    nonExistentTokenAddress,
                    fromAddress,
                    toAddress,
                    senderAddress,
                    new BigNumber(42),
                ),
            ).to.be.rejectedWith(ContractWrappersError.TokenContractDoesNotExist);
        });
    });
    describe('#getBalanceAsync', () => {
        describe('With provider with accounts', () => {
            it('should return the balance for an existing ERC20 token', async () => {
                const token = tokens[0];
                const ownerAddress = coinbase;
                const balance = await contractWrappers.token.getBalanceAsync(token.address, ownerAddress);
                const expectedBalance = new BigNumber('1000000000000000000000000000');
                return expect(balance).to.be.bignumber.equal(expectedBalance);
            });
            it('should throw a CONTRACT_DOES_NOT_EXIST error for a non-existent token contract', async () => {
                const nonExistentTokenAddress = '0x9dd402f14d67e001d8efbe6583e51bf9706aa065';
                const ownerAddress = coinbase;
                return expect(
                    contractWrappers.token.getBalanceAsync(nonExistentTokenAddress, ownerAddress),
                ).to.be.rejectedWith(ContractWrappersError.TokenContractDoesNotExist);
            });
            it('should return a balance of 0 for a non-existent owner address', async () => {
                const token = tokens[0];
                const nonExistentOwner = '0x198c6ad858f213fb31b6fe809e25040e6b964593';
                const balance = await contractWrappers.token.getBalanceAsync(token.address, nonExistentOwner);
                const expectedBalance = new BigNumber(0);
                return expect(balance).to.be.bignumber.equal(expectedBalance);
            });
        });
        describe('With provider without accounts', () => {
            let zeroExContractWithoutAccounts: ContractWrappers;
            before(async () => {
                const hasAddresses = false;
                const emptyWalletProvider = addEmptyWalletSubprovider(provider);
                zeroExContractWithoutAccounts = new ContractWrappers(emptyWalletProvider, config);
            });
            it('should return balance even when called with provider instance without addresses', async () => {
                const token = tokens[0];
                const ownerAddress = coinbase;
                const balance = await zeroExContractWithoutAccounts.token.getBalanceAsync(token.address, ownerAddress);
                const expectedBalance = new BigNumber('1000000000000000000000000000');
                return expect(balance).to.be.bignumber.equal(expectedBalance);
            });
        });
    });
    describe('#setAllowanceAsync', () => {
        it("should set the spender's allowance", async () => {
            const token = tokens[0];
            const ownerAddress = coinbase;
            const spenderAddress = addressWithoutFunds;

            const allowanceBeforeSet = await contractWrappers.token.getAllowanceAsync(
                token.address,
                ownerAddress,
                spenderAddress,
            );
            const expectedAllowanceBeforeAllowanceSet = new BigNumber(0);
            expect(allowanceBeforeSet).to.be.bignumber.equal(expectedAllowanceBeforeAllowanceSet);

            const amountInBaseUnits = new BigNumber(50);
            await contractWrappers.token.setAllowanceAsync(
                token.address,
                ownerAddress,
                spenderAddress,
                amountInBaseUnits,
            );

            const allowanceAfterSet = await contractWrappers.token.getAllowanceAsync(
                token.address,
                ownerAddress,
                spenderAddress,
            );
            const expectedAllowanceAfterAllowanceSet = amountInBaseUnits;
            return expect(allowanceAfterSet).to.be.bignumber.equal(expectedAllowanceAfterAllowanceSet);
        });
    });
    describe('#setUnlimitedAllowanceAsync', () => {
        it("should set the unlimited spender's allowance", async () => {
            const token = tokens[0];
            const ownerAddress = coinbase;
            const spenderAddress = addressWithoutFunds;

            await contractWrappers.token.setUnlimitedAllowanceAsync(token.address, ownerAddress, spenderAddress);
            const allowance = await contractWrappers.token.getAllowanceAsync(
                token.address,
                ownerAddress,
                spenderAddress,
            );
            return expect(allowance).to.be.bignumber.equal(contractWrappers.token.UNLIMITED_ALLOWANCE_IN_BASE_UNITS);
        });
        it('should reduce the gas cost for transfers including tokens with unlimited allowance support', async () => {
            const transferAmount = new BigNumber(5);
            const zrx = tokenUtils.getProtocolTokenOrThrow();
            const [, userWithNormalAllowance, userWithUnlimitedAllowance] = userAddresses;
            await contractWrappers.token.setAllowanceAsync(
                zrx.address,
                coinbase,
                userWithNormalAllowance,
                transferAmount,
            );
            await contractWrappers.token.setUnlimitedAllowanceAsync(zrx.address, coinbase, userWithUnlimitedAllowance);

            const initBalanceWithNormalAllowance = await web3Wrapper.getBalanceInWeiAsync(userWithNormalAllowance);
            const initBalanceWithUnlimitedAllowance = await web3Wrapper.getBalanceInWeiAsync(
                userWithUnlimitedAllowance,
            );

            await contractWrappers.token.transferFromAsync(
                zrx.address,
                coinbase,
                userWithNormalAllowance,
                userWithNormalAllowance,
                transferAmount,
            );
            await contractWrappers.token.transferFromAsync(
                zrx.address,
                coinbase,
                userWithUnlimitedAllowance,
                userWithUnlimitedAllowance,
                transferAmount,
            );

            const finalBalanceWithNormalAllowance = await web3Wrapper.getBalanceInWeiAsync(userWithNormalAllowance);
            const finalBalanceWithUnlimitedAllowance = await web3Wrapper.getBalanceInWeiAsync(
                userWithUnlimitedAllowance,
            );

            const normalGasCost = initBalanceWithNormalAllowance.minus(finalBalanceWithNormalAllowance);
            const unlimitedGasCost = initBalanceWithUnlimitedAllowance.minus(finalBalanceWithUnlimitedAllowance);

            // In theory the gas cost with unlimited allowance should be smaller, but with testrpc it's actually bigger.
            // This needs to be investigated in ethereumjs-vm. This test is essentially a repro.
            // TODO: Make this test pass with inverted assertion.
            expect(unlimitedGasCost.toNumber()).to.be.gt(normalGasCost.toNumber());
        });
    });
    describe('#getAllowanceAsync', () => {
        describe('With provider with accounts', () => {
            it('should get the proxy allowance', async () => {
                const token = tokens[0];
                const ownerAddress = coinbase;
                const spenderAddress = addressWithoutFunds;

                const amountInBaseUnits = new BigNumber(50);
                await contractWrappers.token.setAllowanceAsync(
                    token.address,
                    ownerAddress,
                    spenderAddress,
                    amountInBaseUnits,
                );

                const allowance = await contractWrappers.token.getAllowanceAsync(
                    token.address,
                    ownerAddress,
                    spenderAddress,
                );
                const expectedAllowance = amountInBaseUnits;
                return expect(allowance).to.be.bignumber.equal(expectedAllowance);
            });
            it('should return 0 if no allowance set yet', async () => {
                const token = tokens[0];
                const ownerAddress = coinbase;
                const spenderAddress = addressWithoutFunds;
                const allowance = await contractWrappers.token.getAllowanceAsync(
                    token.address,
                    ownerAddress,
                    spenderAddress,
                );
                const expectedAllowance = new BigNumber(0);
                return expect(allowance).to.be.bignumber.equal(expectedAllowance);
            });
        });
        describe('With provider without accounts', () => {
            let zeroExContractWithoutAccounts: ContractWrappers;
            before(async () => {
                const hasAddresses = false;
                const emptyWalletProvider = addEmptyWalletSubprovider(provider);
                zeroExContractWithoutAccounts = new ContractWrappers(emptyWalletProvider, config);
            });
            it('should get the proxy allowance', async () => {
                const token = tokens[0];
                const ownerAddress = coinbase;
                const spenderAddress = addressWithoutFunds;

                const amountInBaseUnits = new BigNumber(50);
                await contractWrappers.token.setAllowanceAsync(
                    token.address,
                    ownerAddress,
                    spenderAddress,
                    amountInBaseUnits,
                );

                const allowance = await zeroExContractWithoutAccounts.token.getAllowanceAsync(
                    token.address,
                    ownerAddress,
                    spenderAddress,
                );
                const expectedAllowance = amountInBaseUnits;
                return expect(allowance).to.be.bignumber.equal(expectedAllowance);
            });
        });
    });
    describe('#getProxyAllowanceAsync', () => {
        it('should get the proxy allowance', async () => {
            const token = tokens[0];
            const ownerAddress = coinbase;

            const amountInBaseUnits = new BigNumber(50);
            await contractWrappers.token.setProxyAllowanceAsync(token.address, ownerAddress, amountInBaseUnits);

            const allowance = await contractWrappers.token.getProxyAllowanceAsync(token.address, ownerAddress);
            const expectedAllowance = amountInBaseUnits;
            return expect(allowance).to.be.bignumber.equal(expectedAllowance);
        });
    });
    describe('#setProxyAllowanceAsync', () => {
        it('should set the proxy allowance', async () => {
            const token = tokens[0];
            const ownerAddress = coinbase;

            const allowanceBeforeSet = await contractWrappers.token.getProxyAllowanceAsync(token.address, ownerAddress);
            const expectedAllowanceBeforeAllowanceSet = new BigNumber(0);
            expect(allowanceBeforeSet).to.be.bignumber.equal(expectedAllowanceBeforeAllowanceSet);

            const amountInBaseUnits = new BigNumber(50);
            await contractWrappers.token.setProxyAllowanceAsync(token.address, ownerAddress, amountInBaseUnits);

            const allowanceAfterSet = await contractWrappers.token.getProxyAllowanceAsync(token.address, ownerAddress);
            const expectedAllowanceAfterAllowanceSet = amountInBaseUnits;
            return expect(allowanceAfterSet).to.be.bignumber.equal(expectedAllowanceAfterAllowanceSet);
        });
    });
    describe('#setUnlimitedProxyAllowanceAsync', () => {
        it('should set the unlimited proxy allowance', async () => {
            const token = tokens[0];
            const ownerAddress = coinbase;

            await contractWrappers.token.setUnlimitedProxyAllowanceAsync(token.address, ownerAddress);
            const allowance = await contractWrappers.token.getProxyAllowanceAsync(token.address, ownerAddress);
            return expect(allowance).to.be.bignumber.equal(contractWrappers.token.UNLIMITED_ALLOWANCE_IN_BASE_UNITS);
        });
    });
    describe('#subscribe', () => {
        const indexFilterValues = {};
        let tokenAddress: string;
        const transferAmount = new BigNumber(42);
        const allowanceAmount = new BigNumber(42);
        before(() => {
            const token = tokens[0];
            tokenAddress = token.address;
        });
        afterEach(() => {
            contractWrappers.token.unsubscribeAll();
        });
        // Hack: Mocha does not allow a test to be both async and have a `done` callback
        // Since we need to await the receipt of the event in the `subscribe` callback,
        // we do need both. A hack is to make the top-level a sync fn w/ a done callback and then
        // wrap the rest of the test in an async block
        // Source: https://github.com/mochajs/mocha/issues/2407
        it('Should receive the Transfer event when tokens are transfered', (done: DoneCallback) => {
            (async () => {
                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<TransferContractEventArgs>) => {
                        expect(logEvent.isRemoved).to.be.false();
                        expect(logEvent.log.logIndex).to.be.equal(0);
                        expect(logEvent.log.transactionIndex).to.be.equal(0);
                        expect(logEvent.log.blockNumber).to.be.a('number');
                        const args = logEvent.log.args;
                        expect(args._from).to.be.equal(coinbase);
                        expect(args._to).to.be.equal(addressWithoutFunds);
                        expect(args._value).to.be.bignumber.equal(transferAmount);
                    },
                );
                contractWrappers.token.subscribe(tokenAddress, TokenEvents.Transfer, indexFilterValues, callback);
                await contractWrappers.token.transferAsync(tokenAddress, coinbase, addressWithoutFunds, transferAmount);
            })().catch(done);
        });
        it('Should receive the Approval event when allowance is being set', (done: DoneCallback) => {
            (async () => {
                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<ApprovalContractEventArgs>) => {
                        expect(logEvent).to.not.be.undefined();
                        expect(logEvent.isRemoved).to.be.false();
                        const args = logEvent.log.args;
                        expect(args._owner).to.be.equal(coinbase);
                        expect(args._spender).to.be.equal(addressWithoutFunds);
                        expect(args._value).to.be.bignumber.equal(allowanceAmount);
                    },
                );
                contractWrappers.token.subscribe(tokenAddress, TokenEvents.Approval, indexFilterValues, callback);
                await contractWrappers.token.setAllowanceAsync(
                    tokenAddress,
                    coinbase,
                    addressWithoutFunds,
                    allowanceAmount,
                );
            })().catch(done);
        });
        it('Outstanding subscriptions are cancelled when contractWrappers.setProvider called', (done: DoneCallback) => {
            (async () => {
                const callbackNeverToBeCalled = callbackErrorReporter.reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<ApprovalContractEventArgs>) => {
                        done(new Error('Expected this subscription to have been cancelled'));
                    },
                );
                contractWrappers.token.subscribe(
                    tokenAddress,
                    TokenEvents.Transfer,
                    indexFilterValues,
                    callbackNeverToBeCalled,
                );
                const callbackToBeCalled = callbackErrorReporter.reportNodeCallbackErrors(done)();
                contractWrappers.setProvider(provider, constants.TESTRPC_NETWORK_ID);
                contractWrappers.token.subscribe(
                    tokenAddress,
                    TokenEvents.Transfer,
                    indexFilterValues,
                    callbackToBeCalled,
                );
                await contractWrappers.token.transferAsync(tokenAddress, coinbase, addressWithoutFunds, transferAmount);
            })().catch(done);
        });
        it('Should cancel subscription when unsubscribe called', (done: DoneCallback) => {
            (async () => {
                const callbackNeverToBeCalled = callbackErrorReporter.reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<ApprovalContractEventArgs>) => {
                        done(new Error('Expected this subscription to have been cancelled'));
                    },
                );
                const subscriptionToken = contractWrappers.token.subscribe(
                    tokenAddress,
                    TokenEvents.Transfer,
                    indexFilterValues,
                    callbackNeverToBeCalled,
                );
                contractWrappers.token.unsubscribe(subscriptionToken);
                await contractWrappers.token.transferAsync(tokenAddress, coinbase, addressWithoutFunds, transferAmount);
                done();
            })().catch(done);
        });
    });
    describe('#getLogsAsync', () => {
        let tokenAddress: string;
        let tokenTransferProxyAddress: string;
        const blockRange: BlockRange = {
            fromBlock: 0,
            toBlock: BlockParamLiteral.Latest,
        };
        let txHash: string;
        before(() => {
            const token = tokens[0];
            tokenAddress = token.address;
            tokenTransferProxyAddress = contractWrappers.proxy.getContractAddress();
        });
        it('should get logs with decoded args emitted by Approval', async () => {
            txHash = await contractWrappers.token.setUnlimitedProxyAllowanceAsync(tokenAddress, coinbase);
            await web3Wrapper.awaitTransactionMinedAsync(txHash);
            const eventName = TokenEvents.Approval;
            const indexFilterValues = {};
            const logs = await contractWrappers.token.getLogsAsync<ApprovalContractEventArgs>(
                tokenAddress,
                eventName,
                blockRange,
                indexFilterValues,
            );
            expect(logs).to.have.length(1);
            const args = logs[0].args;
            expect(logs[0].event).to.be.equal(eventName);
            expect(args._owner).to.be.equal(coinbase);
            expect(args._spender).to.be.equal(tokenTransferProxyAddress);
            expect(args._value).to.be.bignumber.equal(contractWrappers.token.UNLIMITED_ALLOWANCE_IN_BASE_UNITS);
        });
        it('should only get the logs with the correct event name', async () => {
            txHash = await contractWrappers.token.setUnlimitedProxyAllowanceAsync(tokenAddress, coinbase);
            await web3Wrapper.awaitTransactionMinedAsync(txHash);
            const differentEventName = TokenEvents.Transfer;
            const indexFilterValues = {};
            const logs = await contractWrappers.token.getLogsAsync(
                tokenAddress,
                differentEventName,
                blockRange,
                indexFilterValues,
            );
            expect(logs).to.have.length(0);
        });
        it('should only get the logs with the correct indexed fields', async () => {
            txHash = await contractWrappers.token.setUnlimitedProxyAllowanceAsync(tokenAddress, coinbase);
            await web3Wrapper.awaitTransactionMinedAsync(txHash);
            txHash = await contractWrappers.token.setUnlimitedProxyAllowanceAsync(tokenAddress, addressWithoutFunds);
            await web3Wrapper.awaitTransactionMinedAsync(txHash);
            const eventName = TokenEvents.Approval;
            const indexFilterValues = {
                _owner: coinbase,
            };
            const logs = await contractWrappers.token.getLogsAsync<ApprovalContractEventArgs>(
                tokenAddress,
                eventName,
                blockRange,
                indexFilterValues,
            );
            expect(logs).to.have.length(1);
            const args = logs[0].args;
            expect(args._owner).to.be.equal(coinbase);
        });
    });
});
// tslint:disable:max-file-line-count

function addEmptyWalletSubprovider(p: Provider): Provider {
    const providerEngine = new Web3ProviderEngine();
    providerEngine.addProvider(new EmptyWalletSubprovider());
    const currentSubproviders = (p as any)._providers;
    for (const subprovider of currentSubproviders) {
        providerEngine.addProvider(subprovider);
    }
    providerEngine.start();
    return providerEngine;
}
