import { artifacts, DevUtilsContract } from '@0x/contracts-dev-utils';
import { artifacts as exchangeArtifacts, ExchangeContract } from '@0x/contracts-exchange';
import { blockchainTests, constants, expect, orderHashUtils } from '@0x/contracts-test-utils';
import { Order } from '@0x/types';
import { BigNumber } from '@0x/utils';

blockchainTests('DevUtils.getOrderHash', env => {
    let devUtils: DevUtilsContract;
    let exchange: ExchangeContract;
    let chainId: number;

    before(async () => {
        chainId = await env.getChainIdAsync();

        exchange = await ExchangeContract.deployFrom0xArtifactAsync(
            exchangeArtifacts.Exchange,
            env.provider,
            env.txDefaults,
            exchangeArtifacts,
            new BigNumber(chainId),
        );
        devUtils = await DevUtilsContract.deployFrom0xArtifactAsync(
            artifacts.DevUtils,
            env.provider,
            env.txDefaults,
            artifacts,
            exchange.address,
            constants.NULL_ADDRESS,
        );
    });

    it('should return the order hash', async () => {
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
            exchangeAddress: exchange.address,
            chainId,
        };
        expect(await devUtils.getOrderHash(order, new BigNumber(chainId), exchange.address).callAsync()).to.be.equal(
            orderHashUtils.getOrderHashHex(order),
        );
    });
});
