// TODO: change test titles to say "... from asset data"
import * as chai from 'chai';
import { LogWithDecodedArgs } from 'ethereum-types';

import {
    artifacts as erc1155Artifacts,
    ERC1155MintableContract,
    ERC1155TransferSingleEventArgs,
} from '@0x/contracts-erc1155';
import { artifacts as erc20Artifacts, DummyERC20TokenContract } from '@0x/contracts-erc20';
import { artifacts as erc721Artifacts, DummyERC721TokenContract } from '@0x/contracts-erc721';
import { chaiSetup, constants, LogDecoder, provider, txDefaults, web3Wrapper } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { AssetProxyId } from '@0x/types';
import { BigNumber } from '@0x/utils';

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
    let libAssetData: LibAssetDataContract;

    let tokenOwnerAddress: string;
    let approvedSpenderAddress: string;
    let anotherApprovedSpenderAddress: string;

    let erc20Token: DummyERC20TokenContract;
    let erc721Token: DummyERC721TokenContract;
    let erc1155Token: ERC1155MintableContract;

    const erc20TokenTotalSupply = new BigNumber(1);

    const firstERC721TokenId = new BigNumber(1);
    const numberOfERC721Tokens = 10;

    let erc1155TokenId: BigNumber;

    before(async () => {
        await blockchainLifecycle.startAsync();

        libAssetData = await LibAssetDataContract.deployFrom0xArtifactAsync(
            artifacts.LibAssetData,
            provider,
            txDefaults,
        );

        [
            tokenOwnerAddress,
            approvedSpenderAddress,
            anotherApprovedSpenderAddress,
        ] = await web3Wrapper.getAvailableAddressesAsync();

        erc20Token = await DummyERC20TokenContract.deployFrom0xArtifactAsync(
            erc20Artifacts.DummyERC20Token,
            provider,
            txDefaults,
            'Dummy',
            'DUM',
            new BigNumber(1),
            erc20TokenTotalSupply,
        );

        erc721Token = await DummyERC721TokenContract.deployFrom0xArtifactAsync(
            erc721Artifacts.DummyERC721Token,
            provider,
            txDefaults,
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

    it('should have a deployed-to address', () => {
        expect(libAssetData.address.slice(0, 2)).to.equal('0x');
    });

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
        expect(await libAssetData.decodeERC1155AssetData.callAsync(KNOWN_ERC1155_ENCODING.assetData)).to.deep.equal([
            AssetProxyId.ERC1155,
            KNOWN_ERC1155_ENCODING.tokenAddress,
            KNOWN_ERC1155_ENCODING.tokenIds,
            KNOWN_ERC1155_ENCODING.tokenValues,
            KNOWN_ERC1155_ENCODING.callbackData,
        ]);
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
        expect(await libAssetData.decodeMultiAssetData.callAsync(KNOWN_MULTI_ASSET_ENCODING.assetData)).to.deep.equal([
            AssetProxyId.MultiAsset,
            KNOWN_MULTI_ASSET_ENCODING.amounts,
            KNOWN_MULTI_ASSET_ENCODING.nestedAssetData,
        ]);
    });

    it('should query ERC20 balance by asset data', async () => {
        expect(
            await libAssetData.getBalance.callAsync(
                tokenOwnerAddress,
                await libAssetData.encodeERC20AssetData.callAsync(erc20Token.address),
            ),
        ).to.bignumber.equal(erc20TokenTotalSupply);
    });

    it('should query ERC721 balance by asset data', async () => {
        expect(
            await libAssetData.getBalance.callAsync(
                tokenOwnerAddress,
                await libAssetData.encodeERC721AssetData.callAsync(erc721Token.address, firstERC721TokenId),
            ),
        ).to.bignumber.equal(1);
    });

    it('should query ERC1155 balances by asset data', async () => {
        expect(
            await libAssetData.getBalance.callAsync(
                tokenOwnerAddress,
                await libAssetData.encodeERC1155AssetData.callAsync(
                    erc1155Token.address,
                    [erc1155TokenId],
                    [new BigNumber(1)], // token values
                    '0x', // callback data
                ),
            ),
        ).to.bignumber.equal(1);
    });

    it('should query multi-asset batch balance by asset data', async () => {
        expect(
            await libAssetData.getBalance.callAsync(
                tokenOwnerAddress,
                await libAssetData.encodeMultiAssetData.callAsync(
                    [new BigNumber(1), new BigNumber(1)],
                    [
                        await libAssetData.encodeERC20AssetData.callAsync(erc20Token.address),
                        await libAssetData.encodeERC721AssetData.callAsync(erc721Token.address, firstERC721TokenId),
                    ],
                ),
            ),
        ).to.bignumber.equal(Math.min(erc20TokenTotalSupply.toNumber(), numberOfERC721Tokens));
    });

    it('should query ERC20 allowances by asset data', async () => {
        const allowance = new BigNumber(1);
        await erc20Token.approve.awaitTransactionSuccessAsync(approvedSpenderAddress, allowance, {
            from: tokenOwnerAddress,
        });
        expect(
            await libAssetData.getAllowance.callAsync(
                tokenOwnerAddress,
                approvedSpenderAddress,
                await libAssetData.encodeERC20AssetData.callAsync(erc20Token.address),
            ),
        ).to.bignumber.equal(allowance);
    });

    it('should query ERC721 approval by asset data', async () => {
        await erc721Token.approve.awaitTransactionSuccessAsync(approvedSpenderAddress, firstERC721TokenId, {
            from: tokenOwnerAddress,
        });
        expect(
            await libAssetData.getAllowance.callAsync(
                tokenOwnerAddress,
                approvedSpenderAddress,
                await libAssetData.encodeERC721AssetData.callAsync(erc721Token.address, firstERC721TokenId),
            ),
        ).to.bignumber.equal(1);
    });

    it('should query ERC721 approvalForAll by assetData', async () => {
        await erc721Token.setApprovalForAll.awaitTransactionSuccessAsync(anotherApprovedSpenderAddress, true, {
            from: tokenOwnerAddress,
        });
        expect(
            await libAssetData.getAllowance.callAsync(
                tokenOwnerAddress,
                anotherApprovedSpenderAddress,
                await libAssetData.encodeERC721AssetData.callAsync(erc721Token.address, firstERC721TokenId),
            ),
        ).to.bignumber.equal(constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS);
    });

    it('should query ERC1155 allowances by asset data', async () => {
        await erc1155Token.setApprovalForAll.awaitTransactionSuccessAsync(approvedSpenderAddress, true, {
            from: tokenOwnerAddress,
        });
        expect(
            await libAssetData.getAllowance.callAsync(
                tokenOwnerAddress,
                approvedSpenderAddress,
                await libAssetData.encodeERC1155AssetData.callAsync(
                    erc1155Token.address,
                    [erc1155TokenId],
                    [new BigNumber(1)],
                    '0x',
                ),
            ),
        ).to.bignumber.equal(constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS);
    });

    it('should query multi-asset allowances by asset data', async () => {
        const allowance = new BigNumber(1);
        await erc20Token.approve.awaitTransactionSuccessAsync(approvedSpenderAddress, allowance, {
            from: tokenOwnerAddress,
        });
        await erc721Token.approve.awaitTransactionSuccessAsync(approvedSpenderAddress, firstERC721TokenId, {
            from: tokenOwnerAddress,
        });
        expect(
            await libAssetData.getAllowance.callAsync(
                tokenOwnerAddress,
                approvedSpenderAddress,
                await libAssetData.encodeMultiAssetData.callAsync(
                    [new BigNumber(1), new BigNumber(1)],
                    [
                        await libAssetData.encodeERC20AssetData.callAsync(erc20Token.address),
                        await libAssetData.encodeERC721AssetData.callAsync(erc721Token.address, firstERC721TokenId),
                    ],
                ),
            ),
        ).to.bignumber.equal(1);
        return;
    });

    it('should query balances for a batch of asset data strings', async () => {
        expect(
            await libAssetData.getBatchBalances.callAsync(tokenOwnerAddress, [
                await libAssetData.encodeERC20AssetData.callAsync(erc20Token.address),
                await libAssetData.encodeERC721AssetData.callAsync(erc721Token.address, firstERC721TokenId),
            ]),
        ).to.deep.equal([new BigNumber(erc20TokenTotalSupply), new BigNumber(1)]);
    });

    it('should query allowances for a batch of asset data strings', async () => {
        const allowance = new BigNumber(1);
        await erc20Token.approve.awaitTransactionSuccessAsync(approvedSpenderAddress, allowance, {
            from: tokenOwnerAddress,
        });
        await erc721Token.approve.awaitTransactionSuccessAsync(approvedSpenderAddress, firstERC721TokenId, {
            from: tokenOwnerAddress,
        });
        expect(
            await libAssetData.getBatchAllowances.callAsync(
                tokenOwnerAddress,
                [approvedSpenderAddress, approvedSpenderAddress],
                [
                    await libAssetData.encodeERC20AssetData.callAsync(erc20Token.address),
                    await libAssetData.encodeERC721AssetData.callAsync(erc721Token.address, firstERC721TokenId),
                ],
            ),
        ).to.deep.equal([new BigNumber(1), new BigNumber(1)]);
    });

    describe('getERC721TokenOwner', async () => {
        it('should return the null address when tokenId is not owned', async () => {
            const nonexistentTokenId = new BigNumber(1234567890);
            expect(
                await libAssetData.getERC721TokenOwner.callAsync(erc721Token.address, nonexistentTokenId),
            ).to.be.equal(constants.NULL_ADDRESS);
        });
        it('should return the owner address when tokenId is owned', async () => {
            expect(
                await libAssetData.getERC721TokenOwner.callAsync(erc721Token.address, firstERC721TokenId),
            ).to.be.equal(tokenOwnerAddress);
        });
    });

    it('should query balance and allowance together, from asset data', async () => {
        const allowance = new BigNumber(1);
        await erc20Token.approve.awaitTransactionSuccessAsync(approvedSpenderAddress, allowance, {
            from: tokenOwnerAddress,
        });
        expect(
            await libAssetData.getBalanceAndAllowance.callAsync(
                tokenOwnerAddress,
                approvedSpenderAddress,
                await libAssetData.encodeERC20AssetData.callAsync(erc20Token.address),
            ),
        ).to.deep.equal([new BigNumber(erc20TokenTotalSupply), allowance]);
    });

    it('should query balances and allowances together, from an asset data array', async () => {
        const allowance = new BigNumber(1);
        await erc20Token.approve.awaitTransactionSuccessAsync(approvedSpenderAddress, allowance, {
            from: tokenOwnerAddress,
        });
        expect(
            await libAssetData.getBatchBalancesAndAllowances.callAsync(
                tokenOwnerAddress,
                [approvedSpenderAddress, approvedSpenderAddress],
                [await libAssetData.encodeERC20AssetData.callAsync(erc20Token.address)],
            ),
        ).to.deep.equal([[new BigNumber(erc20TokenTotalSupply)], [allowance]]);
    });
});
