import * as crypto from 'crypto';

import { artifacts as proxyArtifacts, TestStaticCallTargetContract } from '@0x/contracts-asset-proxy';
import { artifacts, DevUtilsContract } from '@0x/contracts-dev-utils';
import { ERC1155MintableContract } from '@0x/contracts-erc1155';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { DummyERC721TokenContract } from '@0x/contracts-erc721';
import { blockchainTests, constants, expect } from '@0x/contracts-test-utils';
import { AssetProxyId } from '@0x/types';
import { BigNumber, hexUtils, LibBytesRevertErrors } from '@0x/utils';

import { Actor } from '../framework/actors/base';
import { DeploymentManager } from '../framework/deployment_manager';

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

// TODO(jalextowle): This file could really be cleaned up by using the DeploymentManager tool.
blockchainTests.resets('LibAssetData', env => {
    let deployment: DeploymentManager;
    let staticCallTarget: TestStaticCallTargetContract;
    let devUtils: DevUtilsContract;

    let tokenOwner: Actor;

    let erc20Token: DummyERC20TokenContract;
    let secondErc20Token: DummyERC20TokenContract;
    let erc721Token: DummyERC721TokenContract;
    let erc1155Token: ERC1155MintableContract;

    let erc721TokenId: BigNumber;
    let erc1155TokenId: BigNumber;

    before(async () => {
        deployment = await DeploymentManager.deployAsync(env, {
            numErc20TokensToDeploy: 2,
            numErc721TokensToDeploy: 1,
            numErc1155TokensToDeploy: 1,
        });
        tokenOwner = new Actor({ name: 'Token Owner', deployment });

        devUtils = await DevUtilsContract.deployWithLibrariesFrom0xArtifactAsync(
            artifacts.DevUtils,
            artifacts,
            env.provider,
            env.txDefaults,
            artifacts,
            deployment.exchange.address,
            constants.NULL_ADDRESS,
        );

        staticCallTarget = await TestStaticCallTargetContract.deployFrom0xArtifactAsync(
            proxyArtifacts.TestStaticCallTarget,
            env.provider,
            env.txDefaults,
            artifacts,
        );

        [erc20Token, secondErc20Token] = deployment.tokens.erc20;
        [erc721Token] = deployment.tokens.erc721;
        [erc1155Token] = deployment.tokens.erc1155;

        // mint tokens
        await tokenOwner.configureERC20TokenAsync(erc20Token);
        [erc721TokenId] = await tokenOwner.configureERC721TokenAsync(erc721Token);
        erc1155TokenId = await tokenOwner.configureERC1155TokenAsync(
            erc1155Token,
            deployment.assetProxies.erc1155Proxy.address,
            new BigNumber(1),
        );
    });

    it('should have a deployed-to address', () => {
        expect(devUtils.address.slice(0, 2)).to.equal('0x');
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
                expect(await devUtils.decodeAssetProxyId(assetData).callAsync()).to.equal(proxyId);
            }
        });
        it('should encode ERC20 asset data', async () => {
            expect(await devUtils.encodeERC20AssetData(KNOWN_ERC20_ENCODING.address).callAsync()).to.equal(
                KNOWN_ERC20_ENCODING.assetData,
            );
        });

        it('should decode ERC20 asset data', async () => {
            expect(await devUtils.decodeERC20AssetData(KNOWN_ERC20_ENCODING.assetData).callAsync()).to.deep.equal([
                AssetProxyId.ERC20,
                KNOWN_ERC20_ENCODING.address,
            ]);
        });

        it('should encode ERC721 asset data', async () => {
            expect(
                await devUtils
                    .encodeERC721AssetData(KNOWN_ERC721_ENCODING.address, KNOWN_ERC721_ENCODING.tokenId)
                    .callAsync(),
            ).to.equal(KNOWN_ERC721_ENCODING.assetData);
        });

        it('should decode ERC721 asset data', async () => {
            expect(await devUtils.decodeERC721AssetData(KNOWN_ERC721_ENCODING.assetData).callAsync()).to.deep.equal([
                AssetProxyId.ERC721,
                KNOWN_ERC721_ENCODING.address,
                KNOWN_ERC721_ENCODING.tokenId,
            ]);
        });

        it('should encode ERC1155 asset data', async () => {
            expect(
                await devUtils
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
            expect(await devUtils.decodeERC1155AssetData(KNOWN_ERC1155_ENCODING.assetData).callAsync()).to.deep.equal([
                AssetProxyId.ERC1155,
                KNOWN_ERC1155_ENCODING.tokenAddress,
                KNOWN_ERC1155_ENCODING.tokenIds,
                KNOWN_ERC1155_ENCODING.tokenValues,
                KNOWN_ERC1155_ENCODING.callbackData,
            ]);
        });

        it('should encode multiasset data', async () => {
            expect(
                await devUtils
                    .encodeMultiAssetData(
                        KNOWN_MULTI_ASSET_ENCODING.amounts,
                        KNOWN_MULTI_ASSET_ENCODING.nestedAssetData,
                    )
                    .callAsync(),
            ).to.equal(KNOWN_MULTI_ASSET_ENCODING.assetData);
        });

        it('should decode multiasset data', async () => {
            expect(await devUtils.decodeMultiAssetData(KNOWN_MULTI_ASSET_ENCODING.assetData).callAsync()).to.deep.equal(
                [
                    AssetProxyId.MultiAsset,
                    KNOWN_MULTI_ASSET_ENCODING.amounts,
                    KNOWN_MULTI_ASSET_ENCODING.nestedAssetData,
                ],
            );
        });

        it('should encode StaticCall data', async () => {
            expect(
                await devUtils
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
                await devUtils.decodeStaticCallAssetData(KNOWN_STATIC_CALL_ENCODING.assetData).callAsync(),
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
                await devUtils.revertIfInvalidAssetData(data).callAsync();
            }
            return;
        });

        it('should revert for invalid assetProxyId', async () => {
            const badAssetData = `0x${crypto.randomBytes(4).toString('hex')}${constants.NULL_ADDRESS}`;
            await expect(devUtils.revertIfInvalidAssetData(badAssetData).callAsync()).to.revertWith('WRONG_PROXY_ID');
        });

        it('should revert for invalid assetData with valid assetProxyId', async () => {
            // the other encodings are always valid if the assetProxyId is valid
            const assetData = [KNOWN_ERC20_ENCODING.assetData, KNOWN_ERC721_ENCODING.assetData];

            for (const data of assetData) {
                const badData = data.substring(0, data.length - 2); // drop one byte but retain assetProxyId
                await expect(devUtils.revertIfInvalidAssetData(badData).callAsync()).to.revertWith(
                    new LibBytesRevertErrors.InvalidByteOperationError(),
                );
            }
        });
    });

    describe('getBalance', () => {
        it('should query ERC20 balance by asset data', async () => {
            const assetData = await devUtils.encodeERC20AssetData(erc20Token.address).callAsync();
            expect(await devUtils.getBalance(tokenOwner.address, assetData).callAsync()).to.bignumber.equal(
                constants.INITIAL_ERC20_BALANCE,
            );
        });

        it('should return 0 if ERC20 token does not exist', async () => {
            const assetData = await devUtils.encodeERC20AssetData(constants.NULL_ADDRESS).callAsync();
            const balance = await devUtils.getBalance(tokenOwner.address, assetData).callAsync();
            expect(balance).to.bignumber.equal(constants.ZERO_AMOUNT);
        });

        it('should query ERC721 balance by asset data', async () => {
            const assetData = await devUtils.encodeERC721AssetData(erc721Token.address, erc721TokenId).callAsync();
            expect(await devUtils.getBalance(tokenOwner.address, assetData).callAsync()).to.bignumber.equal(1);
        });

        it('should return 0 if ERC721 token does not exist', async () => {
            const assetData = await devUtils.encodeERC721AssetData(constants.NULL_ADDRESS, erc721TokenId).callAsync();
            const balance = await devUtils.getBalance(tokenOwner.address, assetData).callAsync();
            expect(balance).to.bignumber.equal(constants.ZERO_AMOUNT);
        });

        it('should query ERC1155 balances by asset data', async () => {
            const assetData = await devUtils
                .encodeERC1155AssetData(
                    erc1155Token.address,
                    [erc1155TokenId],
                    [new BigNumber(1)],
                    constants.NULL_BYTES,
                )
                .callAsync();
            expect(await devUtils.getBalance(tokenOwner.address, assetData).callAsync()).to.bignumber.equal(1);
        });

        it('should return 0 if ERC1155 token does not exist', async () => {
            const assetData = await devUtils
                .encodeERC1155AssetData(
                    constants.NULL_ADDRESS,
                    [erc1155TokenId],
                    [new BigNumber(1)],
                    constants.NULL_BYTES,
                )
                .callAsync();
            const balance = await devUtils.getBalance(tokenOwner.address, assetData).callAsync();
            expect(balance).to.bignumber.equal(constants.ZERO_AMOUNT);
        });

        it('should query multi-asset batch balance by asset data', async () => {
            const assetData = await devUtils
                .encodeMultiAssetData(
                    [new BigNumber(1), new BigNumber(1)],
                    [
                        await devUtils.encodeERC20AssetData(erc20Token.address).callAsync(),
                        await devUtils.encodeERC721AssetData(erc721Token.address, erc721TokenId).callAsync(),
                    ],
                )
                .callAsync();
            expect(await devUtils.getBalance(tokenOwner.address, assetData).callAsync()).to.bignumber.equal(1);
        });

        it('should query multi-asset batch balance by asset data, skipping over a nested asset if its amount == 0', async () => {
            const assetData = await devUtils
                .encodeMultiAssetData(
                    [constants.ZERO_AMOUNT, new BigNumber(1)],
                    [
                        await devUtils.encodeERC20AssetData(erc20Token.address).callAsync(),
                        await devUtils.encodeERC721AssetData(erc721Token.address, erc721TokenId).callAsync(),
                    ],
                )
                .callAsync();
            expect(await devUtils.getBalance(tokenOwner.address, assetData).callAsync()).to.bignumber.equal(1);
        });

        it('should return a balance of 0 if the balance for a nested asset is 0', async () => {
            const assetData = await devUtils
                .encodeMultiAssetData(
                    [new BigNumber(1), new BigNumber(1)],
                    [
                        await devUtils.encodeERC20AssetData(secondErc20Token.address).callAsync(),
                        await devUtils.encodeERC20AssetData(erc20Token.address).callAsync(),
                    ],
                )
                .callAsync();
            expect(await devUtils.getBalance(tokenOwner.address, assetData).callAsync()).to.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
        });

        it('should return a balance of 0 if the assetData does not correspond to an AssetProxy contract', async () => {
            const fakeAssetData = '0x01020304';
            const balance = await devUtils.getBalance(tokenOwner.address, fakeAssetData).callAsync();
            expect(balance).to.bignumber.equal(constants.ZERO_AMOUNT);
        });

        it('should return a balance of MAX_UINT256 if the the StaticCallProxy assetData contains data for a successful staticcall', async () => {
            const staticCallData = staticCallTarget.isOddNumber(new BigNumber(1)).getABIEncodedTransactionData();
            const expectedResultHash = hexUtils.hash(hexUtils.leftPad(1));
            const assetData = await devUtils
                .encodeStaticCallAssetData(staticCallTarget.address, staticCallData, expectedResultHash)
                .callAsync();
            const balance = await devUtils.getBalance(tokenOwner.address, assetData).callAsync();
            expect(balance).to.bignumber.equal(constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS);
        });

        it('should return a balance of 0 if the the StaticCallProxy assetData contains data for an unsuccessful staticcall', async () => {
            const staticCallData = staticCallTarget.isOddNumber(new BigNumber(0)).getABIEncodedTransactionData();
            const expectedResultHash = hexUtils.hash(hexUtils.leftPad(1));
            const assetData = await devUtils
                .encodeStaticCallAssetData(staticCallTarget.address, staticCallData, expectedResultHash)
                .callAsync();
            const balance = await devUtils.getBalance(tokenOwner.address, assetData).callAsync();
            expect(balance).to.bignumber.equal(constants.ZERO_AMOUNT);
        });
    });

    describe('getAssetProxyAllowance', () => {
        it('should query ERC20 allowances by asset data', async () => {
            const assetData = await devUtils.encodeERC20AssetData(erc20Token.address).callAsync();
            expect(await devUtils.getAssetProxyAllowance(tokenOwner.address, assetData).callAsync()).to.bignumber.equal(
                constants.MAX_UINT256,
            );
        });

        it('should query ERC721 approval by asset data', async () => {
            // Temporarily remove approval for all
            await erc721Token
                .setApprovalForAll(deployment.assetProxies.erc721Proxy.address, false)
                .awaitTransactionSuccessAsync({ from: tokenOwner.address });
            await erc721Token
                .approve(deployment.assetProxies.erc721Proxy.address, erc721TokenId)
                .awaitTransactionSuccessAsync({
                    from: tokenOwner.address,
                });
            const assetData = await devUtils.encodeERC721AssetData(erc721Token.address, erc721TokenId).callAsync();
            expect(await devUtils.getAssetProxyAllowance(tokenOwner.address, assetData).callAsync()).to.bignumber.equal(
                1,
            );
        });

        it('should query ERC721 approvalForAll by assetData', async () => {
            const assetData = await devUtils.encodeERC721AssetData(erc721Token.address, erc721TokenId).callAsync();
            expect(await devUtils.getAssetProxyAllowance(tokenOwner.address, assetData).callAsync()).to.bignumber.equal(
                constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS,
            );
        });

        it('should query ERC1155 allowances by asset data', async () => {
            const assetData = await devUtils
                .encodeERC1155AssetData(
                    erc1155Token.address,
                    [erc1155TokenId],
                    [new BigNumber(1)],
                    constants.NULL_BYTES,
                )
                .callAsync();
            expect(await devUtils.getAssetProxyAllowance(tokenOwner.address, assetData).callAsync()).to.bignumber.equal(
                constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS,
            );
        });

        it('should query multi-asset allowances by asset data', async () => {
            const allowance = new BigNumber(1);
            await erc20Token
                .approve(deployment.assetProxies.erc20Proxy.address, allowance)
                .awaitTransactionSuccessAsync({
                    from: tokenOwner.address,
                });
            const assetData = await devUtils
                .encodeMultiAssetData(
                    [new BigNumber(1), new BigNumber(1)],
                    [
                        await devUtils.encodeERC20AssetData(erc20Token.address).callAsync(),
                        await devUtils.encodeERC721AssetData(erc721Token.address, erc721TokenId).callAsync(),
                    ],
                )
                .callAsync();
            expect(await devUtils.getAssetProxyAllowance(tokenOwner.address, assetData).callAsync()).to.bignumber.equal(
                1,
            );
            return;
        });

        it('should query multi-asset allowances by asset data, skipping over a nested asset if its amount == 0', async () => {
            const allowance = new BigNumber(1);
            await erc20Token
                .approve(deployment.assetProxies.erc20Proxy.address, allowance)
                .awaitTransactionSuccessAsync({
                    from: tokenOwner.address,
                });
            const assetData = await devUtils
                .encodeMultiAssetData(
                    [constants.ZERO_AMOUNT, new BigNumber(1)],
                    [
                        await devUtils.encodeERC20AssetData(erc20Token.address).callAsync(),
                        await devUtils.encodeERC721AssetData(erc721Token.address, erc721TokenId).callAsync(),
                    ],
                )
                .callAsync();
            expect(await devUtils.getAssetProxyAllowance(tokenOwner.address, assetData).callAsync()).to.bignumber.equal(
                constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS,
            );
            return;
        });

        it('should return an allowance of 0 if the allowance for a nested asset is 0', async () => {
            const assetData = await devUtils
                .encodeMultiAssetData(
                    [new BigNumber(1), new BigNumber(1)],
                    [
                        await devUtils.encodeERC20AssetData(secondErc20Token.address).callAsync(),
                        await devUtils.encodeERC20AssetData(erc20Token.address).callAsync(),
                    ],
                )
                .callAsync();
            expect(await devUtils.getAssetProxyAllowance(tokenOwner.address, assetData).callAsync()).to.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
        });

        it('should return an allowance of 0 if the assetData does not correspond to an AssetProxy contract', async () => {
            const fakeAssetData = '0x01020304';
            const allowance = await devUtils.getAssetProxyAllowance(tokenOwner.address, fakeAssetData).callAsync();
            expect(allowance).to.bignumber.equal(constants.ZERO_AMOUNT);
        });

        it('should return an allowance of MAX_UINT256 for any staticCallAssetData', async () => {
            const staticCallData = AssetProxyId.StaticCall;
            const assetData = await devUtils
                .encodeStaticCallAssetData(staticCallTarget.address, staticCallData, constants.KECCAK256_NULL)
                .callAsync();
            const allowance = await devUtils.getAssetProxyAllowance(tokenOwner.address, assetData).callAsync();
            expect(allowance).to.bignumber.equal(constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS);
        });
    });

    describe('getBatchBalances', () => {
        it('should query balances for a batch of asset data strings', async () => {
            const erc20AssetData = await devUtils.encodeERC20AssetData(erc20Token.address).callAsync();
            const erc721AssetData = await devUtils
                .encodeERC721AssetData(erc721Token.address, erc721TokenId)
                .callAsync();
            expect(
                await devUtils.getBatchBalances(tokenOwner.address, [erc20AssetData, erc721AssetData]).callAsync(),
            ).to.deep.equal([new BigNumber(constants.INITIAL_ERC20_BALANCE), new BigNumber(1)]);
        });
    });

    describe('getBalanceAndAllowance', () => {
        it('should query balance and allowance together, from asset data', async () => {
            const allowance = new BigNumber(1);
            await erc20Token
                .approve(deployment.assetProxies.erc20Proxy.address, allowance)
                .awaitTransactionSuccessAsync({
                    from: tokenOwner.address,
                });
            const assetData = await devUtils.encodeERC20AssetData(erc20Token.address).callAsync();
            expect(
                await devUtils.getBalanceAndAssetProxyAllowance(tokenOwner.address, assetData).callAsync(),
            ).to.deep.equal([new BigNumber(constants.INITIAL_ERC20_BALANCE), allowance]);
        });
    });
    describe('getBatchBalancesAndAllowances', () => {
        it('should query balances and allowances together, from an asset data array', async () => {
            const allowance = new BigNumber(1);
            await erc20Token
                .approve(deployment.assetProxies.erc20Proxy.address, allowance)
                .awaitTransactionSuccessAsync({
                    from: tokenOwner.address,
                });
            const assetData = await devUtils.encodeERC20AssetData(erc20Token.address).callAsync();
            expect(
                await devUtils.getBatchBalancesAndAssetProxyAllowances(tokenOwner.address, [assetData]).callAsync(),
            ).to.deep.equal([[new BigNumber(constants.INITIAL_ERC20_BALANCE)], [allowance]]);
        });
    });

    describe('getBatchAssetProxyAllowances', () => {
        it('should query allowances for a batch of asset data strings', async () => {
            const allowance = new BigNumber(1);
            await erc20Token
                .approve(deployment.assetProxies.erc20Proxy.address, allowance)
                .awaitTransactionSuccessAsync({
                    from: tokenOwner.address,
                });
            const erc20AssetData = await devUtils.encodeERC20AssetData(erc20Token.address).callAsync();
            const erc721AssetData = await devUtils
                .encodeERC721AssetData(erc721Token.address, erc721TokenId)
                .callAsync();
            expect(
                await devUtils
                    .getBatchAssetProxyAllowances(tokenOwner.address, [erc20AssetData, erc721AssetData])
                    .callAsync(),
            ).to.deep.equal([allowance, constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS]);
        });
    });
});
// tslint:disable:max-file-line-count
