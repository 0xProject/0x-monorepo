import { BlockchainLifecycle } from '@0x/dev-utils';
import { assetDataUtils } from '@0x/order-utils';
import { AssetProxyId, RevertReason } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import { LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import { DummyERC20TokenContract } from '../../generated-wrappers/dummy_erc20_token';
import { ERC20ProxyContract } from '../../generated-wrappers/erc20_proxy';
import { ERC721ProxyContract } from '../../generated-wrappers/erc721_proxy';
import {
    TestAssetProxyDispatcherAssetProxyRegisteredEventArgs,
    TestAssetProxyDispatcherContract,
} from '../../generated-wrappers/test_asset_proxy_dispatcher';
import { artifacts } from '../../src/artifacts';
import { expectTransactionFailedAsync } from '../utils/assertions';
import { chaiSetup } from '../utils/chai_setup';
import { constants } from '../utils/constants';
import { ERC20Wrapper } from '../utils/erc20_wrapper';
import { ERC721Wrapper } from '../utils/erc721_wrapper';
import { LogDecoder } from '../utils/log_decoder';
import { provider, txDefaults, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
// tslint:disable:no-unnecessary-type-assertion
describe('AssetProxyDispatcher', () => {
    let owner: string;
    let notOwner: string;
    let makerAddress: string;
    let takerAddress: string;

    let zrxToken: DummyERC20TokenContract;
    let erc20Proxy: ERC20ProxyContract;
    let erc721Proxy: ERC721ProxyContract;
    let assetProxyDispatcher: TestAssetProxyDispatcherContract;

    let erc20Wrapper: ERC20Wrapper;
    let erc721Wrapper: ERC721Wrapper;

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

        const numDummyErc20ToDeploy = 1;
        [zrxToken] = await erc20Wrapper.deployDummyTokensAsync(numDummyErc20ToDeploy, constants.DUMMY_TOKEN_DECIMALS);
        erc20Proxy = await erc20Wrapper.deployProxyAsync();
        await erc20Wrapper.setBalancesAndAllowancesAsync();

        erc721Proxy = await erc721Wrapper.deployProxyAsync();

        assetProxyDispatcher = await TestAssetProxyDispatcherContract.deployFrom0xArtifactAsync(
            artifacts.TestAssetProxyDispatcher,
            provider,
            txDefaults,
        );
        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(assetProxyDispatcher.address, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc721Proxy.addAuthorizedAddress.sendTransactionAsync(assetProxyDispatcher.address, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('registerAssetProxy', () => {
        it('should record proxy upon registration', async () => {
            await web3Wrapper.awaitTransactionSuccessAsync(
                await assetProxyDispatcher.registerAssetProxy.sendTransactionAsync(erc20Proxy.address, { from: owner }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const proxyAddress = await assetProxyDispatcher.getAssetProxy.callAsync(AssetProxyId.ERC20);
            expect(proxyAddress).to.be.equal(erc20Proxy.address);
        });

        it('should be able to record multiple proxies', async () => {
            // Record first proxy
            await web3Wrapper.awaitTransactionSuccessAsync(
                await assetProxyDispatcher.registerAssetProxy.sendTransactionAsync(erc20Proxy.address, { from: owner }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            let proxyAddress = await assetProxyDispatcher.getAssetProxy.callAsync(AssetProxyId.ERC20);
            expect(proxyAddress).to.be.equal(erc20Proxy.address);
            // Record another proxy
            await web3Wrapper.awaitTransactionSuccessAsync(
                await assetProxyDispatcher.registerAssetProxy.sendTransactionAsync(erc721Proxy.address, {
                    from: owner,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            proxyAddress = await assetProxyDispatcher.getAssetProxy.callAsync(AssetProxyId.ERC721);
            expect(proxyAddress).to.be.equal(erc721Proxy.address);
        });

        it('should throw if a proxy with the same id is already registered', async () => {
            // Initial registration
            await web3Wrapper.awaitTransactionSuccessAsync(
                await assetProxyDispatcher.registerAssetProxy.sendTransactionAsync(erc20Proxy.address, { from: owner }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const proxyAddress = await assetProxyDispatcher.getAssetProxy.callAsync(AssetProxyId.ERC20);
            expect(proxyAddress).to.be.equal(erc20Proxy.address);
            // Deploy a new version of the ERC20 Transfer Proxy contract
            const newErc20TransferProxy = await ERC20ProxyContract.deployFrom0xArtifactAsync(
                artifacts.ERC20Proxy,
                provider,
                txDefaults,
            );
            // Register new ERC20 Transfer Proxy contract
            return expectTransactionFailedAsync(
                assetProxyDispatcher.registerAssetProxy.sendTransactionAsync(newErc20TransferProxy.address, {
                    from: owner,
                }),
                RevertReason.AssetProxyAlreadyExists,
            );
        });

        it('should throw if requesting address is not owner', async () => {
            return expectTransactionFailedAsync(
                assetProxyDispatcher.registerAssetProxy.sendTransactionAsync(erc20Proxy.address, { from: notOwner }),
                RevertReason.OnlyContractOwner,
            );
        });

        it('should log an event with correct arguments when an asset proxy is registered', async () => {
            const logDecoder = new LogDecoder(web3Wrapper);
            const txReceipt = await logDecoder.getTxWithDecodedLogsAsync(
                await assetProxyDispatcher.registerAssetProxy.sendTransactionAsync(erc20Proxy.address, { from: owner }),
            );
            const logs = txReceipt.logs;
            const log = logs[0] as LogWithDecodedArgs<TestAssetProxyDispatcherAssetProxyRegisteredEventArgs>;
            expect(log.args.id).to.equal(AssetProxyId.ERC20);
            expect(log.args.assetProxy).to.equal(erc20Proxy.address);
        });
    });

    describe('getAssetProxy', () => {
        it('should return correct address of registered proxy', async () => {
            await web3Wrapper.awaitTransactionSuccessAsync(
                await assetProxyDispatcher.registerAssetProxy.sendTransactionAsync(erc20Proxy.address, { from: owner }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const proxyAddress = await assetProxyDispatcher.getAssetProxy.callAsync(AssetProxyId.ERC20);
            expect(proxyAddress).to.be.equal(erc20Proxy.address);
        });

        it('should return NULL address if requesting non-existent proxy', async () => {
            const proxyAddress = await assetProxyDispatcher.getAssetProxy.callAsync(AssetProxyId.ERC20);
            expect(proxyAddress).to.be.equal(constants.NULL_ADDRESS);
        });
    });

    describe('dispatchTransferFrom', () => {
        it('should dispatch transfer to registered proxy', async () => {
            // Register ERC20 proxy
            await web3Wrapper.awaitTransactionSuccessAsync(
                await assetProxyDispatcher.registerAssetProxy.sendTransactionAsync(erc20Proxy.address, { from: owner }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            // Construct metadata for ERC20 proxy
            const encodedAssetData = assetDataUtils.encodeERC20AssetData(zrxToken.address);

            // Perform a transfer from makerAddress to takerAddress
            const erc20Balances = await erc20Wrapper.getBalancesAsync();
            const amount = new BigNumber(10);
            await web3Wrapper.awaitTransactionSuccessAsync(
                await assetProxyDispatcher.publicDispatchTransferFrom.sendTransactionAsync(
                    encodedAssetData,
                    makerAddress,
                    takerAddress,
                    amount,
                    { from: owner },
                ),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            // Verify transfer was successful
            const newBalances = await erc20Wrapper.getBalancesAsync();
            expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][zrxToken.address].minus(amount),
            );
            expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[takerAddress][zrxToken.address].add(amount),
            );
        });

        it('should not dispatch a transfer if amount == 0', async () => {
            // Register ERC20 proxy
            await web3Wrapper.awaitTransactionSuccessAsync(
                await assetProxyDispatcher.registerAssetProxy.sendTransactionAsync(erc20Proxy.address, { from: owner }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            // Construct metadata for ERC20 proxy
            const encodedAssetData = assetDataUtils.encodeERC20AssetData(zrxToken.address);

            // Perform a transfer from makerAddress to takerAddress
            const erc20Balances = await erc20Wrapper.getBalancesAsync();
            const amount = constants.ZERO_AMOUNT;
            const txReceipt = await web3Wrapper.awaitTransactionSuccessAsync(
                await assetProxyDispatcher.publicDispatchTransferFrom.sendTransactionAsync(
                    encodedAssetData,
                    makerAddress,
                    takerAddress,
                    amount,
                    { from: owner },
                ),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            expect(txReceipt.logs.length).to.be.equal(0);
            const newBalances = await erc20Wrapper.getBalancesAsync();
            expect(newBalances).to.deep.equal(erc20Balances);
        });

        it('should not dispatch a transfer if from == to', async () => {
            // Register ERC20 proxy
            await web3Wrapper.awaitTransactionSuccessAsync(
                await assetProxyDispatcher.registerAssetProxy.sendTransactionAsync(erc20Proxy.address, { from: owner }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            // Construct metadata for ERC20 proxy
            const encodedAssetData = assetDataUtils.encodeERC20AssetData(zrxToken.address);

            // Perform a transfer from makerAddress to takerAddress
            const erc20Balances = await erc20Wrapper.getBalancesAsync();
            const amount = new BigNumber(10);
            const txReceipt = await web3Wrapper.awaitTransactionSuccessAsync(
                await assetProxyDispatcher.publicDispatchTransferFrom.sendTransactionAsync(
                    encodedAssetData,
                    makerAddress,
                    makerAddress,
                    amount,
                    { from: owner },
                ),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            expect(txReceipt.logs.length).to.be.equal(0);
            const newBalances = await erc20Wrapper.getBalancesAsync();
            expect(newBalances).to.deep.equal(erc20Balances);
        });

        it('should throw if dispatching to unregistered proxy', async () => {
            // Construct metadata for ERC20 proxy
            const encodedAssetData = assetDataUtils.encodeERC20AssetData(zrxToken.address);
            // Perform a transfer from makerAddress to takerAddress
            const amount = new BigNumber(10);
            return expectTransactionFailedAsync(
                assetProxyDispatcher.publicDispatchTransferFrom.sendTransactionAsync(
                    encodedAssetData,
                    makerAddress,
                    takerAddress,
                    amount,
                    { from: owner },
                ),
                RevertReason.AssetProxyDoesNotExist,
            );
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
