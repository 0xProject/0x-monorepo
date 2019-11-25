import * as chai from 'chai';
import { LogWithDecodedArgs } from 'ethereum-types';
import * as crypto from 'crypto';

import {
    artifacts as proxyArtifacts,
    ERC1155ProxyContract,
    ERC20ProxyContract,
    ERC721ProxyContract,
    MultiAssetProxyContract,
    StaticCallProxyContract,
    TestStaticCallTargetContract,
} from '@0x/contracts-asset-proxy';
import {
    artifacts as erc1155Artifacts,
    ERC1155MintableContract,
    ERC1155TransferSingleEventArgs,
} from '@0x/contracts-erc1155';
import { artifacts as erc20Artifacts, DummyERC20TokenContract } from '@0x/contracts-erc20';
import { artifacts as erc721Artifacts, DummyERC721TokenContract } from '@0x/contracts-erc721';
import { artifacts as exchangeArtifacts, ExchangeContract } from '@0x/contracts-exchange';
import { chaiSetup, constants, LogDecoder, provider, txDefaults, web3Wrapper } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { AssetProxyId } from '@0x/types';
import { BigNumber, providerUtils, StringRevertError, LibBytesRevertErrors } from '@0x/utils';
import * as ethUtil from 'ethereumjs-util';

import { artifacts, LibAssetDataContract } from '@0x/contracts-dev-utils';

chaiSetup.configure();
const expect = chai.expect;

const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

const KNOWN_ERC20_ENCODING = {
    address: '0x1dc4c1cefef38a777b15aa20260a54e584b16c48',
    assetData: '0xf47261b00000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c48',
};
const KNOWN_ERC721_ENCODING = {
    address: '0x1dc4c1cefef38a777b15aa20260a54e584b16c48',
    tokenId: new BigNumber(1),
    assetData:
        '0x025717920000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c480000000000000000000000000000000000000000000000000000000000000001',
};
const KNOWN_ERC1155_ENCODING = {
    tokenAddress: '0x1dc4c1cefef38a777b15aa20260a54e584b16c48',
    tokenIds: [new BigNumber(100), new BigNumber(1001), new BigNumber(10001)],
    tokenValues: [new BigNumber(200), new BigNumber(2001), new BigNumber(20001)],
    callbackData:
        '0x025717920000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c480000000000000000000000000000000000000000000000000000000000000001',
    assetData:
        '0xa7cb5fb70000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c480000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001800000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000003e90000000000000000000000000000000000000000000000000000000000002711000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000c800000000000000000000000000000000000000000000000000000000000007d10000000000000000000000000000000000000000000000000000000000004e210000000000000000000000000000000000000000000000000000000000000044025717920000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c48000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000',
};
const KNOWN_MULTI_ASSET_ENCODING = {
    amounts: [new BigNumber(70), new BigNumber(1), new BigNumber(18)],
    nestedAssetData: [
        KNOWN_ERC20_ENCODING.assetData,
        KNOWN_ERC721_ENCODING.assetData,
        KNOWN_ERC1155_ENCODING.assetData,
    ],
    assetData:
        '0x94cfcdd7000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000046000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000024f47261b00000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c48000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044025717920000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c480000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000204a7cb5fb70000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c480000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001800000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000003e90000000000000000000000000000000000000000000000000000000000002711000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000c800000000000000000000000000000000000000000000000000000000000007d10000000000000000000000000000000000000000000000000000000000004e210000000000000000000000000000000000000000000000000000000000000044025717920000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c4800000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
};
const KNOWN_STATIC_CALL_ENCODING = {
    staticCallTargetAddress: '0x6dfff22588be9b3ef8cf0ad6dc9b84796f9fb45f',
    staticCallData: '0xed2cfc9c0000000000000000000000000000000000000000000000000000000000000001',
    expectedReturnDataHash: '0xb10e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d9fcbe2b7fa0cf6',
    assetData:
        '0xc339d10a0000000000000000000000006dfff22588be9b3ef8cf0ad6dc9b84796f9fb45f0000000000000000000000000000000000000000000000000000000000000060b10e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d9fcbe2b7fa0cf60000000000000000000000000000000000000000000000000000000000000024ed2cfc9c000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000',
};

describe('LibAssetData', () => {
    let exchange: ExchangeContract;
    let erc20Proxy: ERC20ProxyContract;
    let erc721Proxy: ERC721ProxyContract;
    let erc1155Proxy: ERC1155ProxyContract;
    let multiAssetProxy: MultiAssetProxyContract;
    let staticCallProxy: StaticCallProxyContract;
    let staticCallTarget: TestStaticCallTargetContract;
    let libAssetData: LibAssetDataContract;

    let tokenOwnerAddress: string;

    let erc20Token: DummyERC20TokenContract;
    let erc721Token: DummyERC721TokenContract;
    let erc1155Token: ERC1155MintableContract;

    const erc20TokenTotalSupply = new BigNumber(1);

    const firstERC721TokenId = new BigNumber(1);
    const numberOfERC721Tokens = 10;

    let erc1155TokenId: BigNumber;

    before(async () => {
        await blockchainLifecycle.startAsync();
        const chainId = await providerUtils.getChainIdAsync(provider);
        exchange = await ExchangeContract.deployFrom0xArtifactAsync(
            exchangeArtifacts.Exchange,
            provider,
            txDefaults,
            {},
            new BigNumber(chainId),
        );

        erc20Proxy = await ERC20ProxyContract.deployFrom0xArtifactAsync(
            proxyArtifacts.ERC20Proxy,
            provider,
            txDefaults,
            artifacts,
        );
        erc721Proxy = await ERC721ProxyContract.deployFrom0xArtifactAsync(
            proxyArtifacts.ERC721Proxy,
            provider,
            txDefaults,
            artifacts,
        );
        erc1155Proxy = await ERC1155ProxyContract.deployFrom0xArtifactAsync(
            proxyArtifacts.ERC1155Proxy,
            provider,
            txDefaults,
            artifacts,
        );
        multiAssetProxy = await MultiAssetProxyContract.deployFrom0xArtifactAsync(
            proxyArtifacts.MultiAssetProxy,
            provider,
            txDefaults,
            artifacts,
        );
        staticCallProxy = await StaticCallProxyContract.deployFrom0xArtifactAsync(
            proxyArtifacts.StaticCallProxy,
            provider,
            txDefaults,
            artifacts,
        );

        await exchange.registerAssetProxy(erc20Proxy.address).awaitTransactionSuccessAsync();
        await exchange.registerAssetProxy(erc721Proxy.address).awaitTransactionSuccessAsync();
        await exchange.registerAssetProxy(erc1155Proxy.address).awaitTransactionSuccessAsync();
        await exchange.registerAssetProxy(multiAssetProxy.address).awaitTransactionSuccessAsync();
        await exchange.registerAssetProxy(staticCallProxy.address).awaitTransactionSuccessAsync();

        libAssetData = await LibAssetDataContract.deployFrom0xArtifactAsync(
            artifacts.LibAssetData,
            provider,
            txDefaults,
            artifacts,
            exchange.address,
        );

        staticCallTarget = await TestStaticCallTargetContract.deployFrom0xArtifactAsync(
            proxyArtifacts.TestStaticCallTarget,
            provider,
            txDefaults,
            artifacts,
        );

        [tokenOwnerAddress] = await web3Wrapper.getAvailableAddressesAsync();

        erc20Token = await DummyERC20TokenContract.deployFrom0xArtifactAsync(
            erc20Artifacts.DummyERC20Token,
            provider,
            txDefaults,
            artifacts,
            'Dummy',
            'DUM',
            new BigNumber(1),
            erc20TokenTotalSupply,
        );

        erc721Token = await DummyERC721TokenContract.deployFrom0xArtifactAsync(
            erc721Artifacts.DummyERC721Token,
            provider,
            txDefaults,
            artifacts,
            'Dummy',
            'DUM',
        );
        // mint `numberOfERC721Tokens` tokens
        const transactionMinedPromises = [];
        for (let i = 0; i < numberOfERC721Tokens; i++) {
            transactionMinedPromises.push(
                erc721Token.mint(tokenOwnerAddress, firstERC721TokenId.plus(i - 1)).awaitTransactionSuccessAsync(),
            );
        }
        await Promise.all(transactionMinedPromises);

        erc1155Token = await ERC1155MintableContract.deployFrom0xArtifactAsync(
            erc1155Artifacts.ERC1155Mintable,
            provider,
            txDefaults,
            artifacts,
        );

        const logDecoder = new LogDecoder(web3Wrapper, erc1155Artifacts);
        const transactionReceipt = await logDecoder.getTxWithDecodedLogsAsync(
            await erc1155Token.create('uri:Dummy', /*isNonFungible:*/ false).sendTransactionAsync(),
        );

        // tslint:disable-next-line no-unnecessary-type-assertion
        erc1155TokenId = (transactionReceipt.logs[0] as LogWithDecodedArgs<ERC1155TransferSingleEventArgs>).args.id;
        await erc1155Token
            .mintFungible(erc1155TokenId, [tokenOwnerAddress], [new BigNumber(1)])
            .awaitTransactionSuccessAsync();
    });

    after(async () => {
        await blockchainLifecycle.revertAsync();
    });

    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    it('should have a deployed-to address', () => {
        expect(libAssetData.address.slice(0, 2)).to.equal('0x');
    });

    describe('encoding and decoding', () => {
        it('should decode any asset proxy ID', async () => {
            const assetDataScenarios = [
                [KNOWN_ERC20_ENCODING.assetData, AssetProxyId.ERC20],
                [KNOWN_ERC721_ENCODING.assetData, AssetProxyId.ERC721],
                [KNOWN_ERC1155_ENCODING.assetData, AssetProxyId.ERC1155],
                [KNOWN_MULTI_ASSET_ENCODING.assetData, AssetProxyId.MultiAsset],
            ];

            for (const [assetData, proxyId] of assetDataScenarios) {
                expect(await libAssetData.decodeAssetProxyId(assetData).callAsync()).to.equal(proxyId);
            }
        });
        it('should encode ERC20 asset data', async () => {
            expect(await libAssetData.encodeERC20AssetData(KNOWN_ERC20_ENCODING.address).callAsync()).to.equal(
                KNOWN_ERC20_ENCODING.assetData,
            );
        });

        it('should decode ERC20 asset data', async () => {
            expect(await libAssetData.decodeERC20AssetData(KNOWN_ERC20_ENCODING.assetData).callAsync()).to.deep.equal([
                AssetProxyId.ERC20,
                KNOWN_ERC20_ENCODING.address,
            ]);
        });

        it('should encode ERC721 asset data', async () => {
            expect(
                await libAssetData
                    .encodeERC721AssetData(KNOWN_ERC721_ENCODING.address, KNOWN_ERC721_ENCODING.tokenId)
                    .callAsync(),
            ).to.equal(KNOWN_ERC721_ENCODING.assetData);
        });

        it('should decode ERC721 asset data', async () => {
            expect(await libAssetData.decodeERC721AssetData(KNOWN_ERC721_ENCODING.assetData).callAsync()).to.deep.equal(
                [AssetProxyId.ERC721, KNOWN_ERC721_ENCODING.address, KNOWN_ERC721_ENCODING.tokenId],
            );
        });

        it('should encode ERC1155 asset data', async () => {
            expect(
                await libAssetData
                    .encodeERC1155AssetData(
                        KNOWN_ERC1155_ENCODING.tokenAddress,
                        KNOWN_ERC1155_ENCODING.tokenIds,
                        KNOWN_ERC1155_ENCODING.tokenValues,
                        KNOWN_ERC1155_ENCODING.callbackData,
                    )
                    .callAsync(),
            ).to.equal(KNOWN_ERC1155_ENCODING.assetData);
        });

        it('should decode ERC1155 asset data', async () => {
            expect(
                await libAssetData.decodeERC1155AssetData(KNOWN_ERC1155_ENCODING.assetData).callAsync(),
            ).to.deep.equal([
                AssetProxyId.ERC1155,
                KNOWN_ERC1155_ENCODING.tokenAddress,
                KNOWN_ERC1155_ENCODING.tokenIds,
                KNOWN_ERC1155_ENCODING.tokenValues,
                KNOWN_ERC1155_ENCODING.callbackData,
            ]);
        });

        it('should encode multiasset data', async () => {
            expect(
                await libAssetData
                    .encodeMultiAssetData(
                        KNOWN_MULTI_ASSET_ENCODING.amounts,
                        KNOWN_MULTI_ASSET_ENCODING.nestedAssetData,
                    )
                    .callAsync(),
            ).to.equal(KNOWN_MULTI_ASSET_ENCODING.assetData);
        });

        it('should decode multiasset data', async () => {
            expect(
                await libAssetData.decodeMultiAssetData(KNOWN_MULTI_ASSET_ENCODING.assetData).callAsync(),
            ).to.deep.equal([
                AssetProxyId.MultiAsset,
                KNOWN_MULTI_ASSET_ENCODING.amounts,
                KNOWN_MULTI_ASSET_ENCODING.nestedAssetData,
            ]);
        });

        it('should encode StaticCall data', async () => {
            expect(
                await libAssetData
                    .encodeStaticCallAssetData(
                        KNOWN_STATIC_CALL_ENCODING.staticCallTargetAddress,
                        KNOWN_STATIC_CALL_ENCODING.staticCallData,
                        KNOWN_STATIC_CALL_ENCODING.expectedReturnDataHash,
                    )
                    .callAsync(),
            ).to.equal(KNOWN_STATIC_CALL_ENCODING.assetData);
        });

        it('should decode StaticCall data', async () => {
            expect(
                await libAssetData.decodeStaticCallAssetData(KNOWN_STATIC_CALL_ENCODING.assetData).callAsync(),
            ).to.deep.equal([
                AssetProxyId.StaticCall,
                KNOWN_STATIC_CALL_ENCODING.staticCallTargetAddress,
                KNOWN_STATIC_CALL_ENCODING.staticCallData,
                KNOWN_STATIC_CALL_ENCODING.expectedReturnDataHash,
            ]);
        });
    });
    describe('revertIfInvalidAssetData', async () => {
        it('should succeed for any valid asset data', async () => {
            const assetData = [
                KNOWN_ERC20_ENCODING.assetData,
                KNOWN_ERC721_ENCODING.assetData,
                KNOWN_ERC1155_ENCODING.assetData,
                KNOWN_MULTI_ASSET_ENCODING.assetData,
                KNOWN_STATIC_CALL_ENCODING.assetData,
            ];

            for (const data of assetData) {
                await libAssetData.revertIfInvalidAssetData(data).callAsync();
            }
            return;
        });

        it('should revert for invalid assetProxyId', async () => {
            const badAssetData = '0x' + crypto.randomBytes(4).toString('hex') + constants.NULL_ADDRESS;
            await expect(libAssetData.revertIfInvalidAssetData(badAssetData).callAsync()).to.eventually.be.rejectedWith(
                StringRevertError,
            );
        });

        it('should revert for invalid assetData with valid assetProxyId', async () => {
            // the other encodings are always valid if the assetProxyId is valid
            const assetData = [KNOWN_ERC20_ENCODING.assetData, KNOWN_ERC721_ENCODING.assetData];

            for (const data of assetData) {
                const badData = data.substring(0, data.length - 2); // drop one byte but retain assetProxyId
                await expect(libAssetData.revertIfInvalidAssetData(badData).callAsync()).to.eventually.be.rejectedWith(
                    LibBytesRevertErrors.InvalidByteOperationError,
                );
            }
        });
    });

    describe('getBalance', () => {
        it('should query ERC20 balance by asset data', async () => {
            const assetData = await libAssetData.encodeERC20AssetData(erc20Token.address).callAsync();
            expect(await libAssetData.getBalance(tokenOwnerAddress, assetData).callAsync()).to.bignumber.equal(
                erc20TokenTotalSupply,
            );
        });

        it('should return 0 if ERC20 token does not exist', async () => {
            const assetData = await libAssetData.encodeERC20AssetData(constants.NULL_ADDRESS).callAsync();
            const balance = await libAssetData.getBalance(tokenOwnerAddress, assetData).callAsync();
            expect(balance).to.bignumber.equal(constants.ZERO_AMOUNT);
        });

        it('should query ERC721 balance by asset data', async () => {
            const assetData = await libAssetData
                .encodeERC721AssetData(erc721Token.address, firstERC721TokenId)
                .callAsync();
            expect(await libAssetData.getBalance(tokenOwnerAddress, assetData).callAsync()).to.bignumber.equal(1);
        });

        it('should return 0 if ERC721 token does not exist', async () => {
            const assetData = await libAssetData
                .encodeERC721AssetData(constants.NULL_ADDRESS, firstERC721TokenId)
                .callAsync();
            const balance = await libAssetData.getBalance(tokenOwnerAddress, assetData).callAsync();
            expect(balance).to.bignumber.equal(constants.ZERO_AMOUNT);
        });

        it('should query ERC1155 balances by asset data', async () => {
            const assetData = await libAssetData
                .encodeERC1155AssetData(
                    erc1155Token.address,
                    [erc1155TokenId],
                    [new BigNumber(1)],
                    constants.NULL_BYTES,
                )
                .callAsync();
            expect(await libAssetData.getBalance(tokenOwnerAddress, assetData).callAsync()).to.bignumber.equal(1);
        });

        it('should return 0 if ERC1155 token does not exist', async () => {
            const assetData = await libAssetData
                .encodeERC1155AssetData(
                    constants.NULL_ADDRESS,
                    [erc1155TokenId],
                    [new BigNumber(1)],
                    constants.NULL_BYTES,
                )
                .callAsync();
            const balance = await libAssetData.getBalance(tokenOwnerAddress, assetData).callAsync();
            expect(balance).to.bignumber.equal(constants.ZERO_AMOUNT);
        });

        it('should query multi-asset batch balance by asset data', async () => {
            const assetData = await libAssetData
                .encodeMultiAssetData(
                    [new BigNumber(1), new BigNumber(1)],
                    [
                        await libAssetData.encodeERC20AssetData(erc20Token.address).callAsync(),
                        await libAssetData.encodeERC721AssetData(erc721Token.address, firstERC721TokenId).callAsync(),
                    ],
                )
                .callAsync();
            expect(await libAssetData.getBalance(tokenOwnerAddress, assetData).callAsync()).to.bignumber.equal(
                Math.min(erc20TokenTotalSupply.toNumber(), numberOfERC721Tokens),
            );
        });

        it('should return a balance of 0 if the assetData does not correspond to an AssetProxy contract', async () => {
            const fakeAssetData = '0x01020304';
            const balance = await libAssetData.getBalance(tokenOwnerAddress, fakeAssetData).callAsync();
            expect(balance).to.bignumber.equal(constants.ZERO_AMOUNT);
        });

        it('should return a balance of MAX_UINT256 if the the StaticCallProxy assetData contains data for a successful staticcall', async () => {
            const staticCallData = staticCallTarget.isOddNumber(new BigNumber(1)).getABIEncodedTransactionData();
            const trueAsBuffer = ethUtil.toBuffer('0x0000000000000000000000000000000000000000000000000000000000000001');
            const expectedResultHash = ethUtil.bufferToHex(ethUtil.sha3(trueAsBuffer));
            const assetData = await libAssetData
                .encodeStaticCallAssetData(staticCallTarget.address, staticCallData, expectedResultHash)
                .callAsync();
            const balance = await libAssetData.getBalance(tokenOwnerAddress, assetData).callAsync();
            expect(balance).to.bignumber.equal(constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS);
        });

        it('should return a balance of 0 if the the StaticCallProxy assetData contains data for an unsuccessful staticcall', async () => {
            const staticCallData = staticCallTarget.isOddNumber(new BigNumber(0)).getABIEncodedTransactionData();
            const trueAsBuffer = ethUtil.toBuffer('0x0000000000000000000000000000000000000000000000000000000000000001');
            const expectedResultHash = ethUtil.bufferToHex(ethUtil.sha3(trueAsBuffer));
            const assetData = await libAssetData
                .encodeStaticCallAssetData(staticCallTarget.address, staticCallData, expectedResultHash)
                .callAsync();
            const balance = await libAssetData.getBalance(tokenOwnerAddress, assetData).callAsync();
            expect(balance).to.bignumber.equal(constants.ZERO_AMOUNT);
        });
    });

    describe('getAssetProxyAllowance', () => {
        it('should query ERC20 allowances by asset data', async () => {
            const allowance = new BigNumber(1);
            await erc20Token.approve(erc20Proxy.address, allowance).awaitTransactionSuccessAsync({
                from: tokenOwnerAddress,
            });
            const assetData = await libAssetData.encodeERC20AssetData(erc20Token.address).callAsync();
            expect(
                await libAssetData.getAssetProxyAllowance(tokenOwnerAddress, assetData).callAsync(),
            ).to.bignumber.equal(allowance);
        });

        it('should query ERC721 approval by asset data', async () => {
            await erc721Token.approve(erc721Proxy.address, firstERC721TokenId).awaitTransactionSuccessAsync({
                from: tokenOwnerAddress,
            });
            const assetData = await libAssetData
                .encodeERC721AssetData(erc721Token.address, firstERC721TokenId)
                .callAsync();
            expect(
                await libAssetData.getAssetProxyAllowance(tokenOwnerAddress, assetData).callAsync(),
            ).to.bignumber.equal(1);
        });

        it('should query ERC721 approvalForAll by assetData', async () => {
            await erc721Token.setApprovalForAll(erc721Proxy.address, true).awaitTransactionSuccessAsync({
                from: tokenOwnerAddress,
            });
            const assetData = await libAssetData
                .encodeERC721AssetData(erc721Token.address, firstERC721TokenId)
                .callAsync();
            expect(
                await libAssetData.getAssetProxyAllowance(tokenOwnerAddress, assetData).callAsync(),
            ).to.bignumber.equal(constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS);
        });

        it('should query ERC1155 allowances by asset data', async () => {
            await erc1155Token.setApprovalForAll(erc1155Proxy.address, true).awaitTransactionSuccessAsync({
                from: tokenOwnerAddress,
            });
            const assetData = await libAssetData
                .encodeERC1155AssetData(
                    erc1155Token.address,
                    [erc1155TokenId],
                    [new BigNumber(1)],
                    constants.NULL_BYTES,
                )
                .callAsync();
            expect(
                await libAssetData.getAssetProxyAllowance(tokenOwnerAddress, assetData).callAsync(),
            ).to.bignumber.equal(constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS);
        });

        it('should query multi-asset allowances by asset data', async () => {
            const allowance = new BigNumber(1);
            await erc20Token.approve(erc20Proxy.address, allowance).awaitTransactionSuccessAsync({
                from: tokenOwnerAddress,
            });
            await erc721Token.approve(erc721Proxy.address, firstERC721TokenId).awaitTransactionSuccessAsync({
                from: tokenOwnerAddress,
            });
            const assetData = await libAssetData
                .encodeMultiAssetData(
                    [new BigNumber(1), new BigNumber(1)],
                    [
                        await libAssetData.encodeERC20AssetData(erc20Token.address).callAsync(),
                        await libAssetData.encodeERC721AssetData(erc721Token.address, firstERC721TokenId).callAsync(),
                    ],
                )
                .callAsync();
            expect(
                await libAssetData.getAssetProxyAllowance(tokenOwnerAddress, assetData).callAsync(),
            ).to.bignumber.equal(1);
            return;
        });

        it('should return an allowance of 0 if the assetData does not correspond to an AssetProxy contract', async () => {
            const fakeAssetData = '0x01020304';
            const allowance = await libAssetData.getAssetProxyAllowance(tokenOwnerAddress, fakeAssetData).callAsync();
            expect(allowance).to.bignumber.equal(constants.ZERO_AMOUNT);
        });

        it('should return an allowance of MAX_UINT256 for any staticCallAssetData', async () => {
            const staticCallData = AssetProxyId.StaticCall;
            const assetData = await libAssetData
                .encodeStaticCallAssetData(staticCallTarget.address, staticCallData, constants.KECCAK256_NULL)
                .callAsync();
            const allowance = await libAssetData.getAssetProxyAllowance(tokenOwnerAddress, assetData).callAsync();
            expect(allowance).to.bignumber.equal(constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS);
        });
    });

    describe('getBatchBalances', () => {
        it('should query balances for a batch of asset data strings', async () => {
            const erc20AssetData = await libAssetData.encodeERC20AssetData(erc20Token.address).callAsync();
            const erc721AssetData = await libAssetData
                .encodeERC721AssetData(erc721Token.address, firstERC721TokenId)
                .callAsync();
            expect(
                await libAssetData.getBatchBalances(tokenOwnerAddress, [erc20AssetData, erc721AssetData]).callAsync(),
            ).to.deep.equal([new BigNumber(erc20TokenTotalSupply), new BigNumber(1)]);
        });
    });

    describe('getBalanceAndAllowance', () => {
        it('should query balance and allowance together, from asset data', async () => {
            const allowance = new BigNumber(1);
            await erc20Token.approve(erc20Proxy.address, allowance).awaitTransactionSuccessAsync({
                from: tokenOwnerAddress,
            });
            const assetData = await libAssetData.encodeERC20AssetData(erc20Token.address).callAsync();
            expect(
                await libAssetData.getBalanceAndAssetProxyAllowance(tokenOwnerAddress, assetData).callAsync(),
            ).to.deep.equal([new BigNumber(erc20TokenTotalSupply), allowance]);
        });
    });
    describe('getBatchBalancesAndAllowances', () => {
        it('should query balances and allowances together, from an asset data array', async () => {
            const allowance = new BigNumber(1);
            await erc20Token.approve(erc20Proxy.address, allowance).awaitTransactionSuccessAsync({
                from: tokenOwnerAddress,
            });
            const assetData = await libAssetData.encodeERC20AssetData(erc20Token.address).callAsync();
            expect(
                await libAssetData.getBatchBalancesAndAssetProxyAllowances(tokenOwnerAddress, [assetData]).callAsync(),
            ).to.deep.equal([[new BigNumber(erc20TokenTotalSupply)], [allowance]]);
        });
    });

    describe('getBatchAssetProxyAllowances', () => {
        it('should query allowances for a batch of asset data strings', async () => {
            const allowance = new BigNumber(1);
            await erc20Token.approve(erc20Proxy.address, allowance).awaitTransactionSuccessAsync({
                from: tokenOwnerAddress,
            });
            await erc721Token.approve(erc721Proxy.address, firstERC721TokenId).awaitTransactionSuccessAsync({
                from: tokenOwnerAddress,
            });
            const erc20AssetData = await libAssetData.encodeERC20AssetData(erc20Token.address).callAsync();
            const erc721AssetData = await libAssetData
                .encodeERC721AssetData(erc721Token.address, firstERC721TokenId)
                .callAsync();
            expect(
                await libAssetData
                    .getBatchAssetProxyAllowances(tokenOwnerAddress, [erc20AssetData, erc721AssetData])
                    .callAsync(),
            ).to.deep.equal([new BigNumber(1), new BigNumber(1)]);
        });
    });
});
// tslint:disable:max-file-line-count
