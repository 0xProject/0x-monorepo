// TODO: change test titles to say "... from asset data"
import * as chai from 'chai';
import { LogWithDecodedArgs } from 'ethereum-types';

import {
    artifacts as erc1155Artifacts,
    ERC1155MintableContract,
    ERC1155TransferSingleEventArgs,
    IERC1155MintableContract,
} from '@0x/contracts-erc1155';
import { artifacts as erc20Artifacts, DummyERC20TokenContract, IERC20TokenContract } from '@0x/contracts-erc20';
import { artifacts as erc721Artifacts, DummyERC721TokenContract, IERC721TokenContract } from '@0x/contracts-erc721';
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

    let erc20TokenAddress: string;
    const erc20TokenTotalSupply = new BigNumber(1);

    let erc721TokenAddress: string;
    const firstERC721TokenId = new BigNumber(1);
    const numberOfERC721Tokens = 10;

    let erc1155MintableAddress: string;
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

        erc20TokenAddress = (await DummyERC20TokenContract.deployFrom0xArtifactAsync(
            erc20Artifacts.DummyERC20Token,
            provider,
            txDefaults,
            'Dummy',
            'DUM',
            new BigNumber(1),
            erc20TokenTotalSupply,
        )).address;

        const erc721TokenContract = await DummyERC721TokenContract.deployFrom0xArtifactAsync(
            erc721Artifacts.DummyERC721Token,
            provider,
            txDefaults,
            'Dummy',
            'DUM',
        );
        erc721TokenAddress = erc721TokenContract.address;
        // mint `numberOfERC721Tokens` tokens
        const transactionMinedPromises = [];
        for (let i = 0; i < numberOfERC721Tokens; i++) {
            transactionMinedPromises.push(
                web3Wrapper.awaitTransactionSuccessAsync(
                    await erc721TokenContract.mint.sendTransactionAsync(
                        tokenOwnerAddress,
                        firstERC721TokenId.plus(i - 1),
                    ),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                ),
            );
        }
        await Promise.all(transactionMinedPromises);

        const erc1155MintableContract = await ERC1155MintableContract.deployFrom0xArtifactAsync(
            erc1155Artifacts.ERC1155Mintable,
            provider,
            txDefaults,
        );
        erc1155MintableAddress = erc1155MintableContract.address;
        // Somewhat re-inventing the wheel here, but the prior art currently
        // exists only as an unexported test util in the erc1155 package
        // (Erc1155Wrapper.mintFungibleTokensAsync() in erc1155/test/utils/).
        // This is concise enough to justify duplication, but it sure is ugly.
        // tslint:disable-next-line no-unnecessary-type-assertion
        erc1155TokenId = ((await new LogDecoder(web3Wrapper, erc1155Artifacts).getTxWithDecodedLogsAsync(
            await erc1155MintableContract.create.sendTransactionAsync('uri:Dummy', /*isNonFungible:*/ false),
        )).logs[0] as LogWithDecodedArgs<ERC1155TransferSingleEventArgs>).args.id;
        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc1155MintableContract.mintFungible.sendTransactionAsync(
                erc1155TokenId,
                [tokenOwnerAddress],
                [new BigNumber(1)],
            ),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
    });

    async function setERC20AllowanceAsync(): Promise<any> {
        return web3Wrapper.awaitTransactionSuccessAsync(
            await new IERC20TokenContract(
                erc20Artifacts.IERC20Token.compilerOutput.abi,
                erc20TokenAddress,
                provider,
            ).approve.sendTransactionAsync(approvedSpenderAddress, new BigNumber(1), { from: tokenOwnerAddress }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
    }

    async function setERC721AllowanceAsync(): Promise<any> {
        return web3Wrapper.awaitTransactionSuccessAsync(
            await new IERC721TokenContract(
                erc721Artifacts.IERC721Token.compilerOutput.abi,
                erc721TokenAddress,
                provider,
            ).approve.sendTransactionAsync(approvedSpenderAddress, new BigNumber(1), { from: tokenOwnerAddress }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
    }

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
                await libAssetData.encodeERC20AssetData.callAsync(erc20TokenAddress),
            ),
        ).to.bignumber.equal(erc20TokenTotalSupply);
    });

    it('should query ERC721 balance by asset data', async () => {
        expect(
            await libAssetData.getBalance.callAsync(
                tokenOwnerAddress,
                await libAssetData.encodeERC721AssetData.callAsync(erc721TokenAddress, firstERC721TokenId),
            ),
        ).to.bignumber.equal(1);
    });

    it('should query ERC1155 balances by asset data', async () => {
        expect(
            await libAssetData.getBalance.callAsync(
                tokenOwnerAddress,
                await libAssetData.encodeERC1155AssetData.callAsync(
                    erc1155MintableAddress,
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
                        await libAssetData.encodeERC20AssetData.callAsync(erc20TokenAddress),
                        await libAssetData.encodeERC721AssetData.callAsync(erc721TokenAddress, firstERC721TokenId),
                    ],
                ),
            ),
        ).to.bignumber.equal(Math.min(erc20TokenTotalSupply.toNumber(), numberOfERC721Tokens));
    });

    it('should query ERC20 allowances by asset data', async () => {
        await setERC20AllowanceAsync();
        expect(
            await libAssetData.getAllowance.callAsync(
                tokenOwnerAddress,
                approvedSpenderAddress,
                await libAssetData.encodeERC20AssetData.callAsync(erc20TokenAddress),
            ),
        ).to.bignumber.equal(1);
    });

    it('should query ERC721 approval by asset data', async () => {
        await setERC721AllowanceAsync();
        expect(
            await libAssetData.getAllowance.callAsync(
                tokenOwnerAddress,
                approvedSpenderAddress,
                await libAssetData.encodeERC721AssetData.callAsync(erc721TokenAddress, firstERC721TokenId),
            ),
        ).to.bignumber.equal(1);
    });

    it('should query ERC721 approvalForAll by assetData', async () => {
        await web3Wrapper.awaitTransactionSuccessAsync(
            await new IERC721TokenContract(
                erc721Artifacts.IERC721Token.compilerOutput.abi,
                erc721TokenAddress,
                provider,
            ).setApprovalForAll.sendTransactionAsync(anotherApprovedSpenderAddress, true, {
                from: tokenOwnerAddress,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        expect(
            await libAssetData.getAllowance.callAsync(
                tokenOwnerAddress,
                anotherApprovedSpenderAddress,
                await libAssetData.encodeERC721AssetData.callAsync(erc721TokenAddress, firstERC721TokenId),
            ),
        ).to.bignumber.equal(1);
    });

    it('should query ERC1155 allowances by asset data', async () => {
        await web3Wrapper.awaitTransactionSuccessAsync(
            await new IERC1155MintableContract(
                erc1155Artifacts.IERC1155Mintable.compilerOutput.abi,
                erc1155MintableAddress,
                provider,
            ).setApprovalForAll.sendTransactionAsync(approvedSpenderAddress, true, { from: tokenOwnerAddress }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        expect(
            await libAssetData.getAllowance.callAsync(
                tokenOwnerAddress,
                approvedSpenderAddress,
                await libAssetData.encodeERC1155AssetData.callAsync(
                    erc1155MintableAddress,
                    [erc1155TokenId],
                    [new BigNumber(1)],
                    '0x',
                ),
            ),
        ).to.bignumber.equal(1);
    });

    it('should query multi-asset allowances by asset data', async () => {
        await setERC20AllowanceAsync();
        await setERC721AllowanceAsync();
        expect(
            await libAssetData.getAllowance.callAsync(
                tokenOwnerAddress,
                approvedSpenderAddress,
                await libAssetData.encodeMultiAssetData.callAsync(
                    [new BigNumber(1), new BigNumber(1)],
                    [
                        await libAssetData.encodeERC20AssetData.callAsync(erc20TokenAddress),
                        await libAssetData.encodeERC721AssetData.callAsync(erc721TokenAddress, firstERC721TokenId),
                    ],
                ),
            ),
        ).to.bignumber.equal(1);
        return;
    });

    it('should query balances for a batch of asset data strings', async () => {
        expect(
            await libAssetData.getBatchBalances.callAsync(tokenOwnerAddress, [
                await libAssetData.encodeERC20AssetData.callAsync(erc20TokenAddress),
                await libAssetData.encodeERC721AssetData.callAsync(erc721TokenAddress, firstERC721TokenId),
            ]),
        ).to.deep.equal([new BigNumber(erc20TokenTotalSupply), new BigNumber(1)]);
    });

    it('should query allowances for a batch of asset data strings', async () => {
        await setERC20AllowanceAsync();
        await setERC721AllowanceAsync();
        expect(
            await libAssetData.getBatchAllowances.callAsync(tokenOwnerAddress, approvedSpenderAddress, [
                await libAssetData.encodeERC20AssetData.callAsync(erc20TokenAddress),
                await libAssetData.encodeERC721AssetData.callAsync(erc721TokenAddress, firstERC721TokenId),
            ]),
        ).to.deep.equal([new BigNumber(1), new BigNumber(1)]);
    });

    describe('getERC721TokenOwner', async () => {
        it('should return the null address when tokenId is not owned', async () => {
            const nonexistentTokenId = new BigNumber(1234567890);
            expect(
                await libAssetData.getERC721TokenOwner.callAsync(erc721TokenAddress, nonexistentTokenId),
            ).to.be.equal(constants.NULL_ADDRESS);
        });
        it('should return the owner address when tokenId is owned', async () => {
            expect(
                await libAssetData.getERC721TokenOwner.callAsync(erc721TokenAddress, firstERC721TokenId),
            ).to.be.equal(tokenOwnerAddress);
        });
    });

    it('should query balance and allowance together, from asset data', async () => {
        await setERC20AllowanceAsync();
        expect(
            await libAssetData.getBalanceAndAllowance.callAsync(
                tokenOwnerAddress,
                approvedSpenderAddress,
                await libAssetData.encodeERC20AssetData.callAsync(erc20TokenAddress),
            ),
        ).to.deep.equal([new BigNumber(erc20TokenTotalSupply), new BigNumber(1)]);
    });

    it('should query balances and allowances together, from an asset data array', async () => {
        await setERC20AllowanceAsync();
        expect(
            await libAssetData.getBatchBalancesAndAllowances.callAsync(tokenOwnerAddress, approvedSpenderAddress, [
                await libAssetData.encodeERC20AssetData.callAsync(erc20TokenAddress),
            ]),
        ).to.deep.equal([[new BigNumber(erc20TokenTotalSupply)], [new BigNumber(1)]]);
    });
});
