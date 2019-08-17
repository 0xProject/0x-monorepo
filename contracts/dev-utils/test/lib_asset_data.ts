import * as chai from 'chai';
import { LogWithDecodedArgs } from 'ethereum-types';

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
import { assetDataUtils } from '@0x/order-utils';
import { AssetProxyId } from '@0x/types';
import { BigNumber, providerUtils } from '@0x/utils';
import * as ethUtil from 'ethereumjs-util';

import { artifacts, LibAssetDataContract } from '../src';

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

        await exchange.registerAssetProxy.awaitTransactionSuccessAsync(erc20Proxy.address);
        await exchange.registerAssetProxy.awaitTransactionSuccessAsync(erc721Proxy.address);
        await exchange.registerAssetProxy.awaitTransactionSuccessAsync(erc1155Proxy.address);
        await exchange.registerAssetProxy.awaitTransactionSuccessAsync(multiAssetProxy.address);
        await exchange.registerAssetProxy.awaitTransactionSuccessAsync(staticCallProxy.address);

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
                erc721Token.mint.awaitTransactionSuccessAsync(tokenOwnerAddress, firstERC721TokenId.plus(i - 1)),
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
            await erc1155Token.create.sendTransactionAsync('uri:Dummy', /*isNonFungible:*/ false),
        );

        // tslint:disable-next-line no-unnecessary-type-assertion
        erc1155TokenId = (transactionReceipt.logs[0] as LogWithDecodedArgs<ERC1155TransferSingleEventArgs>).args.id;
        await erc1155Token.mintFungible.awaitTransactionSuccessAsync(
            erc1155TokenId,
            [tokenOwnerAddress],
            [new BigNumber(1)],
        );
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
        it('should encode ERC20 asset data', async () => {
            expect(await libAssetData.encodeERC20AssetData.callAsync(KNOWN_ERC20_ENCODING.address)).to.equal(
                KNOWN_ERC20_ENCODING.assetData,
            );
        });

        it('should decode ERC20 asset data', async () => {
            expect(await libAssetData.decodeERC20AssetData.callAsync(KNOWN_ERC20_ENCODING.assetData)).to.deep.equal([
                AssetProxyId.ERC20,
                KNOWN_ERC20_ENCODING.address,
            ]);
        });

        it('should encode ERC721 asset data', async () => {
            expect(
                await libAssetData.encodeERC721AssetData.callAsync(
                    KNOWN_ERC721_ENCODING.address,
                    KNOWN_ERC721_ENCODING.tokenId,
                ),
            ).to.equal(KNOWN_ERC721_ENCODING.assetData);
        });

        it('should decode ERC721 asset data', async () => {
            expect(await libAssetData.decodeERC721AssetData.callAsync(KNOWN_ERC721_ENCODING.assetData)).to.deep.equal([
                AssetProxyId.ERC721,
                KNOWN_ERC721_ENCODING.address,
                KNOWN_ERC721_ENCODING.tokenId,
            ]);
        });

        it('should encode ERC1155 asset data', async () => {
            expect(
                await libAssetData.encodeERC1155AssetData.callAsync(
                    KNOWN_ERC1155_ENCODING.tokenAddress,
                    KNOWN_ERC1155_ENCODING.tokenIds,
                    KNOWN_ERC1155_ENCODING.tokenValues,
                    KNOWN_ERC1155_ENCODING.callbackData,
                ),
            ).to.equal(KNOWN_ERC1155_ENCODING.assetData);
        });

        it('should decode ERC1155 asset data', async () => {
            expect(await libAssetData.decodeERC1155AssetData.callAsync(KNOWN_ERC1155_ENCODING.assetData)).to.deep.equal(
                [
                    AssetProxyId.ERC1155,
                    KNOWN_ERC1155_ENCODING.tokenAddress,
                    KNOWN_ERC1155_ENCODING.tokenIds,
                    KNOWN_ERC1155_ENCODING.tokenValues,
                    KNOWN_ERC1155_ENCODING.callbackData,
                ],
            );
        });

        it('should encode multiasset data', async () => {
            expect(
                await libAssetData.encodeMultiAssetData.callAsync(
                    KNOWN_MULTI_ASSET_ENCODING.amounts,
                    KNOWN_MULTI_ASSET_ENCODING.nestedAssetData,
                ),
            ).to.equal(KNOWN_MULTI_ASSET_ENCODING.assetData);
        });

        it('should decode multiasset data', async () => {
            expect(
                await libAssetData.decodeMultiAssetData.callAsync(KNOWN_MULTI_ASSET_ENCODING.assetData),
            ).to.deep.equal([
                AssetProxyId.MultiAsset,
                KNOWN_MULTI_ASSET_ENCODING.amounts,
                KNOWN_MULTI_ASSET_ENCODING.nestedAssetData,
            ]);
        });
    });

    describe('getBalance', () => {
        it('should query ERC20 balance by asset data', async () => {
            const assetData = assetDataUtils.encodeERC20AssetData(erc20Token.address);
            expect(await libAssetData.getBalance.callAsync(tokenOwnerAddress, assetData)).to.bignumber.equal(
                erc20TokenTotalSupply,
            );
        });

        it('should return 0 if ERC20 token does not exist', async () => {
            const assetData = assetDataUtils.encodeERC20AssetData(constants.NULL_ADDRESS);
            const balance = await libAssetData.getBalance.callAsync(tokenOwnerAddress, assetData);
            expect(balance).to.bignumber.equal(constants.ZERO_AMOUNT);
        });

        it('should query ERC721 balance by asset data', async () => {
            const assetData = assetDataUtils.encodeERC721AssetData(erc721Token.address, firstERC721TokenId);
            expect(await libAssetData.getBalance.callAsync(tokenOwnerAddress, assetData)).to.bignumber.equal(1);
        });

        it('should return 0 if ERC721 token does not exist', async () => {
            const assetData = assetDataUtils.encodeERC721AssetData(constants.NULL_ADDRESS, firstERC721TokenId);
            const balance = await libAssetData.getBalance.callAsync(tokenOwnerAddress, assetData);
            expect(balance).to.bignumber.equal(constants.ZERO_AMOUNT);
        });

        it('should query ERC1155 balances by asset data', async () => {
            const assetData = assetDataUtils.encodeERC1155AssetData(
                erc1155Token.address,
                [erc1155TokenId],
                [new BigNumber(1)],
                constants.NULL_BYTES,
            );
            expect(await libAssetData.getBalance.callAsync(tokenOwnerAddress, assetData)).to.bignumber.equal(1);
        });

        it('should return 0 if ERC1155 token does not exist', async () => {
            const assetData = assetDataUtils.encodeERC1155AssetData(
                constants.NULL_ADDRESS,
                [erc1155TokenId],
                [new BigNumber(1)],
                constants.NULL_BYTES,
            );
            const balance = await libAssetData.getBalance.callAsync(tokenOwnerAddress, assetData);
            expect(balance).to.bignumber.equal(constants.ZERO_AMOUNT);
        });

        it('should query multi-asset batch balance by asset data', async () => {
            const assetData = assetDataUtils.encodeMultiAssetData(
                [new BigNumber(1), new BigNumber(1)],
                [
                    assetDataUtils.encodeERC20AssetData(erc20Token.address),
                    assetDataUtils.encodeERC721AssetData(erc721Token.address, firstERC721TokenId),
                ],
            );
            expect(await libAssetData.getBalance.callAsync(tokenOwnerAddress, assetData)).to.bignumber.equal(
                Math.min(erc20TokenTotalSupply.toNumber(), numberOfERC721Tokens),
            );
        });

        it('should return a balance of 0 if the assetData does not correspond to an AssetProxy contract', async () => {
            const fakeAssetData = '0x01020304';
            const balance = await libAssetData.getBalance.callAsync(tokenOwnerAddress, fakeAssetData);
            expect(balance).to.bignumber.equal(constants.ZERO_AMOUNT);
        });

        it('should return a balance of MAX_UINT256 if the the StaticCallProxy assetData contains data for a successful staticcall', async () => {
            const staticCallData = staticCallTarget.isOddNumber.getABIEncodedTransactionData(new BigNumber(1));
            const trueAsBuffer = ethUtil.toBuffer('0x0000000000000000000000000000000000000000000000000000000000000001');
            const expectedResultHash = ethUtil.bufferToHex(ethUtil.sha3(trueAsBuffer));
            const assetData = assetDataUtils.encodeStaticCallAssetData(
                staticCallTarget.address,
                staticCallData,
                expectedResultHash,
            );
            const balance = await libAssetData.getBalance.callAsync(tokenOwnerAddress, assetData);
            expect(balance).to.bignumber.equal(constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS);
        });

        it('should return a balance of 0 if the the StaticCallProxy assetData contains data for an unsuccessful staticcall', async () => {
            const staticCallData = staticCallTarget.isOddNumber.getABIEncodedTransactionData(new BigNumber(0));
            const trueAsBuffer = ethUtil.toBuffer('0x0000000000000000000000000000000000000000000000000000000000000001');
            const expectedResultHash = ethUtil.bufferToHex(ethUtil.sha3(trueAsBuffer));
            const assetData = assetDataUtils.encodeStaticCallAssetData(
                staticCallTarget.address,
                staticCallData,
                expectedResultHash,
            );
            const balance = await libAssetData.getBalance.callAsync(tokenOwnerAddress, assetData);
            expect(balance).to.bignumber.equal(constants.ZERO_AMOUNT);
        });
    });

    describe('getAssetProxyAllowance', () => {
        it('should query ERC20 allowances by asset data', async () => {
            const allowance = new BigNumber(1);
            await erc20Token.approve.awaitTransactionSuccessAsync(erc20Proxy.address, allowance, {
                from: tokenOwnerAddress,
            });
            const assetData = assetDataUtils.encodeERC20AssetData(erc20Token.address);
            expect(
                await libAssetData.getAssetProxyAllowance.callAsync(tokenOwnerAddress, assetData),
            ).to.bignumber.equal(allowance);
        });

        it('should query ERC721 approval by asset data', async () => {
            await erc721Token.approve.awaitTransactionSuccessAsync(erc721Proxy.address, firstERC721TokenId, {
                from: tokenOwnerAddress,
            });
            const assetData = assetDataUtils.encodeERC721AssetData(erc721Token.address, firstERC721TokenId);
            expect(
                await libAssetData.getAssetProxyAllowance.callAsync(tokenOwnerAddress, assetData),
            ).to.bignumber.equal(1);
        });

        it('should query ERC721 approvalForAll by assetData', async () => {
            await erc721Token.setApprovalForAll.awaitTransactionSuccessAsync(erc721Proxy.address, true, {
                from: tokenOwnerAddress,
            });
            const assetData = assetDataUtils.encodeERC721AssetData(erc721Token.address, firstERC721TokenId);
            expect(
                await libAssetData.getAssetProxyAllowance.callAsync(tokenOwnerAddress, assetData),
            ).to.bignumber.equal(constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS);
        });

        it('should query ERC1155 allowances by asset data', async () => {
            await erc1155Token.setApprovalForAll.awaitTransactionSuccessAsync(erc1155Proxy.address, true, {
                from: tokenOwnerAddress,
            });
            const assetData = assetDataUtils.encodeERC1155AssetData(
                erc1155Token.address,
                [erc1155TokenId],
                [new BigNumber(1)],
                constants.NULL_BYTES,
            );
            expect(
                await libAssetData.getAssetProxyAllowance.callAsync(tokenOwnerAddress, assetData),
            ).to.bignumber.equal(constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS);
        });

        it('should query multi-asset allowances by asset data', async () => {
            const allowance = new BigNumber(1);
            await erc20Token.approve.awaitTransactionSuccessAsync(erc20Proxy.address, allowance, {
                from: tokenOwnerAddress,
            });
            await erc721Token.approve.awaitTransactionSuccessAsync(erc721Proxy.address, firstERC721TokenId, {
                from: tokenOwnerAddress,
            });
            const assetData = assetDataUtils.encodeMultiAssetData(
                [new BigNumber(1), new BigNumber(1)],
                [
                    assetDataUtils.encodeERC20AssetData(erc20Token.address),
                    assetDataUtils.encodeERC721AssetData(erc721Token.address, firstERC721TokenId),
                ],
            );
            expect(
                await libAssetData.getAssetProxyAllowance.callAsync(tokenOwnerAddress, assetData),
            ).to.bignumber.equal(1);
            return;
        });

        it('should return an allowance of 0 if the assetData does not correspond to an AssetProxy contract', async () => {
            const fakeAssetData = '0x01020304';
            const allowance = await libAssetData.getAssetProxyAllowance.callAsync(tokenOwnerAddress, fakeAssetData);
            expect(allowance).to.bignumber.equal(constants.ZERO_AMOUNT);
        });

        it('should return an allowance of MAX_UINT256 for any staticCallAssetData', async () => {
            const staticCallData = AssetProxyId.StaticCall;
            const assetData = assetDataUtils.encodeStaticCallAssetData(
                staticCallTarget.address,
                staticCallData,
                constants.KECCAK256_NULL,
            );
            const allowance = await libAssetData.getAssetProxyAllowance.callAsync(tokenOwnerAddress, assetData);
            expect(allowance).to.bignumber.equal(constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS);
        });
    });

    describe('getBatchBalances', () => {
        it('should query balances for a batch of asset data strings', async () => {
            const erc20AssetData = assetDataUtils.encodeERC20AssetData(erc20Token.address);
            const erc721AssetData = assetDataUtils.encodeERC721AssetData(erc721Token.address, firstERC721TokenId);
            expect(
                await libAssetData.getBatchBalances.callAsync(tokenOwnerAddress, [erc20AssetData, erc721AssetData]),
            ).to.deep.equal([new BigNumber(erc20TokenTotalSupply), new BigNumber(1)]);
        });
    });

    describe('getBalanceAndAllowance', () => {
        it('should query balance and allowance together, from asset data', async () => {
            const allowance = new BigNumber(1);
            await erc20Token.approve.awaitTransactionSuccessAsync(erc20Proxy.address, allowance, {
                from: tokenOwnerAddress,
            });
            const assetData = assetDataUtils.encodeERC20AssetData(erc20Token.address);
            expect(
                await libAssetData.getBalanceAndAssetProxyAllowance.callAsync(tokenOwnerAddress, assetData),
            ).to.deep.equal([new BigNumber(erc20TokenTotalSupply), allowance]);
        });
    });
    describe('getBatchBalancesAndAllowances', () => {
        it('should query balances and allowances together, from an asset data array', async () => {
            const allowance = new BigNumber(1);
            await erc20Token.approve.awaitTransactionSuccessAsync(erc20Proxy.address, allowance, {
                from: tokenOwnerAddress,
            });
            const assetData = assetDataUtils.encodeERC20AssetData(erc20Token.address);
            expect(
                await libAssetData.getBatchBalancesAndAssetProxyAllowances.callAsync(tokenOwnerAddress, [assetData]),
            ).to.deep.equal([[new BigNumber(erc20TokenTotalSupply)], [allowance]]);
        });
    });

    describe('getBatchAssetProxyAllowances', () => {
        it('should query allowances for a batch of asset data strings', async () => {
            const allowance = new BigNumber(1);
            await erc20Token.approve.awaitTransactionSuccessAsync(erc20Proxy.address, allowance, {
                from: tokenOwnerAddress,
            });
            await erc721Token.approve.awaitTransactionSuccessAsync(erc721Proxy.address, firstERC721TokenId, {
                from: tokenOwnerAddress,
            });
            const erc20AssetData = assetDataUtils.encodeERC20AssetData(erc20Token.address);
            const erc721AssetData = assetDataUtils.encodeERC721AssetData(erc721Token.address, firstERC721TokenId);
            expect(
                await libAssetData.getBatchAssetProxyAllowances.callAsync(tokenOwnerAddress, [
                    erc20AssetData,
                    erc721AssetData,
                ]),
            ).to.deep.equal([new BigNumber(1), new BigNumber(1)]);
        });
    });
});
// tslint:disable:max-file-line-count
