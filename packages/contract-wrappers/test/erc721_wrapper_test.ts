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
    ERC721TokenApprovalEventArgs,
    ERC721TokenApprovalForAllEventArgs,
    ERC721TokenEvents,
    ERC721TokenTransferEventArgs,
} from '../src';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';
import { tokenUtils } from './utils/token_utils';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('ERC721Wrapper', () => {
    let contractWrappers: ContractWrappers;
    let userAddresses: string[];
    let tokens: string[];
    let ownerAddress: string;
    let tokenAddress: string;
    let anotherOwnerAddress: string;
    let operatorAddress: string;
    let approvedAddress: string;
    let receiverAddress: string;
    let config: ContractWrappersConfig;

    before(async () => {
        config = {
            networkId: constants.TESTRPC_NETWORK_ID,
            contractAddresses: getContractAddresses(),
            blockPollingIntervalMs: 10,
        };
        contractWrappers = new ContractWrappers(provider, config);
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
        tokens = tokenUtils.getDummyERC721TokenAddresses();
        tokenAddress = tokens[0];
        [ownerAddress, operatorAddress, anotherOwnerAddress, approvedAddress, receiverAddress] = userAddresses;
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('#transferFromAsync', () => {
        it('should fail to transfer NFT if fromAddress has no approvals set', async () => {
            const tokenId = await tokenUtils.mintDummyERC721Async(tokenAddress, ownerAddress);
            return expect(
                contractWrappers.erc721Token.transferFromAsync(tokenAddress, receiverAddress, approvedAddress, tokenId),
            ).to.be.rejectedWith(ContractWrappersError.ERC721NoApproval);
        });
        it('should successfully transfer tokens when sender is an approved address', async () => {
            const tokenId = await tokenUtils.mintDummyERC721Async(tokenAddress, ownerAddress);
            let txHash = await contractWrappers.erc721Token.setApprovalAsync(tokenAddress, approvedAddress, tokenId);
            await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            const owner = await contractWrappers.erc721Token.getOwnerOfAsync(tokenAddress, tokenId);
            expect(owner).to.be.equal(ownerAddress);
            txHash = await contractWrappers.erc721Token.transferFromAsync(
                tokenAddress,
                receiverAddress,
                approvedAddress,
                tokenId,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            const newOwner = await contractWrappers.erc721Token.getOwnerOfAsync(tokenAddress, tokenId);
            expect(newOwner).to.be.equal(receiverAddress);
        });
        it('should successfully transfer tokens when sender is an approved operator', async () => {
            const tokenId = await tokenUtils.mintDummyERC721Async(tokenAddress, ownerAddress);
            const isApprovedForAll = true;
            let txHash = await contractWrappers.erc721Token.setApprovalForAllAsync(
                tokenAddress,
                ownerAddress,
                operatorAddress,
                isApprovedForAll,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            const owner = await contractWrappers.erc721Token.getOwnerOfAsync(tokenAddress, tokenId);
            expect(owner).to.be.equal(ownerAddress);
            txHash = await contractWrappers.erc721Token.transferFromAsync(
                tokenAddress,
                receiverAddress,
                operatorAddress,
                tokenId,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            const newOwner = await contractWrappers.erc721Token.getOwnerOfAsync(tokenAddress, tokenId);
            expect(newOwner).to.be.equal(receiverAddress);
        });
    });
    describe('#getTokenCountAsync', () => {
        describe('With provider with accounts', () => {
            it('should return the count for an existing ERC721 token', async () => {
                let tokenCount = await contractWrappers.erc721Token.getTokenCountAsync(tokenAddress, ownerAddress);
                expect(tokenCount).to.be.bignumber.equal(0);
                await tokenUtils.mintDummyERC721Async(tokenAddress, ownerAddress);
                tokenCount = await contractWrappers.erc721Token.getTokenCountAsync(tokenAddress, ownerAddress);
                expect(tokenCount).to.be.bignumber.equal(1);
            });
            it('should throw a CONTRACT_DOES_NOT_EXIST error for a non-existent token contract', async () => {
                const nonExistentTokenAddress = '0x9dd402f14d67e001d8efbe6583e51bf9706aa065';
                return expect(
                    contractWrappers.erc721Token.getTokenCountAsync(nonExistentTokenAddress, ownerAddress),
                ).to.be.rejectedWith(ContractWrappersError.ERC721TokenContractDoesNotExist);
            });
            it('should return a balance of 0 for a non-existent owner address', async () => {
                const nonExistentOwner = '0x198c6ad858f213fb31b6fe809e25040e6b964593';
                const balance = await contractWrappers.erc721Token.getTokenCountAsync(tokenAddress, nonExistentOwner);
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
                const balance = await zeroExContractWithoutAccounts.erc721Token.getTokenCountAsync(
                    tokenAddress,
                    ownerAddress,
                );
                return expect(balance).to.be.bignumber.equal(0);
            });
        });
    });
    describe('#getOwnerOfAsync', () => {
        it('should return the owner for an existing ERC721 token', async () => {
            const tokenId = await tokenUtils.mintDummyERC721Async(tokenAddress, ownerAddress);
            const tokenOwner = await contractWrappers.erc721Token.getOwnerOfAsync(tokenAddress, tokenId);
            expect(tokenOwner).to.be.bignumber.equal(ownerAddress);
        });
        it('should throw a CONTRACT_DOES_NOT_EXIST error for a non-existent token contract', async () => {
            const nonExistentTokenAddress = '0x9dd402f14d67e001d8efbe6583e51bf9706aa065';
            const fakeTokenId = new BigNumber(42);
            return expect(
                contractWrappers.erc721Token.getOwnerOfAsync(nonExistentTokenAddress, fakeTokenId),
            ).to.be.rejectedWith(ContractWrappersError.ERC721TokenContractDoesNotExist);
        });
        it('should return undefined not 0 for a non-existent ERC721', async () => {
            const fakeTokenId = new BigNumber(42);
            return expect(contractWrappers.erc721Token.getOwnerOfAsync(tokenAddress, fakeTokenId)).to.be.rejectedWith(
                ContractWrappersError.ERC721OwnerNotFound,
            );
        });
    });
    describe('#setApprovalForAllAsync/isApprovedForAllAsync', () => {
        it('should check if operator address is approved', async () => {
            let isApprovedForAll = await contractWrappers.erc721Token.isApprovedForAllAsync(
                tokenAddress,
                ownerAddress,
                operatorAddress,
            );
            expect(isApprovedForAll).to.be.false();
            // set
            isApprovedForAll = true;
            let txHash = await contractWrappers.erc721Token.setApprovalForAllAsync(
                tokenAddress,
                ownerAddress,
                operatorAddress,
                isApprovedForAll,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            isApprovedForAll = await contractWrappers.erc721Token.isApprovedForAllAsync(
                tokenAddress,
                ownerAddress,
                operatorAddress,
            );
            expect(isApprovedForAll).to.be.true();
            // unset
            txHash = await contractWrappers.erc721Token.setApprovalForAllAsync(
                tokenAddress,
                ownerAddress,
                operatorAddress,
                false,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            isApprovedForAll = await contractWrappers.erc721Token.isApprovedForAllAsync(
                tokenAddress,
                ownerAddress,
                operatorAddress,
            );
            expect(isApprovedForAll).to.be.false();
        });
    });
    describe('#setProxyApprovalForAllAsync/isProxyApprovedForAllAsync', () => {
        it('should check if proxy address is approved', async () => {
            let isApprovedForAll = true;
            const txHash = await contractWrappers.erc721Token.setProxyApprovalForAllAsync(
                tokenAddress,
                ownerAddress,
                isApprovedForAll,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            isApprovedForAll = await contractWrappers.erc721Token.isProxyApprovedForAllAsync(
                tokenAddress,
                ownerAddress,
            );
            expect(isApprovedForAll).to.be.true();
        });
    });
    describe('#setApprovalAsync/getApprovedIfExistsAsync', () => {
        it("should set the spender's approval", async () => {
            const tokenId = await tokenUtils.mintDummyERC721Async(tokenAddress, ownerAddress);

            const approvalBeforeSet = await contractWrappers.erc721Token.getApprovedIfExistsAsync(
                tokenAddress,
                tokenId,
            );
            expect(approvalBeforeSet).to.be.undefined();
            await contractWrappers.erc721Token.setApprovalAsync(tokenAddress, approvedAddress, tokenId);
            const approvalAfterSet = await contractWrappers.erc721Token.getApprovedIfExistsAsync(tokenAddress, tokenId);
            expect(approvalAfterSet).to.be.equal(approvedAddress);
        });
    });
    describe('#setProxyApprovalAsync/isProxyApprovedAsync', () => {
        it('should set the proxy approval', async () => {
            const tokenId = await tokenUtils.mintDummyERC721Async(tokenAddress, ownerAddress);

            const isProxyApprovedBeforeSet = await contractWrappers.erc721Token.isProxyApprovedAsync(
                tokenAddress,
                tokenId,
            );
            expect(isProxyApprovedBeforeSet).to.be.false();
            await contractWrappers.erc721Token.setProxyApprovalAsync(tokenAddress, tokenId);
            const isProxyApprovedAfterSet = await contractWrappers.erc721Token.isProxyApprovedAsync(
                tokenAddress,
                tokenId,
            );
            expect(isProxyApprovedAfterSet).to.be.true();
        });
    });
    describe('#subscribe', () => {
        const indexFilterValues = {};
        afterEach(() => {
            contractWrappers.erc721Token.unsubscribeAll();
        });
        // Hack: Mocha does not allow a test to be both async and have a `done` callback
        // Since we need to await the receipt of the event in the `subscribe` callback,
        // we do need both. A hack is to make the top-level a sync fn w/ a done callback and then
        // wrap the rest of the test in an async block
        // Source: https://github.com/mochajs/mocha/issues/2407
        it('Should receive the Transfer event when tokens are transfered', (done: DoneCallback) => {
            (async () => {
                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<ERC721TokenTransferEventArgs>) => {
                        expect(logEvent.isRemoved).to.be.false();
                        expect(logEvent.log.logIndex).to.be.equal(0);
                        expect(logEvent.log.transactionIndex).to.be.equal(0);
                        expect(logEvent.log.blockNumber).to.be.a('number');
                        const args = logEvent.log.args;
                        expect(args._from).to.be.equal(ownerAddress);
                        expect(args._to).to.be.equal(receiverAddress);
                        expect(args._tokenId).to.be.bignumber.equal(tokenId);
                    },
                );
                const tokenId = await tokenUtils.mintDummyERC721Async(tokenAddress, ownerAddress);
                const isApprovedForAll = true;
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await contractWrappers.erc721Token.setApprovalForAllAsync(
                        tokenAddress,
                        ownerAddress,
                        operatorAddress,
                        isApprovedForAll,
                    ),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                contractWrappers.erc721Token.subscribe(
                    tokenAddress,
                    ERC721TokenEvents.Transfer,
                    indexFilterValues,
                    callback,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await contractWrappers.erc721Token.transferFromAsync(
                        tokenAddress,
                        receiverAddress,
                        operatorAddress,
                        tokenId,
                    ),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
            })().catch(done);
        });
        it('Should receive the Approval event when allowance is being set', (done: DoneCallback) => {
            (async () => {
                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<ERC721TokenApprovalEventArgs>) => {
                        expect(logEvent).to.not.be.undefined();
                        expect(logEvent.isRemoved).to.be.false();
                        const args = logEvent.log.args;
                        expect(args._owner).to.be.equal(ownerAddress);
                        expect(args._approved).to.be.equal(approvedAddress);
                        expect(args._tokenId).to.be.bignumber.equal(tokenId);
                    },
                );
                contractWrappers.erc721Token.subscribe(
                    tokenAddress,
                    ERC721TokenEvents.Approval,
                    indexFilterValues,
                    callback,
                );
                const tokenId = await tokenUtils.mintDummyERC721Async(tokenAddress, ownerAddress);
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await contractWrappers.erc721Token.setApprovalAsync(tokenAddress, approvedAddress, tokenId),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
            })().catch(done);
        });
        it('Outstanding subscriptions are cancelled when contractWrappers.setProvider called', (done: DoneCallback) => {
            (async () => {
                const callbackNeverToBeCalled = callbackErrorReporter.reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<ERC721TokenApprovalEventArgs>) => {
                        done(new Error('Expected this subscription to have been cancelled'));
                    },
                );
                contractWrappers.erc721Token.subscribe(
                    tokenAddress,
                    ERC721TokenEvents.Transfer,
                    indexFilterValues,
                    callbackNeverToBeCalled,
                );
                const callbackToBeCalled = callbackErrorReporter.reportNodeCallbackErrors(done)();
                contractWrappers.setProvider(provider);
                contractWrappers.erc721Token.subscribe(
                    tokenAddress,
                    ERC721TokenEvents.Approval,
                    indexFilterValues,
                    callbackToBeCalled,
                );
                const tokenId = await tokenUtils.mintDummyERC721Async(tokenAddress, ownerAddress);
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await contractWrappers.erc721Token.setApprovalAsync(tokenAddress, approvedAddress, tokenId),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                done();
            })().catch(done);
        });
        it('Should cancel subscription when unsubscribe called', (done: DoneCallback) => {
            (async () => {
                const callbackNeverToBeCalled = callbackErrorReporter.reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<ERC721TokenApprovalForAllEventArgs>) => {
                        done(new Error('Expected this subscription to have been cancelled'));
                    },
                );
                const subscriptionToken = contractWrappers.erc721Token.subscribe(
                    tokenAddress,
                    ERC721TokenEvents.ApprovalForAll,
                    indexFilterValues,
                    callbackNeverToBeCalled,
                );
                contractWrappers.erc721Token.unsubscribe(subscriptionToken);

                const isApproved = true;
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await contractWrappers.erc721Token.setApprovalForAllAsync(
                        tokenAddress,
                        ownerAddress,
                        operatorAddress,
                        isApproved,
                    ),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                done();
            })().catch(done);
        });
    });
    describe('#getLogsAsync', () => {
        const blockRange: BlockRange = {
            fromBlock: 0,
            toBlock: BlockParamLiteral.Latest,
        };
        let txHash: string;
        it('should get logs with decoded args emitted by ApprovalForAll', async () => {
            const isApprovedForAll = true;
            txHash = await contractWrappers.erc721Token.setApprovalForAllAsync(
                tokenAddress,
                ownerAddress,
                operatorAddress,
                isApprovedForAll,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            const eventName = ERC721TokenEvents.ApprovalForAll;
            const indexFilterValues = {};
            const logs = await contractWrappers.erc721Token.getLogsAsync<ERC721TokenApprovalForAllEventArgs>(
                tokenAddress,
                eventName,
                blockRange,
                indexFilterValues,
            );
            expect(logs).to.have.length(1);
            const args = logs[0].args;
            expect(logs[0].event).to.be.equal(eventName);
            expect(args._owner).to.be.equal(ownerAddress);
            expect(args._operator).to.be.equal(operatorAddress);
            expect(args._approved).to.be.equal(isApprovedForAll);
        });
        it('should only get the logs with the correct event name', async () => {
            const isApprovedForAll = true;
            txHash = await contractWrappers.erc721Token.setApprovalForAllAsync(
                tokenAddress,
                ownerAddress,
                operatorAddress,
                isApprovedForAll,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            const differentEventName = ERC721TokenEvents.Transfer;
            const indexFilterValues = {};
            const logs = await contractWrappers.erc721Token.getLogsAsync(
                tokenAddress,
                differentEventName,
                blockRange,
                indexFilterValues,
            );
            expect(logs).to.have.length(0);
        });
        it('should only get the logs with the correct indexed fields', async () => {
            const isApprovedForAll = true;
            txHash = await contractWrappers.erc721Token.setApprovalForAllAsync(
                tokenAddress,
                ownerAddress,
                operatorAddress,
                isApprovedForAll,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            txHash = await contractWrappers.erc721Token.setApprovalForAllAsync(
                tokenAddress,
                anotherOwnerAddress,
                operatorAddress,
                isApprovedForAll,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            const eventName = ERC721TokenEvents.ApprovalForAll;
            const indexFilterValues = {
                _owner: anotherOwnerAddress,
            };
            const logs = await contractWrappers.erc721Token.getLogsAsync<ERC721TokenApprovalForAllEventArgs>(
                tokenAddress,
                eventName,
                blockRange,
                indexFilterValues,
            );
            expect(logs).to.have.length(1);
            const args = logs[0].args;
            expect(args._owner).to.be.equal(anotherOwnerAddress);
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
