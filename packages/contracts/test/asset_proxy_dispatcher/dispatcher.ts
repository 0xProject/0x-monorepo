import { LogWithDecodedArgs, TransactionReceiptWithDecodedLogs, ZeroEx } from '0x.js';
import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import * as Web3 from 'web3';

import { AssetProxyDispatcherContract } from '../../src/contract_wrappers/generated/asset_proxy_dispatcher';
import { DummyERC721TokenContract } from '../../src/contract_wrappers/generated/dummy_e_r_c721_token';
import { DummyTokenContract } from '../../src/contract_wrappers/generated/dummy_token';
import { ERC20ProxyContract } from '../../src/contract_wrappers/generated/e_r_c20_proxy';
import { ERC721ProxyContract } from '../../src/contract_wrappers/generated/e_r_c721_proxy';
import { ERC20Proxy_v1Contract } from '../../src/contract_wrappers/generated/erc20proxy_v1';
import { TokenTransferProxyContract } from '../../src/contract_wrappers/generated/token_transfer_proxy';
import { encodeERC20ProxyData, encodeERC20V1ProxyData, encodeERC721ProxyData } from '../../src/utils/asset_proxy_utils';
import { Balances } from '../../src/utils/balances';
import { constants } from '../../src/utils/constants';
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
    let exchangeAddress: string;
    let tokenOwner: string;
    let makerAddress: string;
    let takerAddress: string;
    let zrx: DummyTokenContract;
    let dmyBalances: Balances;
    let tokenTransferProxy: TokenTransferProxyContract;
    let assetProxyDispatcher: AssetProxyDispatcherContract;
    let erc20TransferProxyV1: ERC20Proxy_v1Contract;
    let erc20TransferProxy: ERC20ProxyContract;
    let erc721TransferProxy: ERC721ProxyContract;
    const INITIAL_BALANCE = new BigNumber(10000);

    before(async () => {
        // Setup accounts & addresses
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        owner = tokenOwner = accounts[0];
        notOwner = accounts[1];
        exchangeAddress = accounts[2];
        makerAddress = accounts[3];
        takerAddress = accounts[4];
        // Deploy Asset Proxy Dispatcher
        const assetProxyDispatcherInstance = await deployer.deployAsync(ContractName.AssetProxyDispatcher);
        assetProxyDispatcher = new AssetProxyDispatcherContract(
            assetProxyDispatcherInstance.abi,
            assetProxyDispatcherInstance.address,
            provider,
        );
        await assetProxyDispatcher.addAuthorizedAddress.sendTransactionAsync(exchangeAddress, {
            from: accounts[0],
        });
        // Deploy TokenTransferProxy
        const tokenTransferProxyInstance = await deployer.deployAsync(ContractName.TokenTransferProxy);
        tokenTransferProxy = new TokenTransferProxyContract(
            tokenTransferProxyInstance.abi,
            tokenTransferProxyInstance.address,
            provider,
        );
        // Deploy ERC20 V1 Proxy
        const erc20TransferProxyV1Instance = await deployer.deployAsync(ContractName.ERC20V1Proxy, [
            tokenTransferProxy.address,
        ]);
        erc20TransferProxyV1 = new ERC20Proxy_v1Contract(
            erc20TransferProxyV1Instance.abi,
            erc20TransferProxyV1Instance.address,
            provider,
        );
        await erc20TransferProxyV1.addAuthorizedAddress.sendTransactionAsync(assetProxyDispatcher.address, {
            from: accounts[0],
        });
        await tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(erc20TransferProxyV1.address, {
            from: accounts[0],
        });
        // Deploy ERC20 Proxy
        const erc20TransferProxyInstance = await deployer.deployAsync(ContractName.ERC20Proxy);
        erc20TransferProxy = new ERC20ProxyContract(
            erc20TransferProxyInstance.abi,
            erc20TransferProxyInstance.address,
            provider,
        );
        await erc20TransferProxy.addAuthorizedAddress.sendTransactionAsync(assetProxyDispatcher.address, {
            from: accounts[0],
        });
        // Deploy ERC721 Proxy
        const erc721TransferProxyInstance = await deployer.deployAsync(ContractName.ERC721Proxy);
        erc721TransferProxy = new ERC721ProxyContract(
            erc721TransferProxyInstance.abi,
            erc721TransferProxyInstance.address,
            provider,
        );
        await erc721TransferProxy.addAuthorizedAddress.sendTransactionAsync(assetProxyDispatcher.address, {
            from: accounts[0],
        });
        // Deploy zrx and set initial balances
        const zrxInstance = await deployer.deployAsync(ContractName.DummyToken, constants.DUMMY_TOKEN_ARGS);
        zrx = new DummyTokenContract(zrxInstance.abi, zrxInstance.address, provider);
        await zrx.setBalance.sendTransactionAsync(makerAddress, INITIAL_BALANCE, { from: tokenOwner });
        await zrx.setBalance.sendTransactionAsync(takerAddress, INITIAL_BALANCE, { from: tokenOwner });
        dmyBalances = new Balances([zrx], [makerAddress, takerAddress]);
        await zrx.approve.sendTransactionAsync(erc20TransferProxy.address, INITIAL_BALANCE, {
            from: takerAddress,
        });
        await zrx.approve.sendTransactionAsync(erc20TransferProxy.address, INITIAL_BALANCE, {
            from: makerAddress,
        });
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('addAssetProxy', () => {
        it('should record proxy upon registration', async () => {
            await assetProxyDispatcher.addAssetProxy.sendTransactionAsync(
                AssetProxyId.ERC20,
                erc20TransferProxy.address,
                ZeroEx.NULL_ADDRESS,
                { from: owner },
            );
            const proxyAddress = await assetProxyDispatcher.getAssetProxy.callAsync(AssetProxyId.ERC20);
            expect(proxyAddress).to.be.equal(erc20TransferProxy.address);
        });

        it('should be able to record multiple proxies', async () => {
            // Record first proxy
            await assetProxyDispatcher.addAssetProxy.sendTransactionAsync(
                AssetProxyId.ERC20,
                erc20TransferProxy.address,
                ZeroEx.NULL_ADDRESS,
                { from: owner },
            );
            let proxyAddress = await assetProxyDispatcher.getAssetProxy.callAsync(AssetProxyId.ERC20);
            expect(proxyAddress).to.be.equal(erc20TransferProxy.address);
            // Record another proxy
            await assetProxyDispatcher.addAssetProxy.sendTransactionAsync(
                AssetProxyId.ERC721,
                erc721TransferProxy.address,
                ZeroEx.NULL_ADDRESS,
                { from: owner },
            );
            proxyAddress = await assetProxyDispatcher.getAssetProxy.callAsync(AssetProxyId.ERC721);
            expect(proxyAddress).to.be.equal(erc721TransferProxy.address);
        });

        it('should replace proxy address upon re-registration', async () => {
            // Initial registration
            await assetProxyDispatcher.addAssetProxy.sendTransactionAsync(
                AssetProxyId.ERC20,
                erc20TransferProxy.address,
                ZeroEx.NULL_ADDRESS,
                { from: owner },
            );
            let proxyAddress = await assetProxyDispatcher.getAssetProxy.callAsync(AssetProxyId.ERC20);
            expect(proxyAddress).to.be.equal(erc20TransferProxy.address);
            // Deploy a new version of the ERC20 Transfer Proxy contract
            const newErc20TransferProxyInstance = await deployer.deployAsync(ContractName.ERC20Proxy);
            const newErc20TransferProxy = new ERC20ProxyContract(
                newErc20TransferProxyInstance.abi,
                newErc20TransferProxyInstance.address,
                provider,
            );
            // Register new ERC20 Transfer Proxy contract
            const newAddress = newErc20TransferProxy.address;
            const currentAddress = erc20TransferProxy.address;
            await assetProxyDispatcher.addAssetProxy.sendTransactionAsync(
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
            await assetProxyDispatcher.addAssetProxy.sendTransactionAsync(
                AssetProxyId.ERC20,
                erc20TransferProxy.address,
                ZeroEx.NULL_ADDRESS,
                { from: owner },
            );
            const proxyAddress = await assetProxyDispatcher.getAssetProxy.callAsync(AssetProxyId.ERC20);
            expect(proxyAddress).to.be.equal(erc20TransferProxy.address);
            // The following transaction will throw because the currentAddress is no longer ZeroEx.NULL_ADDRESS
            return expect(
                assetProxyDispatcher.addAssetProxy.sendTransactionAsync(
                    AssetProxyId.ERC20,
                    erc20TransferProxy.address,
                    ZeroEx.NULL_ADDRESS,
                    { from: owner },
                ),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should be able to reset proxy address to NULL', async () => {
            // Initial registration
            await assetProxyDispatcher.addAssetProxy.sendTransactionAsync(
                AssetProxyId.ERC20,
                erc20TransferProxy.address,
                ZeroEx.NULL_ADDRESS,
                { from: owner },
            );
            const proxyAddress = await assetProxyDispatcher.getAssetProxy.callAsync(AssetProxyId.ERC20);
            expect(proxyAddress).to.be.equal(erc20TransferProxy.address);
            // The following transaction will reset the proxy address
            await assetProxyDispatcher.addAssetProxy.sendTransactionAsync(
                AssetProxyId.ERC20,
                ZeroEx.NULL_ADDRESS,
                erc20TransferProxy.address,
                { from: owner },
            );
            const newProxyAddress = await assetProxyDispatcher.getAssetProxy.callAsync(AssetProxyId.ERC20);
            expect(newProxyAddress).to.be.equal(ZeroEx.NULL_ADDRESS);
        });

        it('should throw if requesting address is not owner', async () => {
            return expect(
                assetProxyDispatcher.addAssetProxy.sendTransactionAsync(
                    AssetProxyId.ERC20,
                    erc20TransferProxy.address,
                    ZeroEx.NULL_ADDRESS,
                    { from: notOwner },
                ),
            ).to.be.rejectedWith(constants.REVERT);
        });
    });

    describe('getAssetProxy', () => {
        it('should return correct address of registered proxy', async () => {
            await assetProxyDispatcher.addAssetProxy.sendTransactionAsync(
                AssetProxyId.ERC20,
                erc20TransferProxy.address,
                ZeroEx.NULL_ADDRESS,
                { from: owner },
            );
            const proxyAddress = await assetProxyDispatcher.getAssetProxy.callAsync(AssetProxyId.ERC20);
            expect(proxyAddress).to.be.equal(erc20TransferProxy.address);
        });

        it('should return NULL address if requesting non-existent proxy', async () => {
            const proxyAddress = await assetProxyDispatcher.getAssetProxy.callAsync(AssetProxyId.ERC20);
            expect(proxyAddress).to.be.equal(ZeroEx.NULL_ADDRESS);
        });
    });

    describe('transferFrom', () => {
        it('should dispatch transfer to registered proxy', async () => {
            // Register ERC20 proxy
            await assetProxyDispatcher.addAssetProxy.sendTransactionAsync(
                AssetProxyId.ERC20,
                erc20TransferProxy.address,
                ZeroEx.NULL_ADDRESS,
                { from: owner },
            );
            // Construct metadata for ERC20 proxy
            const encodedProxyMetadata = encodeERC20ProxyData(zrx.address);
            // Perform a transfer from makerAddress to takerAddress
            const balances = await dmyBalances.getAsync();
            const amount = new BigNumber(10);
            await assetProxyDispatcher.transferFrom.sendTransactionAsync(
                encodedProxyMetadata,
                makerAddress,
                takerAddress,
                amount,
                { from: exchangeAddress },
            );
            // Verify transfer was successful
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                balances[makerAddress][zrx.address].minus(amount),
            );
            expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                balances[takerAddress][zrx.address].add(amount),
            );
        });

        it('should throw if dispatching to unregistered proxy', async () => {
            // Construct metadata for ERC20 proxy
            const encodedProxyMetadata = encodeERC20ProxyData(zrx.address);
            // Perform a transfer from makerAddress to takerAddress
            const balances = await dmyBalances.getAsync();
            const amount = new BigNumber(10);
            return expect(
                assetProxyDispatcher.transferFrom.sendTransactionAsync(
                    encodedProxyMetadata,
                    makerAddress,
                    takerAddress,
                    amount,
                    { from: exchangeAddress },
                ),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if requesting address is not authorized', async () => {
            // Register ERC20 proxy
            await assetProxyDispatcher.addAssetProxy.sendTransactionAsync(
                AssetProxyId.ERC20,
                erc20TransferProxy.address,
                ZeroEx.NULL_ADDRESS,
                { from: owner },
            );
            // Construct metadata for ERC20 proxy
            const encodedProxyMetadata = encodeERC20ProxyData(zrx.address);
            // Perform a transfer from makerAddress to takerAddress
            const balances = await dmyBalances.getAsync();
            const amount = new BigNumber(10);
            return expect(
                assetProxyDispatcher.transferFrom.sendTransactionAsync(
                    encodedProxyMetadata,
                    makerAddress,
                    takerAddress,
                    amount,
                    { from: notOwner },
                ),
            ).to.be.rejectedWith(constants.REVERT);
        });
    });
});
