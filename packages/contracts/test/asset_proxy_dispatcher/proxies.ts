import { LogWithDecodedArgs, TransactionReceiptWithDecodedLogs, ZeroEx } from '0x.js';
import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import * as Web3 from 'web3';

import { AssetProxyDispatcherContract } from '../../src/contract_wrappers/generated/asset_proxy_dispatcher';
import { DummyERC721TokenContract } from '../../src/contract_wrappers/generated/dummy_e_r_c721_token';
import { DummyTokenContract } from '../../src/contract_wrappers/generated/dummy_token';
import { ERC20TransferProxyContract } from '../../src/contract_wrappers/generated/e_r_c20_transfer_proxy';
import { ERC721TransferProxyContract } from '../../src/contract_wrappers/generated/e_r_c721_transfer_proxy';
import { ERC20TransferProxy_v1Contract } from '../../src/contract_wrappers/generated/erc20transferproxy_v1';
import { TokenTransferProxyContract } from '../../src/contract_wrappers/generated/token_transfer_proxy';
import {
    encodeERC20ProxyMetadata,
    encodeERC20ProxyMetadata_V1,
    encodeERC721ProxyMetadata,
} from '../../src/utils/asset_proxy_utils';
import { Balances } from '../../src/utils/balances';
import { constants } from '../../src/utils/constants';
import { AssetProxyId, ContractName } from '../../src/utils/types';
import { chaiSetup } from '../utils/chai_setup';
import { deployer } from '../utils/deployer';
import { provider, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('Asset Transfer Proxies', () => {
    let owner: string;
    let notOwner: string;
    let assetProxyManagerAddress: string;
    let tokenOwner: string;
    let makerAddress: string;
    let takerAddress: string;
    let zrx: DummyTokenContract;
    let ck: DummyERC721TokenContract;
    let dmyBalances: Balances;
    let tokenTransferProxy: TokenTransferProxyContract;
    let assetProxyDispatcher: AssetProxyDispatcherContract;
    let erc20TransferProxyV1: ERC20TransferProxy_v1Contract;
    let erc20TransferProxy: ERC20TransferProxyContract;
    let erc721TransferProxy: ERC721TransferProxyContract;
    const nilAddress = '0x0000000000000000000000000000000000000000';
    const makerTokenId = new BigNumber('0x1010101010101010101010101010101010101010101010101010101010101010');
    const INITIAL_BALANCE = new BigNumber(10000);

    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        owner = tokenOwner = accounts[0];
        notOwner = accounts[1];
        assetProxyManagerAddress = accounts[2];
        makerAddress = accounts[3];
        takerAddress = accounts[4];
        const tokenTransferProxyInstance = await deployer.deployAsync(ContractName.TokenTransferProxy);
        tokenTransferProxy = new TokenTransferProxyContract(
            tokenTransferProxyInstance.abi,
            tokenTransferProxyInstance.address,
            provider,
        );

        const erc20TransferProxyV1Instance = await deployer.deployAsync(ContractName.ERC20TransferProxy_V1, [
            tokenTransferProxy.address,
        ]);
        erc20TransferProxyV1 = new ERC20TransferProxy_v1Contract(
            erc20TransferProxyV1Instance.abi,
            erc20TransferProxyV1Instance.address,
            provider,
        );

        const erc20TransferProxyInstance = await deployer.deployAsync(ContractName.ERC20TransferProxy);
        erc20TransferProxy = new ERC20TransferProxyContract(
            erc20TransferProxyInstance.abi,
            erc20TransferProxyInstance.address,
            provider,
        );

        const erc721TransferProxyInstance = await deployer.deployAsync(ContractName.ERC721TransferProxy);
        erc721TransferProxy = new ERC721TransferProxyContract(
            erc721TransferProxyInstance.abi,
            erc721TransferProxyInstance.address,
            provider,
        );

        const assetProxyDispatcherInstance = await deployer.deployAsync(ContractName.AssetProxyDispatcher);
        assetProxyDispatcher = new AssetProxyDispatcherContract(
            assetProxyDispatcherInstance.abi,
            assetProxyDispatcherInstance.address,
            provider,
        );

        const zrxInstance = await deployer.deployAsync(ContractName.DummyToken, constants.DUMMY_TOKEN_ARGS);
        zrx = new DummyTokenContract(zrxInstance.abi, zrxInstance.address, provider);
        await zrx.setBalance.sendTransactionAsync(makerAddress, INITIAL_BALANCE, { from: tokenOwner });
        await zrx.setBalance.sendTransactionAsync(takerAddress, INITIAL_BALANCE, { from: tokenOwner });
        dmyBalances = new Balances([zrx], [makerAddress, takerAddress]);
        await zrx.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_BALANCE, {
            from: takerAddress,
        });
        await zrx.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_BALANCE, {
            from: makerAddress,
        });
        await zrx.approve.sendTransactionAsync(erc20TransferProxy.address, INITIAL_BALANCE, {
            from: takerAddress,
        });
        await zrx.approve.sendTransactionAsync(erc20TransferProxy.address, INITIAL_BALANCE, {
            from: makerAddress,
        });

        const ckInstance = await deployer.deployAsync(ContractName.DummyERC721Token, constants.DUMMY_ERC721TOKEN_ARGS);
        ck = new DummyERC721TokenContract(ckInstance.abi, ckInstance.address, provider);
        await ck.setApprovalForAll.sendTransactionAsync(erc721TransferProxy.address, true, { from: makerAddress });
        await ck.setApprovalForAll.sendTransactionAsync(erc721TransferProxy.address, true, { from: takerAddress });
        await ck.mint.sendTransactionAsync(makerAddress, makerTokenId, { from: tokenOwner });
        await assetProxyDispatcher.addAuthorizedAddress.sendTransactionAsync(assetProxyManagerAddress, {
            from: accounts[0],
        });
        await erc20TransferProxyV1.addAuthorizedAddress.sendTransactionAsync(assetProxyManagerAddress, {
            from: accounts[0],
        });
        await erc20TransferProxy.addAuthorizedAddress.sendTransactionAsync(assetProxyManagerAddress, {
            from: accounts[0],
        });
        await erc721TransferProxy.addAuthorizedAddress.sendTransactionAsync(assetProxyManagerAddress, {
            from: accounts[0],
        });
        await tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(erc20TransferProxyV1.address, {
            from: accounts[0],
        });
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('Transfer Proxy - ERC20_V1', () => {
        it('should successfully encode/decode metadata', async () => {
            const metadata = await erc20TransferProxyV1.encodeMetadata.callAsync(AssetProxyId.ERC20_V1, zrx.address);
            const address = await erc20TransferProxyV1.decodeMetadata.callAsync(metadata);
            expect(address).to.be.equal(zrx.address);
        });

        it('should successfully decode metadata encoded by typescript helpers', async () => {
            const metadata = encodeERC20ProxyMetadata_V1(zrx.address);
            const address = await erc20TransferProxyV1.decodeMetadata.callAsync(metadata);
            expect(address).to.be.equal(zrx.address);
        });

        it('should successfully encode/decode metadata padded with zeros', async () => {
            const testAddress = '0x0000000000000000056000000000000000000010';
            const metadata = await erc20TransferProxyV1.encodeMetadata.callAsync(AssetProxyId.ERC20_V1, testAddress);
            const address = await erc20TransferProxyV1.decodeMetadata.callAsync(metadata);
            expect(address).to.be.equal(testAddress);
        });

        it('should successfully decode metadata encoded padded with zeros by typescript helpers', async () => {
            const testAddress = '0x0000000000000000056000000000000000000010';
            const metadata = encodeERC20ProxyMetadata_V1(testAddress);
            const address = await erc20TransferProxyV1.decodeMetadata.callAsync(metadata);
            expect(address).to.be.equal(testAddress);
        });

        it('should successfully transfer tokens', async () => {
            // Construct metadata for ERC20 proxy
            const encodedProxyMetadata = encodeERC20ProxyMetadata_V1(zrx.address);

            // Perform a transfer from makerAddress to takerAddress
            const balances = await dmyBalances.getAsync();
            const amount = new BigNumber(10);
            await erc20TransferProxyV1.transferFrom.sendTransactionAsync(
                encodedProxyMetadata,
                makerAddress,
                takerAddress,
                amount,
                { from: assetProxyManagerAddress },
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

        it('should throw if requesting address is not authorized', async () => {
            // Construct metadata for ERC20 proxy
            const encodedProxyMetadata = encodeERC20ProxyMetadata_V1(zrx.address);

            // Perform a transfer from makerAddress to takerAddress
            const balances = await dmyBalances.getAsync();
            const amount = new BigNumber(10);
            expect(
                erc20TransferProxyV1.transferFrom.sendTransactionAsync(
                    encodedProxyMetadata,
                    makerAddress,
                    takerAddress,
                    amount,
                    { from: notOwner },
                ),
            ).to.be.rejectedWith(constants.REVERT);
        });
    });

    describe('Transfer Proxy - ERC20', () => {
        it('should successfully encode/decode metadata', async () => {
            const metadata = await erc20TransferProxy.encodeMetadata.callAsync(AssetProxyId.ERC20, zrx.address);
            const address = await erc20TransferProxy.decodeMetadata.callAsync(metadata);
            expect(address).to.be.equal(zrx.address);
        });

        it('should successfully decode metadata encoded by typescript helpers', async () => {
            const metadata = encodeERC20ProxyMetadata(zrx.address);
            const address = await erc20TransferProxy.decodeMetadata.callAsync(metadata);
            expect(address).to.be.equal(zrx.address);
        });

        it('should successfully encode/decode metadata padded with zeros', async () => {
            const testAddress = '0x0000000000000000056000000000000000000010';
            const metadata = await erc20TransferProxy.encodeMetadata.callAsync(AssetProxyId.ERC20, testAddress);
            const address = await erc20TransferProxy.decodeMetadata.callAsync(metadata);
            expect(address).to.be.equal(testAddress);
        });

        it('should successfully decode metadata encoded padded with zeros by typescript helpers', async () => {
            const testAddress = '0x0000000000000000056000000000000000000010';
            const metadata = encodeERC20ProxyMetadata(testAddress);
            const address = await erc20TransferProxy.decodeMetadata.callAsync(metadata);
            expect(address).to.be.equal(testAddress);
        });

        it('should successfully transfer tokens', async () => {
            // Construct metadata for ERC20 proxy
            const encodedProxyMetadata = encodeERC20ProxyMetadata(zrx.address);

            // Perform a transfer from makerAddress to takerAddress
            const balances = await dmyBalances.getAsync();
            const amount = new BigNumber(10);
            await erc20TransferProxy.transferFrom.sendTransactionAsync(
                encodedProxyMetadata,
                makerAddress,
                takerAddress,
                amount,
                { from: assetProxyManagerAddress },
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

        it('should throw if requesting address is not authorized', async () => {
            // Construct metadata for ERC20 proxy
            const encodedProxyMetadata = encodeERC20ProxyMetadata(zrx.address);

            // Perform a transfer from makerAddress to takerAddress
            const balances = await dmyBalances.getAsync();
            const amount = new BigNumber(10);
            expect(
                erc20TransferProxy.transferFrom.sendTransactionAsync(
                    encodedProxyMetadata,
                    makerAddress,
                    takerAddress,
                    amount,
                    { from: notOwner },
                ),
            ).to.be.rejectedWith(constants.REVERT);
        });
    });

    describe('Transfer Proxy - ERC721', () => {
        it('should successfully encode/decode metadata', async () => {
            const metadata = await erc721TransferProxy.encodeMetadata.callAsync(
                AssetProxyId.ERC721,
                ck.address,
                makerTokenId,
            );
            const [address, tokenId] = await erc721TransferProxy.decodeMetadata.callAsync(metadata);
            expect(address).to.be.equal(ck.address);
            expect(tokenId).to.be.bignumber.equal(makerTokenId);
        });

        it('should successfully decode metadata encoded by typescript helpers', async () => {
            const metadata = encodeERC721ProxyMetadata(ck.address, makerTokenId);
            const [address, tokenId] = await erc721TransferProxy.decodeMetadata.callAsync(metadata);
            expect(address).to.be.equal(ck.address);
            expect(tokenId).to.be.bignumber.equal(makerTokenId);
        });

        it('should successfully encode/decode metadata padded with zeros', async () => {
            const testAddress = '0x0000000000000000056000000000000000000010';
            const metadata = await erc721TransferProxy.encodeMetadata.callAsync(
                AssetProxyId.ERC721,
                testAddress,
                makerTokenId,
            );
            const [address, tokenId] = await erc721TransferProxy.decodeMetadata.callAsync(metadata);
            expect(address).to.be.equal(testAddress);
            expect(tokenId).to.be.bignumber.equal(makerTokenId);
        });

        it('should successfully decode metadata encoded padded with zeros by typescript helpers', async () => {
            const testAddress = '0x0000000000000000056000000000000000000010';
            const metadata = encodeERC721ProxyMetadata(testAddress, makerTokenId);
            const [address, tokenId] = await erc721TransferProxy.decodeMetadata.callAsync(metadata);
            expect(address).to.be.equal(testAddress);
            expect(tokenId).to.be.bignumber.equal(makerTokenId);
        });

        it('should successfully transfer tokens', async () => {
            // Construct metadata for ERC20 proxy
            const encodedProxyMetadata = encodeERC721ProxyMetadata(ck.address, makerTokenId);

            // Verify pre-condition
            const ownerMakerToken = await ck.ownerOf.callAsync(makerTokenId);
            expect(ownerMakerToken).to.be.bignumber.equal(makerAddress);

            // Perform a transfer from makerAddress to takerAddress
            const balances = await dmyBalances.getAsync();
            const amount = new BigNumber(1);
            await erc721TransferProxy.transferFrom.sendTransactionAsync(
                encodedProxyMetadata,
                makerAddress,
                takerAddress,
                amount,
                { from: assetProxyManagerAddress },
            );

            // Verify transfer was successful
            const newOwnerMakerToken = await ck.ownerOf.callAsync(makerTokenId);
            expect(newOwnerMakerToken).to.be.bignumber.equal(takerAddress);
        });

        it('should throw if transferring 0 amount of a token', async () => {
            // Construct metadata for ERC20 proxy
            const encodedProxyMetadata = encodeERC721ProxyMetadata(ck.address, makerTokenId);

            // Verify pre-condition
            const ownerMakerToken = await ck.ownerOf.callAsync(makerTokenId);
            expect(ownerMakerToken).to.be.bignumber.equal(makerAddress);

            // Perform a transfer from makerAddress to takerAddress
            const balances = await dmyBalances.getAsync();
            const amount = new BigNumber(0);
            expect(
                erc20TransferProxy.transferFrom.sendTransactionAsync(
                    encodedProxyMetadata,
                    makerAddress,
                    takerAddress,
                    amount,
                    { from: notOwner },
                ),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if transferring >1 amount of a token', async () => {
            // Construct metadata for ERC20 proxy
            const encodedProxyMetadata = encodeERC721ProxyMetadata(ck.address, makerTokenId);

            // Verify pre-condition
            const ownerMakerToken = await ck.ownerOf.callAsync(makerTokenId);
            expect(ownerMakerToken).to.be.bignumber.equal(makerAddress);

            // Perform a transfer from makerAddress to takerAddress
            const balances = await dmyBalances.getAsync();
            const amount = new BigNumber(500);
            expect(
                erc20TransferProxy.transferFrom.sendTransactionAsync(
                    encodedProxyMetadata,
                    makerAddress,
                    takerAddress,
                    amount,
                    { from: notOwner },
                ),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if requesting address is not authorized', async () => {
            // Construct metadata for ERC20 proxy
            const encodedProxyMetadata = encodeERC721ProxyMetadata(zrx.address, makerTokenId);

            // Perform a transfer from makerAddress to takerAddress
            const balances = await dmyBalances.getAsync();
            const amount = new BigNumber(1);
            expect(
                erc20TransferProxy.transferFrom.sendTransactionAsync(
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
