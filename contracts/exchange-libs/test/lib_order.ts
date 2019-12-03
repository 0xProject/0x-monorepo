import { blockchainTests, constants, describe, expect, orderHashUtils } from '@0x/contracts-test-utils';
import { eip712Utils } from '@0x/order-utils';
import { Order } from '@0x/types';
import { BigNumber, hexRandom, signTypedDataUtils } from '@0x/utils';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { TestLibOrderContract } from './wrappers';

import { artifacts } from './artifacts';

blockchainTests('LibOrder', env => {
    let libOrderContract: TestLibOrderContract;

    const randomAddress = () => hexRandom(constants.ADDRESS_LENGTH);
    const randomHash = () => hexRandom(constants.WORD_LENGTH);
    const randomUint256 = () => new BigNumber(randomHash());
    const randomAssetData = () => hexRandom(36);

    const EMPTY_ORDER: Order = {
        exchangeAddress: constants.NULL_ADDRESS,
        chainId: 0,
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
        libOrderContract = await TestLibOrderContract.deployFrom0xArtifactAsync(
            artifacts.TestLibOrder,
            env.provider,
            env.txDefaults,
            {},
        );
    });

    /**
     * Tests the `getTypedDataHash()` function against a reference hash.
     */
    async function testGetTypedDataHashAsync(order: Order): Promise<void> {
        const expectedHash = orderHashUtils.getOrderHashHex(order);
        const domainHash = ethUtil.bufferToHex(
            signTypedDataUtils.generateDomainHash({
                chainId: order.chainId,
                verifyingContract: order.exchangeAddress,
                name: constants.EIP712_DOMAIN_NAME,
                version: constants.EIP712_DOMAIN_VERSION,
            }),
        );
        const actualHash = await libOrderContract.getTypedDataHash(order, domainHash).callAsync();
        expect(actualHash).to.be.eq(expectedHash);
    }

    describe('getTypedDataHash', () => {
        it('should correctly hash an empty order', async () => {
            await testGetTypedDataHashAsync({
                ...EMPTY_ORDER,
                exchangeAddress: libOrderContract.address,
            });
        });

        it('should correctly hash a non-empty order', async () => {
            await testGetTypedDataHashAsync({
                exchangeAddress: libOrderContract.address,
                chainId: 1337,
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

        it('orderHash should differ if the domain hash is different', async () => {
            const domainHash1 = ethUtil.bufferToHex(
                signTypedDataUtils.generateDomainHash({
                    chainId: EMPTY_ORDER.chainId,
                    verifyingContract: EMPTY_ORDER.exchangeAddress,
                    name: constants.EIP712_DOMAIN_NAME,
                    version: constants.EIP712_DOMAIN_VERSION,
                }),
            );
            const domainHash2 = ethUtil.bufferToHex(
                signTypedDataUtils.generateDomainHash({
                    verifyingContract: EMPTY_ORDER.exchangeAddress,
                    name: constants.EIP712_DOMAIN_NAME,
                    version: constants.EIP712_DOMAIN_VERSION,
                    chainId: 1337,
                }),
            );
            const orderHashHex1 = await libOrderContract.getTypedDataHash(EMPTY_ORDER, domainHash1).callAsync();
            const orderHashHex2 = await libOrderContract.getTypedDataHash(EMPTY_ORDER, domainHash2).callAsync();
            expect(orderHashHex1).to.be.not.equal(orderHashHex2);
        });
    });

    /**
     * Tests the `getStructHash()` function against a reference hash.
     */
    async function testGetStructHashAsync(order: Order): Promise<void> {
        const typedData = eip712Utils.createOrderTypedData(order);
        const expectedHash = ethUtil.bufferToHex(signTypedDataUtils.generateTypedDataHashWithoutDomain(typedData));
        const actualHash = await libOrderContract.getStructHash(order).callAsync();
        expect(actualHash).to.be.eq(expectedHash);
    }

    describe('getStructHash', () => {
        it('should correctly hash an empty order', async () => {
            await testGetStructHashAsync(EMPTY_ORDER);
        });

        it('should correctly hash a non-empty order', async () => {
            await testGetStructHashAsync({
                // The domain is not used in this test, so it's okay if it is left empty.
                exchangeAddress: constants.NULL_ADDRESS,
                chainId: 0,
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
