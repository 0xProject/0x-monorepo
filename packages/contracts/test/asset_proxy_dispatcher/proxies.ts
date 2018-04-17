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
import { encodeERC20ProxyData, encodeERC721ProxyData } from '../../src/utils/asset_proxy_utils';
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
    let notAuthorized: string;
    let assetProxyDispatcherAddress: string;
    let tokenOwner: string;
    let makerAddress: string;
    let takerAddress: string;
    let zrx: DummyTokenContract;
    let erc721Token: DummyERC721TokenContract;
    let dmyBalances: Balances;
    let erc20Proxy: ERC20ProxyContract;
    let erc721Proxy: ERC721ProxyContract;
    const makerTokenId = new BigNumber('0x1010101010101010101010101010101010101010101010101010101010101010');
    const testAddressPaddedWithZeros = '0x0000000000000000056000000000000000000010';
    const INITIAL_BALANCE = new BigNumber(10000);

    before(async () => {
        // Setup accounts & addresses
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        owner = tokenOwner = accounts[0];
        notAuthorized = accounts[1];
        assetProxyDispatcherAddress = accounts[2];
        makerAddress = accounts[3];
        takerAddress = accounts[4];
        // Deploy ERC20 Proxy
        const erc20ProxyInstance = await deployer.deployAsync(ContractName.ERC20Proxy);
        erc20Proxy = new ERC20ProxyContract(erc20ProxyInstance.abi, erc20ProxyInstance.address, provider);
        await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(assetProxyDispatcherAddress, {
            from: owner,
        });
        // Deploy ERC721 Proxy
        const erc721ProxyInstance = await deployer.deployAsync(ContractName.ERC721Proxy);
        erc721Proxy = new ERC721ProxyContract(erc721ProxyInstance.abi, erc721ProxyInstance.address, provider);
        await erc721Proxy.addAuthorizedAddress.sendTransactionAsync(assetProxyDispatcherAddress, {
            from: owner,
        });
        // Deploy zrx and set initial balances
        const zrxInstance = await deployer.deployAsync(ContractName.DummyToken, constants.DUMMY_TOKEN_ARGS);
        zrx = new DummyTokenContract(zrxInstance.abi, zrxInstance.address, provider);
        await zrx.setBalance.sendTransactionAsync(makerAddress, INITIAL_BALANCE, { from: tokenOwner });
        await zrx.setBalance.sendTransactionAsync(takerAddress, INITIAL_BALANCE, { from: tokenOwner });
        dmyBalances = new Balances([zrx], [makerAddress, takerAddress]);
        await zrx.approve.sendTransactionAsync(erc20Proxy.address, INITIAL_BALANCE, {
            from: takerAddress,
        });
        await zrx.approve.sendTransactionAsync(erc20Proxy.address, INITIAL_BALANCE, {
            from: makerAddress,
        });
        // Deploy erc721Token and set initial balances
        const erc721TokenInstance = await deployer.deployAsync(
            ContractName.DummyERC721Token,
            constants.DUMMY_ERC721TOKEN_ARGS,
        );
        erc721Token = new DummyERC721TokenContract(erc721TokenInstance.abi, erc721TokenInstance.address, provider);
        await erc721Token.setApprovalForAll.sendTransactionAsync(erc721Proxy.address, true, {
            from: makerAddress,
        });
        await erc721Token.setApprovalForAll.sendTransactionAsync(erc721Proxy.address, true, {
            from: takerAddress,
        });
        await erc721Token.mint.sendTransactionAsync(makerAddress, makerTokenId, { from: tokenOwner });
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('Transfer Proxy - ERC20', () => {
        it('should successfully encode/decode metadata', async () => {
            const metadata = await erc20Proxy.encodeMetadata.callAsync(AssetProxyId.ERC20, zrx.address);
            const address = await erc20Proxy.decodeMetadata.callAsync(metadata);
            expect(address).to.be.equal(zrx.address);
        });

        it('should successfully decode metadata encoded by typescript helpers', async () => {
            const metadata = encodeERC20ProxyData(zrx.address);
            const address = await erc20Proxy.decodeMetadata.callAsync(metadata);
            expect(address).to.be.equal(zrx.address);
        });

        it('should successfully encode/decode metadata padded with zeros', async () => {
            const metadata = await erc20Proxy.encodeMetadata.callAsync(AssetProxyId.ERC20, testAddressPaddedWithZeros);
            const address = await erc20Proxy.decodeMetadata.callAsync(metadata);
            expect(address).to.be.equal(testAddressPaddedWithZeros);
        });

        it('should successfully decode metadata encoded padded with zeros by typescript helpers', async () => {
            const metadata = encodeERC20ProxyData(testAddressPaddedWithZeros);
            const address = await erc20Proxy.decodeMetadata.callAsync(metadata);
            expect(address).to.be.equal(testAddressPaddedWithZeros);
        });

        it('should successfully transfer tokens', async () => {
            // Construct metadata for ERC20 proxy
            const encodedProxyMetadata = encodeERC20ProxyData(zrx.address);
            // Perform a transfer from makerAddress to takerAddress
            const balances = await dmyBalances.getAsync();
            const amount = new BigNumber(10);
            await erc20Proxy.transferFrom.sendTransactionAsync(
                encodedProxyMetadata,
                makerAddress,
                takerAddress,
                amount,
                { from: assetProxyDispatcherAddress },
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

        it('should do nothing if transferring 0 amount of a token', async () => {
            // Construct metadata for ERC20 proxy
            const encodedProxyMetadata = encodeERC20ProxyData(zrx.address);
            // Perform a transfer from makerAddress to takerAddress
            const balances = await dmyBalances.getAsync();
            const amount = new BigNumber(0);
            await erc20Proxy.transferFrom.sendTransactionAsync(
                encodedProxyMetadata,
                makerAddress,
                takerAddress,
                amount,
                { from: assetProxyDispatcherAddress },
            );
            // Verify transfer was successful
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(balances[makerAddress][zrx.address]);
            expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(balances[takerAddress][zrx.address]);
        });

        it('should throw if allowances are too low', async () => {
            // Construct metadata for ERC20 proxy
            const encodedProxyMetadata = encodeERC20ProxyData(zrx.address);
            // Create allowance less than transfer amount. Set allowance on proxy.
            const allowance = new BigNumber(0);
            const transferAmount = new BigNumber(10);
            await zrx.approve.sendTransactionAsync(erc20Proxy.address, allowance, {
                from: makerAddress,
            });
            // Perform a transfer; expect this to fail.
            return expect(
                erc20Proxy.transferFrom.sendTransactionAsync(
                    encodedProxyMetadata,
                    makerAddress,
                    takerAddress,
                    transferAmount,
                    { from: notAuthorized },
                ),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if requesting address is not authorized', async () => {
            // Construct metadata for ERC20 proxy
            const encodedProxyMetadata = encodeERC20ProxyData(zrx.address);
            // Perform a transfer from makerAddress to takerAddress
            const amount = new BigNumber(10);
            return expect(
                erc20Proxy.transferFrom.sendTransactionAsync(encodedProxyMetadata, makerAddress, takerAddress, amount, {
                    from: notAuthorized,
                }),
            ).to.be.rejectedWith(constants.REVERT);
        });
    });

    describe('Transfer Proxy - ERC721', () => {
        it('should successfully encode/decode metadata', async () => {
            const metadata = await erc721Proxy.encodeMetadata.callAsync(
                AssetProxyId.ERC721,
                erc721Token.address,
                makerTokenId,
            );
            const [address, tokenId] = await erc721Proxy.decodeMetadata.callAsync(metadata);
            expect(address).to.be.equal(erc721Token.address);
            expect(tokenId).to.be.bignumber.equal(makerTokenId);
        });

        it('should successfully decode metadata encoded by typescript helpers', async () => {
            const metadata = encodeERC721ProxyData(erc721Token.address, makerTokenId);
            const [address, tokenId] = await erc721Proxy.decodeMetadata.callAsync(metadata);
            expect(address).to.be.equal(erc721Token.address);
            expect(tokenId).to.be.bignumber.equal(makerTokenId);
        });

        it('should successfully encode/decode metadata padded with zeros', async () => {
            const metadata = await erc721Proxy.encodeMetadata.callAsync(
                AssetProxyId.ERC721,
                testAddressPaddedWithZeros,
                makerTokenId,
            );
            const [address, tokenId] = await erc721Proxy.decodeMetadata.callAsync(metadata);
            expect(address).to.be.equal(testAddressPaddedWithZeros);
            expect(tokenId).to.be.bignumber.equal(makerTokenId);
        });

        it('should successfully decode metadata encoded padded with zeros by typescript helpers', async () => {
            const metadata = encodeERC721ProxyData(testAddressPaddedWithZeros, makerTokenId);
            const [address, tokenId] = await erc721Proxy.decodeMetadata.callAsync(metadata);
            expect(address).to.be.equal(testAddressPaddedWithZeros);
            expect(tokenId).to.be.bignumber.equal(makerTokenId);
        });

        it('should successfully transfer tokens', async () => {
            // Construct metadata for ERC721 proxy
            const encodedProxyMetadata = encodeERC721ProxyData(erc721Token.address, makerTokenId);
            // Verify pre-condition
            const ownerMakerToken = await erc721Token.ownerOf.callAsync(makerTokenId);
            expect(ownerMakerToken).to.be.bignumber.equal(makerAddress);
            // Perform a transfer from makerAddress to takerAddress
            const balances = await dmyBalances.getAsync();
            const amount = new BigNumber(1);
            await erc721Proxy.transferFrom.sendTransactionAsync(
                encodedProxyMetadata,
                makerAddress,
                takerAddress,
                amount,
                { from: assetProxyDispatcherAddress },
            );
            // Verify transfer was successful
            const newOwnerMakerToken = await erc721Token.ownerOf.callAsync(makerTokenId);
            expect(newOwnerMakerToken).to.be.bignumber.equal(takerAddress);
        });

        it('should throw if transferring 0 amount of a token', async () => {
            // Construct metadata for ERC721 proxy
            const encodedProxyMetadata = encodeERC721ProxyData(erc721Token.address, makerTokenId);
            // Verify pre-condition
            const ownerMakerToken = await erc721Token.ownerOf.callAsync(makerTokenId);
            expect(ownerMakerToken).to.be.bignumber.equal(makerAddress);
            // Perform a transfer from makerAddress to takerAddress
            const balances = await dmyBalances.getAsync();
            const amount = new BigNumber(0);
            return expect(
                erc721Proxy.transferFrom.sendTransactionAsync(
                    encodedProxyMetadata,
                    makerAddress,
                    takerAddress,
                    amount,
                    { from: assetProxyDispatcherAddress },
                ),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if transferring > 1 amount of a token', async () => {
            // Construct metadata for ERC721 proxy
            const encodedProxyMetadata = encodeERC721ProxyData(erc721Token.address, makerTokenId);
            // Verify pre-condition
            const ownerMakerToken = await erc721Token.ownerOf.callAsync(makerTokenId);
            expect(ownerMakerToken).to.be.bignumber.equal(makerAddress);
            // Perform a transfer from makerAddress to takerAddress
            const balances = await dmyBalances.getAsync();
            const amount = new BigNumber(500);
            return expect(
                erc721Proxy.transferFrom.sendTransactionAsync(
                    encodedProxyMetadata,
                    makerAddress,
                    takerAddress,
                    amount,
                    { from: assetProxyDispatcherAddress },
                ),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if allowances are too low', async () => {
            // Construct metadata for ERC721 proxy
            const encodedProxyMetadata = encodeERC721ProxyData(erc721Token.address, makerTokenId);
            // Remove transfer approval for makerAddress.
            await erc721Token.setApprovalForAll.sendTransactionAsync(erc721Proxy.address, false, {
                from: makerAddress,
            });
            // Perform a transfer; expect this to fail.
            const amount = new BigNumber(1);
            return expect(
                erc20Proxy.transferFrom.sendTransactionAsync(encodedProxyMetadata, makerAddress, takerAddress, amount, {
                    from: notAuthorized,
                }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if requesting address is not authorized', async () => {
            // Construct metadata for ERC721 proxy
            const encodedProxyMetadata = encodeERC721ProxyData(erc721Token.address, makerTokenId);
            // Perform a transfer from makerAddress to takerAddress
            const amount = new BigNumber(1);
            return expect(
                erc721Proxy.transferFrom.sendTransactionAsync(
                    encodedProxyMetadata,
                    makerAddress,
                    takerAddress,
                    amount,
                    { from: notAuthorized },
                ),
            ).to.be.rejectedWith(constants.REVERT);
        });
    });
});
