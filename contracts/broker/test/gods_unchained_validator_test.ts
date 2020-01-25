import { blockchainTests, constants, expect, getRandomInteger, randomAddress } from '@0x/contracts-test-utils';
import { assetDataUtils } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { godsUnchainedUtils } from '../src/gods_unchained_utils';

import { artifacts } from './artifacts';
import { GodsUnchainedValidatorContract, TestGodsUnchainedContract } from './wrappers';

blockchainTests.resets('GodsUnchainedValidator unit tests', env => {
    let godsUnchained: TestGodsUnchainedContract;
    let validator: GodsUnchainedValidatorContract;

    before(async () => {
        godsUnchained = await TestGodsUnchainedContract.deployFrom0xArtifactAsync(
            artifacts.TestGodsUnchained,
            env.provider,
            env.txDefaults,
            artifacts,
            'Gods Unchained Cards',
            'GU',
        );

        validator = await GodsUnchainedValidatorContract.deployFrom0xArtifactAsync(
            artifacts.GodsUnchainedValidator,
            env.provider,
            env.txDefaults,
            artifacts,
            godsUnchained.address,
        );
    });

    describe('checkBrokerAsset', () => {
        const proto = new BigNumber(42);
        const quality = new BigNumber(7);
        const propertyData = godsUnchainedUtils.encodePropertyData(proto, quality);

        it('succeeds if assetData proto and quality match propertyData', async () => {
            const tokenId = getRandomInteger(0, constants.MAX_UINT256);
            await godsUnchained.setTokenProperties(tokenId, proto, quality).awaitTransactionSuccessAsync();
            const assetData = assetDataUtils.encodeERC721AssetData(godsUnchained.address, tokenId);
            await validator.checkBrokerAsset(assetData, propertyData).callAsync();
        });
        it('reverts if assetData tokenAddress is not the GU contract address', async () => {
            const tokenId = getRandomInteger(0, constants.MAX_UINT256);
            await godsUnchained.setTokenProperties(tokenId, proto, quality).awaitTransactionSuccessAsync();
            const assetData = assetDataUtils.encodeERC721AssetData(randomAddress(), tokenId);
            const tx = validator.checkBrokerAsset(assetData, propertyData).callAsync();
            expect(tx).to.revertWith('TOKEN_ADDRESS_MISMATCH');
        });
        it("reverts if assetData proto doesn't match propertyData", async () => {
            const tokenId = getRandomInteger(0, constants.MAX_UINT256);
            await godsUnchained.setTokenProperties(tokenId, proto.plus(1), quality).awaitTransactionSuccessAsync();
            const assetData = assetDataUtils.encodeERC721AssetData(godsUnchained.address, tokenId);
            const tx = validator.checkBrokerAsset(assetData, propertyData).callAsync();
            expect(tx).to.revertWith('PROTO_MISMATCH');
        });
        it("reverts if assetData quality doesn't match proeprtyData", async () => {
            const tokenId = getRandomInteger(0, constants.MAX_UINT256);
            await godsUnchained.setTokenProperties(tokenId, proto, quality.plus(1)).awaitTransactionSuccessAsync();
            const assetData = assetDataUtils.encodeERC721AssetData(godsUnchained.address, tokenId);
            const tx = validator.checkBrokerAsset(assetData, propertyData).callAsync();
            expect(tx).to.revertWith('QUALITY_MISMATCH');
        });
    });
});
