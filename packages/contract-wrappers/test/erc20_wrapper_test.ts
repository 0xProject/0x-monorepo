import { BlockchainLifecycle, callbackErrorReporter } from '@0xproject/dev-utils';
import { getContractAddresses } from '@0xproject/migrations';
import { EmptyWalletSubprovider, Web3ProviderEngine } from '@0xproject/subproviders';
import { DoneCallback } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import { Provider } from 'ethereum-types';
import 'mocha';

import {
    BlockParamLiteral,
    BlockRange,
    ContractWrappers,
    ContractWrappersConfig,
    ContractWrappersError,
    DecodedLogEvent,
    ERC20TokenApprovalEventArgs,
    ERC20TokenEvents,
    ERC20TokenTransferEventArgs,
} from '../src';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';
import { tokenUtils } from './utils/token_utils';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('ERC20Wrapper', () => {
    let contractWrappers: ContractWrappers;
    let userAddresses: string[];
    let tokens: string[];
    let coinbase: string;
    let addressWithoutFunds: string;
    let config: ContractWrappersConfig;

    before(async () => {
        config = {
            networkId: constants.TESTRPC_NETWORK_ID,
            contractAddresses: getContractAddresses(),
            blockPollingIntervalMs: 10,
        };
        contractWrappers = new ContractWrappers(provider, config);
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
        tokens = tokenUtils.getDummyERC20TokenAddresses();
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
        let tokenAddress: string;
        let transferAmount: BigNumber;
        before(() => {
            tokenAddress = tokens[0];
            transferAmount = new BigNumber(42);
        });
        it('should successfully transfer tokens', async () => {
            const fromAddress = coinbase;
            const toAddress = addressWithoutFunds;
            const preBalance = await contractWrappers.erc20Token.getBalanceAsync(tokenAddress, toAddress);
            expect(preBalance).to.be.bignumber.equal(0);
            await contractWrappers.erc20Token.transferAsync(tokenAddress, fromAddress, toAddress, transferAmount);
            const postBalance = await contractWrappers.erc20Token.getBalanceAsync(tokenAddress, toAddress);
            return expect(postBalance).to.be.bignumber.equal(transferAmount);
        });
        it('should fail to transfer tokens if fromAddress has an insufficient balance', async () => {
            const fromAddress = addressWithoutFunds;
            const toAddress = coinbase;
            return expect(
                contractWrappers.erc20Token.transferAsync(tokenAddress, fromAddress, toAddress, transferAmount),
            ).to.be.rejectedWith(ContractWrappersError.InsufficientBalanceForTransfer);
        });
        it('should throw a CONTRACT_DOES_NOT_EXIST error for a non-existent token contract', async () => {
            const nonExistentTokenAddress = '0x9dd402f14d67e001d8efbe6583e51bf9706aa065';
            const fromAddress = coinbase;
            const toAddress = coinbase;
            return expect(
                contractWrappers.erc20Token.transferAsync(
                    nonExistentTokenAddress,
                    fromAddress,
                    toAddress,
                    transferAmount,
                ),
            ).to.be.rejectedWith(ContractWrappersError.ERC20TokenContractDoesNotExist);
        });
    });
    describe('#transferFromAsync', () => {
        let tokenAddress: string;
        let toAddress: string;
        let senderAddress: string;
        before(async () => {
            tokenAddress = tokens[0];
            toAddress = addressWithoutFunds;
            senderAddress = userAddresses[2];
        });
        it('should fail to transfer tokens if fromAddress has insufficient allowance set', async () => {
            const fromAddress = coinbase;
            const transferAmount = new BigNumber(42);

            const fromAddressBalance = await contractWrappers.erc20Token.getBalanceAsync(tokenAddress, fromAddress);
            expect(fromAddressBalance).to.be.bignumber.greaterThan(transferAmount);

            const fromAddressAllowance = await contractWrappers.erc20Token.getAllowanceAsync(
                tokenAddress,
                fromAddress,
                toAddress,
            );
            expect(fromAddressAllowance).to.be.bignumber.equal(0);

            return expect(
                contractWrappers.erc20Token.transferFromAsync(
                    tokenAddress,
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

            await contractWrappers.erc20Token.setAllowanceAsync(tokenAddress, fromAddress, toAddress, transferAmount);

            return expect(
                contractWrappers.erc20Token.transferFromAsync(
                    tokenAddress,
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

            const fromAddressBalance = await contractWrappers.erc20Token.getBalanceAsync(tokenAddress, fromAddress);
            expect(fromAddressBalance).to.be.bignumber.equal(0);

            await contractWrappers.erc20Token.setAllowanceAsync(
                tokenAddress,
                fromAddress,
                senderAddress,
                transferAmount,
            );
            const fromAddressAllowance = await contractWrappers.erc20Token.getAllowanceAsync(
                tokenAddress,
                fromAddress,
                senderAddress,
            );
            expect(fromAddressAllowance).to.be.bignumber.equal(transferAmount);

            return expect(
                contractWrappers.erc20Token.transferFromAsync(
                    tokenAddress,
                    fromAddress,
                    toAddress,
                    senderAddress,
                    transferAmount,
                ),
            ).to.be.rejectedWith(ContractWrappersError.InsufficientBalanceForTransfer);
        });
        it('should successfully transfer tokens', async () => {
            const fromAddress = coinbase;

            const preBalance = await contractWrappers.erc20Token.getBalanceAsync(tokenAddress, toAddress);
            expect(preBalance).to.be.bignumber.equal(0);

            const transferAmount = new BigNumber(42);
            await contractWrappers.erc20Token.setAllowanceAsync(
                tokenAddress,
                fromAddress,
                senderAddress,
                transferAmount,
            );

            await contractWrappers.erc20Token.transferFromAsync(
                tokenAddress,
                fromAddress,
                toAddress,
                senderAddress,
                transferAmount,
            );
            const postBalance = await contractWrappers.erc20Token.getBalanceAsync(tokenAddress, toAddress);
            return expect(postBalance).to.be.bignumber.equal(transferAmount);
        });
        it('should throw a CONTRACT_DOES_NOT_EXIST error for a non-existent token contract', async () => {
            const fromAddress = coinbase;
            const nonExistentTokenAddress = '0x9dd402f14d67e001d8efbe6583e51bf9706aa065';
            return expect(
                contractWrappers.erc20Token.transferFromAsync(
                    nonExistentTokenAddress,
                    fromAddress,
                    toAddress,
                    senderAddress,
                    new BigNumber(42),
                ),
            ).to.be.rejectedWith(ContractWrappersError.ERC20TokenContractDoesNotExist);
        });
    });
    describe('#getBalanceAsync', () => {
        describe('With provider with accounts', () => {
            it('should return the balance for an existing ERC20 token', async () => {
                const tokenAddress = tokens[0];
                const ownerAddress = coinbase;
                const balance = await contractWrappers.erc20Token.getBalanceAsync(tokenAddress, ownerAddress);
                const expectedBalance = new BigNumber('1000000000000000000000000000');
                return expect(balance).to.be.bignumber.equal(expectedBalance);
            });
            it('should throw a CONTRACT_DOES_NOT_EXIST error for a non-existent token contract', async () => {
                const nonExistentTokenAddress = '0x9dd402f14d67e001d8efbe6583e51bf9706aa065';
                const ownerAddress = coinbase;
                return expect(
                    contractWrappers.erc20Token.getBalanceAsync(nonExistentTokenAddress, ownerAddress),
                ).to.be.rejectedWith(ContractWrappersError.ERC20TokenContractDoesNotExist);
            });
            it('should return a balance of 0 for a non-existent owner address', async () => {
                const tokenAddress = tokens[0];
                const nonExistentOwner = '0x198c6ad858f213fb31b6fe809e25040e6b964593';
                const balance = await contractWrappers.erc20Token.getBalanceAsync(tokenAddress, nonExistentOwner);
                const expectedBalance = new BigNumber(0);
                return expect(balance).to.be.bignumber.equal(expectedBalance);
            });
        });
        describe('With provider without accounts', () => {
            let zeroExContractWithoutAccounts: ContractWrappers;
            before(async () => {
                const emptyWalletProvider = addEmptyWalletSubprovider(provider);
                zeroExContractWithoutAccounts = new ContractWrappers(emptyWalletProvider, config);
            });
            it('should return balance even when called with provider instance without addresses', async () => {
                const tokenAddress = tokens[0];
                const ownerAddress = coinbase;
                const balance = await zeroExContractWithoutAccounts.erc20Token.getBalanceAsync(
                    tokenAddress,
                    ownerAddress,
                );
                const expectedBalance = new BigNumber('1000000000000000000000000000');
                return expect(balance).to.be.bignumber.equal(expectedBalance);
            });
        });
    });
    describe('#setAllowanceAsync', () => {
        it("should set the spender's allowance", async () => {
            const tokenAddress = tokens[0];
            const ownerAddress = coinbase;
            const spenderAddress = addressWithoutFunds;

            const allowanceBeforeSet = await contractWrappers.erc20Token.getAllowanceAsync(
                tokenAddress,
                ownerAddress,
                spenderAddress,
            );
            const expectedAllowanceBeforeAllowanceSet = new BigNumber(0);
            expect(allowanceBeforeSet).to.be.bignumber.equal(expectedAllowanceBeforeAllowanceSet);

            const amountInBaseUnits = new BigNumber(50);
            await contractWrappers.erc20Token.setAllowanceAsync(
                tokenAddress,
                ownerAddress,
                spenderAddress,
                amountInBaseUnits,
            );

            const allowanceAfterSet = await contractWrappers.erc20Token.getAllowanceAsync(
                tokenAddress,
                ownerAddress,
                spenderAddress,
            );
            const expectedAllowanceAfterAllowanceSet = amountInBaseUnits;
            return expect(allowanceAfterSet).to.be.bignumber.equal(expectedAllowanceAfterAllowanceSet);
        });
    });
    describe('#setUnlimitedAllowanceAsync', () => {
        it("should set the unlimited spender's allowance", async () => {
            const tokenAddress = tokens[0];
            const ownerAddress = coinbase;
            const spenderAddress = addressWithoutFunds;

            await contractWrappers.erc20Token.setUnlimitedAllowanceAsync(tokenAddress, ownerAddress, spenderAddress);
            const allowance = await contractWrappers.erc20Token.getAllowanceAsync(
                tokenAddress,
                ownerAddress,
                spenderAddress,
            );
            return expect(allowance).to.be.bignumber.equal(
                contractWrappers.erc20Token.UNLIMITED_ALLOWANCE_IN_BASE_UNITS,
            );
        });
        it('should reduce the gas cost for transfers including tokens with unlimited allowance support', async () => {
            const transferAmount = new BigNumber(5);
            const zrxAddress = getContractAddresses().zrxToken;
            const [, userWithNormalAllowance, userWithUnlimitedAllowance] = userAddresses;
            await contractWrappers.erc20Token.setAllowanceAsync(
                zrxAddress,
                coinbase,
                userWithNormalAllowance,
                transferAmount,
            );
            await contractWrappers.erc20Token.setUnlimitedAllowanceAsync(
                zrxAddress,
                coinbase,
                userWithUnlimitedAllowance,
            );

            const initBalanceWithNormalAllowance = await web3Wrapper.getBalanceInWeiAsync(userWithNormalAllowance);
            const initBalanceWithUnlimitedAllowance = await web3Wrapper.getBalanceInWeiAsync(
                userWithUnlimitedAllowance,
            );

            await contractWrappers.erc20Token.transferFromAsync(
                zrxAddress,
                coinbase,
                userWithNormalAllowance,
                userWithNormalAllowance,
                transferAmount,
            );
            await contractWrappers.erc20Token.transferFromAsync(
                zrxAddress,
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
                const tokenAddress = tokens[0];
                const ownerAddress = coinbase;
                const spenderAddress = addressWithoutFunds;

                const amountInBaseUnits = new BigNumber(50);
                await contractWrappers.erc20Token.setAllowanceAsync(
                    tokenAddress,
                    ownerAddress,
                    spenderAddress,
                    amountInBaseUnits,
                );

                const allowance = await contractWrappers.erc20Token.getAllowanceAsync(
                    tokenAddress,
                    ownerAddress,
                    spenderAddress,
                );
                const expectedAllowance = amountInBaseUnits;
                return expect(allowance).to.be.bignumber.equal(expectedAllowance);
            });
            it('should return 0 if no allowance set yet', async () => {
                const tokenAddress = tokens[0];
                const ownerAddress = coinbase;
                const spenderAddress = addressWithoutFunds;
                const allowance = await contractWrappers.erc20Token.getAllowanceAsync(
                    tokenAddress,
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
                const emptyWalletProvider = addEmptyWalletSubprovider(provider);
                zeroExContractWithoutAccounts = new ContractWrappers(emptyWalletProvider, config);
            });
            it('should get the proxy allowance', async () => {
                const tokenAddress = tokens[0];
                const ownerAddress = coinbase;
                const spenderAddress = addressWithoutFunds;

                const amountInBaseUnits = new BigNumber(50);
                await contractWrappers.erc20Token.setAllowanceAsync(
                    tokenAddress,
                    ownerAddress,
                    spenderAddress,
                    amountInBaseUnits,
                );

                const allowance = await zeroExContractWithoutAccounts.erc20Token.getAllowanceAsync(
                    tokenAddress,
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
            const tokenAddress = tokens[0];
            const ownerAddress = coinbase;

            const amountInBaseUnits = new BigNumber(50);
            await contractWrappers.erc20Token.setProxyAllowanceAsync(tokenAddress, ownerAddress, amountInBaseUnits);

            const allowance = await contractWrappers.erc20Token.getProxyAllowanceAsync(tokenAddress, ownerAddress);
            const expectedAllowance = amountInBaseUnits;
            return expect(allowance).to.be.bignumber.equal(expectedAllowance);
        });
    });
    describe('#setProxyAllowanceAsync', () => {
        it('should set the proxy allowance', async () => {
            const tokenAddress = tokens[0];
            const ownerAddress = coinbase;

            const allowanceBeforeSet = await contractWrappers.erc20Token.getProxyAllowanceAsync(
                tokenAddress,
                ownerAddress,
            );
            const expectedAllowanceBeforeAllowanceSet = new BigNumber(0);
            expect(allowanceBeforeSet).to.be.bignumber.equal(expectedAllowanceBeforeAllowanceSet);

            const amountInBaseUnits = new BigNumber(50);
            await contractWrappers.erc20Token.setProxyAllowanceAsync(tokenAddress, ownerAddress, amountInBaseUnits);

            const allowanceAfterSet = await contractWrappers.erc20Token.getProxyAllowanceAsync(
                tokenAddress,
                ownerAddress,
            );
            const expectedAllowanceAfterAllowanceSet = amountInBaseUnits;
            return expect(allowanceAfterSet).to.be.bignumber.equal(expectedAllowanceAfterAllowanceSet);
        });
    });
    describe('#setUnlimitedProxyAllowanceAsync', () => {
        it('should set the unlimited proxy allowance', async () => {
            const tokenAddress = tokens[0];
            const ownerAddress = coinbase;

            await contractWrappers.erc20Token.setUnlimitedProxyAllowanceAsync(tokenAddress, ownerAddress);
            const allowance = await contractWrappers.erc20Token.getProxyAllowanceAsync(tokenAddress, ownerAddress);
            return expect(allowance).to.be.bignumber.equal(
                contractWrappers.erc20Token.UNLIMITED_ALLOWANCE_IN_BASE_UNITS,
            );
        });
    });
    describe('#subscribe', () => {
        const indexFilterValues = {};
        let tokenAddress: string;
        const transferAmount = new BigNumber(42);
        const allowanceAmount = new BigNumber(42);
        before(() => {
            tokenAddress = tokens[0];
        });
        afterEach(() => {
            contractWrappers.erc20Token.unsubscribeAll();
        });
        // Hack: Mocha does not allow a test to be both async and have a `done` callback
        // Since we need to await the receipt of the event in the `subscribe` callback,
        // we do need both. A hack is to make the top-level a sync fn w/ a done callback and then
        // wrap the rest of the test in an async block
        // Source: https://github.com/mochajs/mocha/issues/2407
        it('Should receive the Transfer event when tokens are transfered', (done: DoneCallback) => {
            (async () => {
                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<ERC20TokenTransferEventArgs>) => {
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
                contractWrappers.erc20Token.subscribe(
                    tokenAddress,
                    ERC20TokenEvents.Transfer,
                    indexFilterValues,
                    callback,
                );
                await contractWrappers.erc20Token.transferAsync(
                    tokenAddress,
                    coinbase,
                    addressWithoutFunds,
                    transferAmount,
                );
            })().catch(done);
        });
        it('Should receive the Approval event when allowance is being set', (done: DoneCallback) => {
            (async () => {
                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<ERC20TokenApprovalEventArgs>) => {
                        expect(logEvent).to.not.be.undefined();
                        expect(logEvent.isRemoved).to.be.false();
                        const args = logEvent.log.args;
                        expect(args._owner).to.be.equal(coinbase);
                        expect(args._spender).to.be.equal(addressWithoutFunds);
                        expect(args._value).to.be.bignumber.equal(allowanceAmount);
                    },
                );
                contractWrappers.erc20Token.subscribe(
                    tokenAddress,
                    ERC20TokenEvents.Approval,
                    indexFilterValues,
                    callback,
                );
                await contractWrappers.erc20Token.setAllowanceAsync(
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
                    (_logEvent: DecodedLogEvent<ERC20TokenApprovalEventArgs>) => {
                        done(new Error('Expected this subscription to have been cancelled'));
                    },
                );
                contractWrappers.erc20Token.subscribe(
                    tokenAddress,
                    ERC20TokenEvents.Transfer,
                    indexFilterValues,
                    callbackNeverToBeCalled,
                );
                const callbackToBeCalled = callbackErrorReporter.reportNodeCallbackErrors(done)();
                contractWrappers.setProvider(provider);
                contractWrappers.erc20Token.subscribe(
                    tokenAddress,
                    ERC20TokenEvents.Transfer,
                    indexFilterValues,
                    callbackToBeCalled,
                );
                await contractWrappers.erc20Token.transferAsync(
                    tokenAddress,
                    coinbase,
                    addressWithoutFunds,
                    transferAmount,
                );
            })().catch(done);
        });
        it('Should cancel subscription when unsubscribe called', (done: DoneCallback) => {
            (async () => {
                const callbackNeverToBeCalled = callbackErrorReporter.reportNodeCallbackErrors(done)(
                    (_logEvent: DecodedLogEvent<ERC20TokenApprovalEventArgs>) => {
                        done(new Error('Expected this subscription to have been cancelled'));
                    },
                );
                const subscriptionToken = contractWrappers.erc20Token.subscribe(
                    tokenAddress,
                    ERC20TokenEvents.Transfer,
                    indexFilterValues,
                    callbackNeverToBeCalled,
                );
                contractWrappers.erc20Token.unsubscribe(subscriptionToken);
                await contractWrappers.erc20Token.transferAsync(
                    tokenAddress,
                    coinbase,
                    addressWithoutFunds,
                    transferAmount,
                );
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
            tokenAddress = tokens[0];
            tokenTransferProxyAddress = contractWrappers.erc20Proxy.address;
        });
        it('should get logs with decoded args emitted by Approval', async () => {
            txHash = await contractWrappers.erc20Token.setUnlimitedProxyAllowanceAsync(tokenAddress, coinbase);
            await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            const eventName = ERC20TokenEvents.Approval;
            const indexFilterValues = {};
            const logs = await contractWrappers.erc20Token.getLogsAsync<ERC20TokenApprovalEventArgs>(
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
            expect(args._value).to.be.bignumber.equal(contractWrappers.erc20Token.UNLIMITED_ALLOWANCE_IN_BASE_UNITS);
        });
        it('should only get the logs with the correct event name', async () => {
            txHash = await contractWrappers.erc20Token.setUnlimitedProxyAllowanceAsync(tokenAddress, coinbase);
            await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            const differentEventName = ERC20TokenEvents.Transfer;
            const indexFilterValues = {};
            const logs = await contractWrappers.erc20Token.getLogsAsync(
                tokenAddress,
                differentEventName,
                blockRange,
                indexFilterValues,
            );
            expect(logs).to.have.length(0);
        });
        it('should only get the logs with the correct indexed fields', async () => {
            txHash = await contractWrappers.erc20Token.setUnlimitedProxyAllowanceAsync(tokenAddress, coinbase);
            await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            txHash = await contractWrappers.erc20Token.setUnlimitedProxyAllowanceAsync(
                tokenAddress,
                addressWithoutFunds,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            const eventName = ERC20TokenEvents.Approval;
            const indexFilterValues = {
                _owner: coinbase,
            };
            const logs = await contractWrappers.erc20Token.getLogsAsync<ERC20TokenApprovalEventArgs>(
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
