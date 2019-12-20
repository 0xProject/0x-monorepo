import { artifacts, DevUtilsContract } from '@0x/contracts-dev-utils';
import { blockchainTests, constants, expect } from '@0x/contracts-test-utils';
import { Order } from '@0x/types';
import { BigNumber } from '@0x/utils';

blockchainTests('DevUtils.getOrderHash', env => {
    let devUtils: DevUtilsContract;

    before(async () => {
        devUtils = await DevUtilsContract.deployFrom0xArtifactAsync(
            artifacts.DevUtils,
            env.provider,
            env.txDefaults,
            artifacts,
            constants.NULL_ADDRESS,
        );
    });

    it('should return the order hash', async () => {
        const expectedOrderHash = '0x331cb7e07a757bae130702da6646c26531798c92bcfaf671817268fd2c188531';
        const exchangeAddress = '0x1dc4c1cefef38a777b15aa20260a54e584b16c48';
        const chainId = 50;
        const order: Order = {
            makerAddress: constants.NULL_ADDRESS,
            takerAddress: constants.NULL_ADDRESS,
            senderAddress: constants.NULL_ADDRESS,
            feeRecipientAddress: constants.NULL_ADDRESS,
            makerAssetData: constants.NULL_ADDRESS,
            takerAssetData: constants.NULL_ADDRESS,
            makerFeeAssetData: constants.NULL_ADDRESS,
            takerFeeAssetData: constants.NULL_ADDRESS,
            salt: new BigNumber(0),
            makerFee: new BigNumber(0),
            takerFee: new BigNumber(0),
            makerAssetAmount: new BigNumber(0),
            takerAssetAmount: new BigNumber(0),
            expirationTimeSeconds: new BigNumber(0),
            exchangeAddress,
            chainId,
        };
        expect(await devUtils.getOrderHash(order, new BigNumber(chainId), exchangeAddress).callAsync()).to.be.equal(
            expectedOrderHash,
        );
    });
});
