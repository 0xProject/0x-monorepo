import { blockchainTests, constants, describe, expect, hexRandom } from '@0x/contracts-test-utils';
import { eip712Utils, orderHashUtils } from '@0x/order-utils';
import { Order } from '@0x/types';
import { BigNumber, signTypedDataUtils } from '@0x/utils';
import * as _ from 'lodash';

import { artifacts, TestLibsContract } from '../src';

blockchainTests('LibOrder', env => {
    const CHAIN_ID = 1337;
    let libsContract: TestLibsContract;

    const randomAddress = () => hexRandom(constants.ADDRESS_LENGTH);
    const randomHash = () => hexRandom(constants.WORD_LENGTH);
    const randomUint256 = () => new BigNumber(randomHash());
    const randomAssetData = () => hexRandom(36);

    const EMPTY_ORDER: Order = {
        domain: {
            verifyingContractAddress: constants.NULL_ADDRESS,
            chainId: 0,
        },
        senderAddress: constants.NULL_ADDRESS,
        makerAddress: constants.NULL_ADDRESS,
        takerAddress: constants.NULL_ADDRESS,
        makerFee: constants.ZERO_AMOUNT,
        takerFee: constants.ZERO_AMOUNT,
        makerAssetAmount: constants.ZERO_AMOUNT,
        takerAssetAmount: constants.ZERO_AMOUNT,
        makerAssetData: constants.NULL_BYTES,
        takerAssetData: constants.NULL_BYTES,
        makerFeeAssetData: constants.NULL_BYTES,
        takerFeeAssetData: constants.NULL_BYTES,
        salt: constants.ZERO_AMOUNT,
        feeRecipientAddress: constants.NULL_ADDRESS,
        expirationTimeSeconds: constants.ZERO_AMOUNT,
    };

    before(async () => {
        libsContract = await TestLibsContract.deployFrom0xArtifactAsync(
            artifacts.TestLibs,
            env.provider,
            env.txDefaults,
            new BigNumber(CHAIN_ID),
        );
    });

    /**
     * Tests the `getOrderHash()` function against a reference hash.
     */
    async function testGetOrderHashAsync(order: Order): Promise<void> {
        const expectedHash = orderHashUtils.getOrderHashHex(order);
        const actualHash = await libsContract.getOrderHash.callAsync(order);
        expect(actualHash).to.be.eq(expectedHash);
    }

    describe('getOrderHash', () => {
        it('should correctly hash an empty order', async () => {
            await testGetOrderHashAsync({
                ...EMPTY_ORDER,
                domain: {
                    verifyingContractAddress: libsContract.address,
                    chainId: 1337,
                },
            });
        });

        it('should correctly hash a non-empty order', async () => {
            await testGetOrderHashAsync({
                domain: {
                    verifyingContractAddress: libsContract.address,
                    chainId: 1337,
                },
                senderAddress: randomAddress(),
                makerAddress: randomAddress(),
                takerAddress: randomAddress(),
                makerFee: randomUint256(),
                takerFee: randomUint256(),
                makerAssetAmount: randomUint256(),
                takerAssetAmount: randomUint256(),
                makerAssetData: randomAssetData(),
                takerAssetData: randomAssetData(),
                makerFeeAssetData: randomAssetData(),
                takerFeeAssetData: randomAssetData(),
                salt: randomUint256(),
                feeRecipientAddress: randomAddress(),
                expirationTimeSeconds: randomUint256(),
            });
        });
    });

    /**
     * Tests the `_hashOrder()` function against a reference hash.
     */
    async function testHashOrderAsync(order: Order): Promise<void> {
        const typedData = eip712Utils.createOrderTypedData(order);
        const expectedHash = '0x'.concat(
            signTypedDataUtils.generateTypedDataHashWithoutDomain(typedData).toString('hex'),
        );
        const actualHash = await libsContract.hashOrder.callAsync(order);
        expect(actualHash).to.be.eq(expectedHash);
    }

    describe('hashOrder', () => {
        it('should correctly hash an empty order', async () => {
            await testHashOrderAsync(EMPTY_ORDER);
        });

        it('should correctly hash a non-empty order', async () => {
            await testHashOrderAsync({
                // The domain is not used in this test, so it's okay if it is left empty.
                domain: {
                    verifyingContractAddress: constants.NULL_ADDRESS,
                    chainId: 0,
                },
                senderAddress: randomAddress(),
                makerAddress: randomAddress(),
                takerAddress: randomAddress(),
                makerFee: randomUint256(),
                takerFee: randomUint256(),
                makerAssetAmount: randomUint256(),
                takerAssetAmount: randomUint256(),
                makerAssetData: randomAssetData(),
                takerAssetData: randomAssetData(),
                makerFeeAssetData: randomAssetData(),
                takerFeeAssetData: randomAssetData(),
                salt: randomUint256(),
                feeRecipientAddress: randomAddress(),
                expirationTimeSeconds: randomUint256(),
            });
        });
    });
});
