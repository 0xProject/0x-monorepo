import {
    artifacts as proxyArtifacts,
    ERC20ProxyContract,
    ERC20Wrapper,
    ERC721ProxyContract,
    ERC721Wrapper,
} from '@0x/contracts-asset-proxy';
import { DevUtilsContract } from '@0x/contracts-dev-utils';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import {
    chaiSetup,
    constants,
    LogDecoder,
    orderUtils,
    provider,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { ExchangeRevertErrors } from '@0x/order-utils';
import { AssetProxyId, RevertReason } from '@0x/types';
import { BigNumber, OwnableRevertErrors, StringRevertError } from '@0x/utils';
import * as chai from 'chai';
import { LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import {
    artifacts,
    TestAssetProxyDispatcherAssetProxyRegisteredEventArgs,
    TestAssetProxyDispatcherContract,
} from '../src';

import { dependencyArtifacts } from './utils/dependency_artifacts';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
// tslint:disable:no-unnecessary-type-assertion
describe('AssetProxyDispatcher', () => {
    let owner: string;
    let notOwner: string;
    let makerAddress: string;
    let takerAddress: string;

    let erc20TokenA: DummyERC20TokenContract;
    let erc20TokenB: DummyERC20TokenContract;
    let erc20Proxy: ERC20ProxyContract;
    let erc721Proxy: ERC721ProxyContract;
    let assetProxyDispatcher: TestAssetProxyDispatcherContract;

    let erc20Wrapper: ERC20Wrapper;
    let erc721Wrapper: ERC721Wrapper;

    const devUtils = new DevUtilsContract(constants.NULL_ADDRESS, provider);
    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        // Setup accounts & addresses
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const usedAddresses = ([owner, notOwner, makerAddress, takerAddress] = _.slice(accounts, 0, 4));

        erc20Wrapper = new ERC20Wrapper(provider, usedAddresses, owner);
        erc721Wrapper = new ERC721Wrapper(provider, usedAddresses, owner);

        const numDummyErc20ToDeploy = 2;
        [erc20TokenA, erc20TokenB] = await erc20Wrapper.deployDummyTokensAsync(
            numDummyErc20ToDeploy,
            constants.DUMMY_TOKEN_DECIMALS,
        );
        erc20Proxy = await erc20Wrapper.deployProxyAsync();
        await erc20Wrapper.setBalancesAndAllowancesAsync();

        erc721Proxy = await erc721Wrapper.deployProxyAsync();

        assetProxyDispatcher = await TestAssetProxyDispatcherContract.deployFrom0xArtifactAsync(
            artifacts.TestAssetProxyDispatcher,
            provider,
            txDefaults,
            dependencyArtifacts,
        );
        await erc20Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(assetProxyDispatcher.address, {
            from: owner,
        });
        await erc721Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(assetProxyDispatcher.address, {
            from: owner,
        });
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('registerAssetProxy', () => {
        it('should record proxy upon registration', async () => {
            await assetProxyDispatcher.registerAssetProxy.awaitTransactionSuccessAsync(erc20Proxy.address, {
                from: owner,
            });
            const proxyAddress = await assetProxyDispatcher.getAssetProxy.callAsync(AssetProxyId.ERC20);
            expect(proxyAddress).to.be.equal(erc20Proxy.address);
        });

        it('should be able to record multiple proxies', async () => {
            // Record first proxy
            await assetProxyDispatcher.registerAssetProxy.awaitTransactionSuccessAsync(erc20Proxy.address, {
                from: owner,
            });
            let proxyAddress = await assetProxyDispatcher.getAssetProxy.callAsync(AssetProxyId.ERC20);
            expect(proxyAddress).to.be.equal(erc20Proxy.address);
            // Record another proxy
            await assetProxyDispatcher.registerAssetProxy.awaitTransactionSuccessAsync(erc721Proxy.address, {
                from: owner,
            });
            proxyAddress = await assetProxyDispatcher.getAssetProxy.callAsync(AssetProxyId.ERC721);
            expect(proxyAddress).to.be.equal(erc721Proxy.address);
        });

        it('should revert if a proxy with the same id is already registered', async () => {
            // Initial registration
            await assetProxyDispatcher.registerAssetProxy.awaitTransactionSuccessAsync(erc20Proxy.address, {
                from: owner,
            });
            const proxyAddress = await assetProxyDispatcher.getAssetProxy.callAsync(AssetProxyId.ERC20);
            expect(proxyAddress).to.be.equal(erc20Proxy.address);
            // Deploy a new version of the ERC20 Transfer Proxy contract
            const newErc20TransferProxy = await ERC20ProxyContract.deployFrom0xArtifactAsync(
                proxyArtifacts.ERC20Proxy,
                provider,
                txDefaults,
                dependencyArtifacts,
            );
            const expectedError = new ExchangeRevertErrors.AssetProxyExistsError(AssetProxyId.ERC20, proxyAddress);
            const tx = assetProxyDispatcher.registerAssetProxy.sendTransactionAsync(newErc20TransferProxy.address, {
                from: owner,
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if requesting address is not owner', async () => {
            const expectedError = new OwnableRevertErrors.OnlyOwnerError(notOwner, owner);
            const tx = assetProxyDispatcher.registerAssetProxy.sendTransactionAsync(erc20Proxy.address, {
                from: notOwner,
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if the proxy is not a contract address', async () => {
            const errMessage = 'VM Exception while processing transaction: revert';
            const tx = assetProxyDispatcher.registerAssetProxy.sendTransactionAsync(notOwner, {
                from: owner,
            });
            return expect(tx).to.be.rejectedWith(errMessage);
        });

        it('should log an event with correct arguments when an asset proxy is registered', async () => {
            const logDecoder = new LogDecoder(web3Wrapper, artifacts);
            const txReceipt = await logDecoder.getTxWithDecodedLogsAsync(
                await assetProxyDispatcher.registerAssetProxy.sendTransactionAsync(erc20Proxy.address, {
                    from: owner,
                }),
            );
            const logs = txReceipt.logs;
            const log = logs[0] as LogWithDecodedArgs<TestAssetProxyDispatcherAssetProxyRegisteredEventArgs>;
            expect(log.args.id).to.equal(AssetProxyId.ERC20);
            expect(log.args.assetProxy).to.equal(erc20Proxy.address);
        });
    });

    describe('getAssetProxy', () => {
        it('should return correct address of registered proxy', async () => {
            await assetProxyDispatcher.registerAssetProxy.awaitTransactionSuccessAsync(erc20Proxy.address, {
                from: owner,
            });
            const proxyAddress = await assetProxyDispatcher.getAssetProxy.callAsync(AssetProxyId.ERC20);
            expect(proxyAddress).to.be.equal(erc20Proxy.address);
        });

        it('should return NULL address if requesting non-existent proxy', async () => {
            const proxyAddress = await assetProxyDispatcher.getAssetProxy.callAsync(AssetProxyId.ERC20);
            expect(proxyAddress).to.be.equal(constants.NULL_ADDRESS);
        });
    });

    describe('dispatchTransferFrom', () => {
        const orderHash = orderUtils.generatePseudoRandomOrderHash();
        it('should dispatch transfer to registered proxy', async () => {
            // Register ERC20 proxy
            await assetProxyDispatcher.registerAssetProxy.awaitTransactionSuccessAsync(erc20Proxy.address, {
                from: owner,
            });
            // Construct metadata for ERC20 proxy
            const encodedAssetData = await devUtils.encodeERC20AssetData.callAsync(erc20TokenA.address);

            // Perform a transfer from makerAddress to takerAddress
            const erc20Balances = await erc20Wrapper.getBalancesAsync();
            const amount = new BigNumber(10);
            await assetProxyDispatcher.dispatchTransferFrom.awaitTransactionSuccessAsync(
                orderHash,
                encodedAssetData,
                makerAddress,
                takerAddress,
                amount,
                { from: owner },
            );
            // Verify transfer was successful
            const newBalances = await erc20Wrapper.getBalancesAsync();
            expect(newBalances[makerAddress][erc20TokenA.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][erc20TokenA.address].minus(amount),
            );
            expect(newBalances[takerAddress][erc20TokenA.address]).to.be.bignumber.equal(
                erc20Balances[takerAddress][erc20TokenA.address].plus(amount),
            );
        });

        it('should not dispatch a transfer if amount == 0', async () => {
            // Register ERC20 proxy
            await assetProxyDispatcher.registerAssetProxy.awaitTransactionSuccessAsync(erc20Proxy.address, {
                from: owner,
            });
            // Construct metadata for ERC20 proxy
            const encodedAssetData = await devUtils.encodeERC20AssetData.callAsync(erc20TokenA.address);

            // Perform a transfer from makerAddress to takerAddress
            const erc20Balances = await erc20Wrapper.getBalancesAsync();
            const amount = constants.ZERO_AMOUNT;
            const txReceipt = await assetProxyDispatcher.dispatchTransferFrom.awaitTransactionSuccessAsync(
                orderHash,
                encodedAssetData,
                makerAddress,
                takerAddress,
                amount,
                { from: owner },
            );
            expect(txReceipt.logs.length).to.be.equal(0);
            const newBalances = await erc20Wrapper.getBalancesAsync();
            expect(newBalances).to.deep.equal(erc20Balances);
        });

        it('should revert if dispatching to unregistered proxy', async () => {
            // Construct metadata for ERC20 proxy
            const encodedAssetData = await devUtils.encodeERC20AssetData.callAsync(erc20TokenA.address);

            // Perform a transfer from makerAddress to takerAddress
            const amount = new BigNumber(10);
            const expectedError = new ExchangeRevertErrors.AssetProxyDispatchError(
                ExchangeRevertErrors.AssetProxyDispatchErrorCode.UnknownAssetProxy,
                orderHash,
                encodedAssetData,
            );
            const tx = assetProxyDispatcher.dispatchTransferFrom.sendTransactionAsync(
                orderHash,
                encodedAssetData,
                makerAddress,
                takerAddress,
                amount,
                { from: owner },
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert with the correct error when assetData length < 4 bytes', async () => {
            await assetProxyDispatcher.registerAssetProxy.awaitTransactionSuccessAsync(erc20Proxy.address, {
                from: owner,
            });
            const encodedAssetData = (await devUtils.encodeERC20AssetData.callAsync(erc20TokenA.address)).slice(0, 8);
            const amount = new BigNumber(1);
            const expectedError = new ExchangeRevertErrors.AssetProxyDispatchError(
                ExchangeRevertErrors.AssetProxyDispatchErrorCode.InvalidAssetDataLength,
                orderHash,
                encodedAssetData,
            );
            const tx = assetProxyDispatcher.dispatchTransferFrom.sendTransactionAsync(
                orderHash,
                encodedAssetData,
                makerAddress,
                takerAddress,
                amount,
                { from: owner },
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if assetData is not padded to 32 bytes (excluding the id)', async () => {
            await assetProxyDispatcher.registerAssetProxy.awaitTransactionSuccessAsync(erc20Proxy.address, {
                from: owner,
            });
            // Shave off the last byte
            const encodedAssetData = (await devUtils.encodeERC20AssetData.callAsync(erc20TokenA.address)).slice(0, 72);
            const amount = new BigNumber(1);
            const expectedError = new ExchangeRevertErrors.AssetProxyDispatchError(
                ExchangeRevertErrors.AssetProxyDispatchErrorCode.InvalidAssetDataLength,
                orderHash,
                encodedAssetData,
            );
            const tx = assetProxyDispatcher.dispatchTransferFrom.sendTransactionAsync(
                orderHash,
                encodedAssetData,
                makerAddress,
                takerAddress,
                amount,
                { from: owner },
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert with the reason provided by the AssetProxy when a transfer fails', async () => {
            await assetProxyDispatcher.registerAssetProxy.awaitTransactionSuccessAsync(erc20Proxy.address, {
                from: owner,
            });
            await erc20TokenA.approve.awaitTransactionSuccessAsync(erc20Proxy.address, constants.ZERO_AMOUNT, {
                from: makerAddress,
            });
            const encodedAssetData = await devUtils.encodeERC20AssetData.callAsync(erc20TokenA.address);
            const amount = new BigNumber(1);
            const nestedError = new StringRevertError(RevertReason.TransferFailed).encode();
            const expectedError = new ExchangeRevertErrors.AssetProxyTransferError(
                orderHash,
                encodedAssetData,
                nestedError,
            );
            const tx = assetProxyDispatcher.dispatchTransferFrom.sendTransactionAsync(
                orderHash,
                encodedAssetData,
                makerAddress,
                takerAddress,
                amount,
                { from: owner },
            );
            return expect(tx).to.revertWith(expectedError);
        });
    });
    describe('simulateDispatchTransferFromCalls', () => {
        it('should revert with the information specific to the failed transfer', async () => {
            await assetProxyDispatcher.registerAssetProxy.awaitTransactionSuccessAsync(erc20Proxy.address, {
                from: owner,
            });
            const assetDataA = await devUtils.encodeERC20AssetData.callAsync(erc20TokenA.address);
            const assetDataB = await devUtils.encodeERC20AssetData.callAsync(erc20TokenB.address);
            await erc20TokenB.approve.awaitTransactionSuccessAsync(erc20Proxy.address, constants.ZERO_AMOUNT, {
                from: makerAddress,
            });
            const transferIndexAsBytes32 = '0x0000000000000000000000000000000000000000000000000000000000000001';
            const nestedError = new StringRevertError(RevertReason.TransferFailed).encode();
            const expectedError = new ExchangeRevertErrors.AssetProxyTransferError(
                transferIndexAsBytes32,
                assetDataB,
                nestedError,
            );
            const tx = assetProxyDispatcher.simulateDispatchTransferFromCalls.sendTransactionAsync(
                [assetDataA, assetDataB],
                [makerAddress, makerAddress],
                [takerAddress, takerAddress],
                [new BigNumber(1), new BigNumber(1)],
            );
            return expect(tx).to.revertWith(expectedError);
        });
        it('should forward the revert reason from the underlying failed transfer', async () => {
            const assetDataA = await devUtils.encodeERC20AssetData.callAsync(erc20TokenA.address);
            const assetDataB = await devUtils.encodeERC20AssetData.callAsync(erc20TokenB.address);
            const transferIndexAsBytes32 = '0x0000000000000000000000000000000000000000000000000000000000000000';
            const expectedError = new ExchangeRevertErrors.AssetProxyDispatchError(
                ExchangeRevertErrors.AssetProxyDispatchErrorCode.UnknownAssetProxy,
                transferIndexAsBytes32,
                assetDataA,
            );
            const tx = assetProxyDispatcher.simulateDispatchTransferFromCalls.sendTransactionAsync(
                [assetDataA, assetDataB],
                [makerAddress, makerAddress],
                [takerAddress, takerAddress],
                [new BigNumber(1), new BigNumber(1)],
            );
            return expect(tx).to.revertWith(expectedError);
        });
        it('should revert with TRANSFERS_SUCCESSFUL if no transfers fail', async () => {
            await assetProxyDispatcher.registerAssetProxy.awaitTransactionSuccessAsync(erc20Proxy.address, {
                from: owner,
            });
            const assetDataA = await devUtils.encodeERC20AssetData.callAsync(erc20TokenA.address);
            const assetDataB = await devUtils.encodeERC20AssetData.callAsync(erc20TokenB.address);
            const tx = assetProxyDispatcher.simulateDispatchTransferFromCalls.sendTransactionAsync(
                [assetDataA, assetDataB],
                [makerAddress, makerAddress],
                [takerAddress, takerAddress],
                [new BigNumber(1), new BigNumber(1)],
            );
            return expect(tx).to.revertWith(RevertReason.TransfersSuccessful);
        });
        it('should not modify balances if all transfers are successful', async () => {
            await assetProxyDispatcher.registerAssetProxy.awaitTransactionSuccessAsync(erc20Proxy.address, {
                from: owner,
            });
            const assetDataA = await devUtils.encodeERC20AssetData.callAsync(erc20TokenA.address);
            const assetDataB = await devUtils.encodeERC20AssetData.callAsync(erc20TokenB.address);
            const balances = await erc20Wrapper.getBalancesAsync();
            try {
                await assetProxyDispatcher.simulateDispatchTransferFromCalls.awaitTransactionSuccessAsync(
                    [assetDataA, assetDataB],
                    [makerAddress, makerAddress],
                    [takerAddress, takerAddress],
                    [new BigNumber(1), new BigNumber(1)],
                );
            } catch (err) {
                const newBalances = await erc20Wrapper.getBalancesAsync();
                expect(newBalances).to.deep.equal(balances);
            }
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
