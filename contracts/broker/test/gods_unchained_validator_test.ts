import { blockchainTests, constants, expect, getRandomInteger } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { encodePropertyData } from '../src/gods_unchained_utils';

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
        const propertyData = encodePropertyData({ proto, quality });

        it('succeeds if assetData proto and quality match propertyData', async () => {
            const tokenId = getRandomInteger(0, constants.MAX_UINT256);
            await godsUnchained.setTokenProperties(tokenId, proto, quality).awaitTransactionSuccessAsync();
            await validator.checkBrokerAsset(tokenId, propertyData).callAsync();
        });
        it("reverts if assetData proto doesn't match propertyData", async () => {
            const tokenId = getRandomInteger(0, constants.MAX_UINT256);
            await godsUnchained.setTokenProperties(tokenId, proto.plus(1), quality).awaitTransactionSuccessAsync();
            const tx = validator.checkBrokerAsset(tokenId, propertyData).callAsync();
            expect(tx).to.revertWith('GodsUnchainedValidator/PROTO_MISMATCH');
        });
        it("reverts if assetData quality doesn't match proeprtyData", async () => {
            const tokenId = getRandomInteger(0, constants.MAX_UINT256);
            await godsUnchained.setTokenProperties(tokenId, proto, quality.plus(1)).awaitTransactionSuccessAsync();
            const tx = validator.checkBrokerAsset(tokenId, propertyData).callAsync();
            expect(tx).to.revertWith('GodsUnchainedValidator/QUALITY_MISMATCH');
        });
    });
});
