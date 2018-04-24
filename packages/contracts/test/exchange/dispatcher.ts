import { ZeroEx } from '0x.js';
import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import * as Web3 from 'web3';

import { DummyERC20TokenContract } from '../../src/contract_wrappers/generated/dummy_e_r_c20_token';
import { ERC20ProxyContract } from '../../src/contract_wrappers/generated/e_r_c20_proxy';
import { ERC721ProxyContract } from '../../src/contract_wrappers/generated/e_r_c721_proxy';
import { TestAssetProxyDispatcherContract } from '../../src/contract_wrappers/generated/test_asset_proxy_dispatcher';
import { assetProxyUtils } from '../../src/utils/asset_proxy_utils';
import { constants } from '../../src/utils/constants';
import { ERC20Wrapper } from '../../src/utils/erc20_wrapper';
import { ERC721Wrapper } from '../../src/utils/erc721_wrapper';
import { AssetProxyId, ContractName } from '../../src/utils/types';
import { chaiSetup } from '../utils/chai_setup';
import { deployer } from '../utils/deployer';
import { provider, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('AssetProxyDispatcher', () => {
    let owner: string;
    let notOwner: string;
    let notAuthorized: string;
    let makerAddress: string;
    let takerAddress: string;

    let zrxToken: DummyERC20TokenContract;
    let erc20Proxy: ERC20ProxyContract;
    let erc721Proxy: ERC721ProxyContract;
    let assetProxyDispatcher: TestAssetProxyDispatcherContract;

    let erc20Wrapper: ERC20Wrapper;
    let erc721Wrapper: ERC721Wrapper;

    before(async () => {
        // Setup accounts & addresses
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const usedAddresses = ([owner, notOwner, makerAddress, takerAddress] = accounts);
        notAuthorized = notOwner;

        erc20Wrapper = new ERC20Wrapper(deployer, provider, usedAddresses, owner);
        erc721Wrapper = new ERC721Wrapper(deployer, provider, usedAddresses, owner);

        [zrxToken] = await erc20Wrapper.deployDummyTokensAsync();
        erc20Proxy = await erc20Wrapper.deployProxyAsync();
        await erc20Wrapper.setBalancesAndAllowancesAsync();

        erc721Proxy = await erc721Wrapper.deployProxyAsync();

        const assetProxyDispatcherInstance = await deployer.deployAsync(ContractName.TestAssetProxyDispatcher);
        assetProxyDispatcher = new TestAssetProxyDispatcherContract(
            assetProxyDispatcherInstance.abi,
            assetProxyDispatcherInstance.address,
            provider,
        );
        await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(assetProxyDispatcher.address, {
            from: owner,
        });
        await erc721Proxy.addAuthorizedAddress.sendTransactionAsync(assetProxyDispatcher.address, {
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
            const prevProxyAddress = ZeroEx.NULL_ADDRESS;
            await assetProxyDispatcher.registerAssetProxy.sendTransactionAsync(
                AssetProxyId.ERC20,
                erc20Proxy.address,
                prevProxyAddress,
                { from: owner },
            );
            const proxyAddress = await assetProxyDispatcher.getAssetProxy.callAsync(AssetProxyId.ERC20);
            expect(proxyAddress).to.be.equal(erc20Proxy.address);
        });

        it('should be able to record multiple proxies', async () => {
            // Record first proxy
            const prevERC20ProxyAddress = ZeroEx.NULL_ADDRESS;
            await assetProxyDispatcher.registerAssetProxy.sendTransactionAsync(
                AssetProxyId.ERC20,
                erc20Proxy.address,
                prevERC20ProxyAddress,
                { from: owner },
            );
            let proxyAddress = await assetProxyDispatcher.getAssetProxy.callAsync(AssetProxyId.ERC20);
            expect(proxyAddress).to.be.equal(erc20Proxy.address);
            // Record another proxy
            const prevERC721ProxyAddress = ZeroEx.NULL_ADDRESS;
            await assetProxyDispatcher.registerAssetProxy.sendTransactionAsync(
                AssetProxyId.ERC721,
                erc721Proxy.address,
                prevERC721ProxyAddress,
                { from: owner },
            );
            proxyAddress = await assetProxyDispatcher.getAssetProxy.callAsync(AssetProxyId.ERC721);
            expect(proxyAddress).to.be.equal(erc721Proxy.address);
        });

        it('should replace proxy address upon re-registration', async () => {
            // Initial registration
            const prevProxyAddress = ZeroEx.NULL_ADDRESS;
            await assetProxyDispatcher.registerAssetProxy.sendTransactionAsync(
                AssetProxyId.ERC20,
                erc20Proxy.address,
                prevProxyAddress,
                { from: owner },
            );
            let proxyAddress = await assetProxyDispatcher.getAssetProxy.callAsync(AssetProxyId.ERC20);
            expect(proxyAddress).to.be.equal(erc20Proxy.address);
            // Deploy a new version of the ERC20 Transfer Proxy contract
            const newErc20TransferProxyInstance = await deployer.deployAsync(ContractName.ERC20Proxy);
            const newErc20TransferProxy = new ERC20ProxyContract(
                newErc20TransferProxyInstance.abi,
                newErc20TransferProxyInstance.address,
                provider,
            );
            // Register new ERC20 Transfer Proxy contract
            const newAddress = newErc20TransferProxy.address;
            const currentAddress = erc20Proxy.address;
            await assetProxyDispatcher.registerAssetProxy.sendTransactionAsync(
                AssetProxyId.ERC20,
                newAddress,
                currentAddress,
                { from: owner },
            );
            // Verify new asset proxy has replaced initial version
            proxyAddress = await assetProxyDispatcher.getAssetProxy.callAsync(AssetProxyId.ERC20);
            expect(proxyAddress).to.be.equal(newAddress);
        });

        it('should throw if registering with incorrect "currentAssetProxyAddress" field', async () => {
            // Initial registration
            const prevProxyAddress = ZeroEx.NULL_ADDRESS;
            await assetProxyDispatcher.registerAssetProxy.sendTransactionAsync(
                AssetProxyId.ERC20,
                erc20Proxy.address,
                prevProxyAddress,
                { from: owner },
            );
            const proxyAddress = await assetProxyDispatcher.getAssetProxy.callAsync(AssetProxyId.ERC20);
            expect(proxyAddress).to.be.equal(erc20Proxy.address);
            // The following transaction will throw because the currentAddress is no longer ZeroEx.NULL_ADDRESS
            return expect(
                assetProxyDispatcher.registerAssetProxy.sendTransactionAsync(
                    AssetProxyId.ERC20,
                    erc20Proxy.address,
                    ZeroEx.NULL_ADDRESS,
                    { from: owner },
                ),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should be able to reset proxy address to NULL', async () => {
            // Initial registration
            const prevProxyAddress = ZeroEx.NULL_ADDRESS;
            await assetProxyDispatcher.registerAssetProxy.sendTransactionAsync(
                AssetProxyId.ERC20,
                erc20Proxy.address,
                prevProxyAddress,
                { from: owner },
            );
            const proxyAddress = await assetProxyDispatcher.getAssetProxy.callAsync(AssetProxyId.ERC20);
            expect(proxyAddress).to.be.equal(erc20Proxy.address);
            // The following transaction will reset the proxy address
            const newProxyAddress = ZeroEx.NULL_ADDRESS;
            await assetProxyDispatcher.registerAssetProxy.sendTransactionAsync(
                AssetProxyId.ERC20,
                newProxyAddress,
                erc20Proxy.address,
                { from: owner },
            );
            const finalProxyAddress = await assetProxyDispatcher.getAssetProxy.callAsync(AssetProxyId.ERC20);
            expect(finalProxyAddress).to.be.equal(newProxyAddress);
        });

        it('should throw if requesting address is not owner', async () => {
            const prevProxyAddress = ZeroEx.NULL_ADDRESS;
            return expect(
                assetProxyDispatcher.registerAssetProxy.sendTransactionAsync(
                    AssetProxyId.ERC20,
                    erc20Proxy.address,
                    prevProxyAddress,
                    { from: notOwner },
                ),
            ).to.be.rejectedWith(constants.REVERT);
        });
    });

    describe('getAssetProxy', () => {
        it('should return correct address of registered proxy', async () => {
            const prevProxyAddress = ZeroEx.NULL_ADDRESS;
            await assetProxyDispatcher.registerAssetProxy.sendTransactionAsync(
                AssetProxyId.ERC20,
                erc20Proxy.address,
                prevProxyAddress,
                { from: owner },
            );
            const proxyAddress = await assetProxyDispatcher.getAssetProxy.callAsync(AssetProxyId.ERC20);
            expect(proxyAddress).to.be.equal(erc20Proxy.address);
        });

        it('should return NULL address if requesting non-existent proxy', async () => {
            const proxyAddress = await assetProxyDispatcher.getAssetProxy.callAsync(AssetProxyId.ERC20);
            expect(proxyAddress).to.be.equal(ZeroEx.NULL_ADDRESS);
        });
    });

    describe('dispatchTransferFrom', () => {
        it('should dispatch transfer to registered proxy', async () => {
            // Register ERC20 proxy
            const prevProxyAddress = ZeroEx.NULL_ADDRESS;
            await assetProxyDispatcher.registerAssetProxy.sendTransactionAsync(
                AssetProxyId.ERC20,
                erc20Proxy.address,
                prevProxyAddress,
                { from: owner },
            );
            // Construct metadata for ERC20 proxy
            const encodedProxyMetadata = assetProxyUtils.encodeERC20ProxyData(zrxToken.address);
            // Perform a transfer from makerAddress to takerAddress
            const erc20Balances = await erc20Wrapper.getBalancesAsync();
            const amount = new BigNumber(10);
            await assetProxyDispatcher.publicDispatchTransferFrom.sendTransactionAsync(
                encodedProxyMetadata,
                makerAddress,
                takerAddress,
                amount,
                { from: owner },
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

        it('should throw if dispatching to unregistered proxy', async () => {
            // Construct metadata for ERC20 proxy
            const encodedProxyMetadata = assetProxyUtils.encodeERC20ProxyData(zrxToken.address);
            // Perform a transfer from makerAddress to takerAddress
            const erc20Balances = await erc20Wrapper.getBalancesAsync();
            const amount = new BigNumber(10);
            return expect(
                assetProxyDispatcher.publicDispatchTransferFrom.sendTransactionAsync(
                    encodedProxyMetadata,
                    makerAddress,
                    takerAddress,
                    amount,
                    { from: owner },
                ),
            ).to.be.rejectedWith(constants.REVERT);
        });
    });
});
