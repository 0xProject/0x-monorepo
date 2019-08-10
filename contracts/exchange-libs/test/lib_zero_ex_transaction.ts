import { blockchainTests, constants, describe, expect, hexRandom } from '@0x/contracts-test-utils';
import { eip712Utils } from '@0x/order-utils';
import { ZeroExTransaction } from '@0x/types';
import { BigNumber, signTypedDataUtils } from '@0x/utils';
import * as _ from 'lodash';

import { artifacts, TestLibsContract } from '../src';

blockchainTests('LibZeroExTransaction', env => {
    const CHAIN_ID = 1337;
    let libsContract: TestLibsContract;

    const randomAddress = () => hexRandom(constants.ADDRESS_LENGTH);
    const randomHash = () => hexRandom(constants.WORD_LENGTH);
    const randomUint256 = () => new BigNumber(randomHash());
    const randomAssetData = () => hexRandom(36);

    const EMPTY_TRANSACTION: ZeroExTransaction = {
        salt: constants.ZERO_AMOUNT,
        expirationTimeSeconds: constants.ZERO_AMOUNT,
        signerAddress: constants.NULL_ADDRESS,
        data: constants.NULL_BYTES,
        domain: {
            verifyingContractAddress: constants.NULL_ADDRESS,
            chainId: 0,
        },
    };

    /**
     * Tests the `_hashZeroExTransaction()` function against a reference hash.
     */
    async function testHashZeroExTransactionAsync(transaction: ZeroExTransaction): Promise<void> {
        const typedData = eip712Utils.createZeroExTransactionTypedData(transaction);
        const expectedHash = '0x'.concat(
            signTypedDataUtils.generateTypedDataHashWithoutDomain(typedData).toString('hex'),
        );
        const actualHash = await libsContract.hashZeroExTransaction.callAsync(transaction);
        expect(actualHash).to.be.eq(expectedHash);
    }

    /**
     * Tests the `getTransactionHash()` function against a reference hash.
     */
    async function testGetTransactionHashAsync(transaction: ZeroExTransaction): Promise<void> {
        const typedData = eip712Utils.createZeroExTransactionTypedData(transaction);
        const expectedHash = '0x'.concat(signTypedDataUtils.generateTypedDataHash(typedData).toString('hex'));
        const actualHash = await libsContract.getTransactionHash.callAsync(transaction);
        expect(actualHash).to.be.eq(expectedHash);
    }

    before(async () => {
        libsContract = await TestLibsContract.deployFrom0xArtifactAsync(
            artifacts.TestLibs,
            env.provider,
            env.txDefaults,
            new BigNumber(CHAIN_ID),
        );
    });

    describe('getTransactionHash', () => {
        it('should correctly hash an empty transaction', async () => {
            await testGetTransactionHashAsync({
                ...EMPTY_TRANSACTION,
                domain: {
                    verifyingContractAddress: libsContract.address,
                    chainId: 1337,
                },
            });
        });

        it('should correctly hash a non-empty order', async () => {
            await testGetTransactionHashAsync({
                salt: randomUint256(),
                expirationTimeSeconds: randomUint256(),
                signerAddress: randomAddress(),
                data: randomAssetData(),
                domain: {
                    verifyingContractAddress: libsContract.address,
                    chainId: 1337,
                },
            });
        });
    });

    describe('hashOrder', () => {
        it('should correctly hash an empty order', async () => {
            await testHashZeroExTransactionAsync(EMPTY_TRANSACTION);
        });

        it('should correctly hash a non-empty order', async () => {
            await testHashZeroExTransactionAsync({
                salt: randomUint256(),
                expirationTimeSeconds: randomUint256(),
                signerAddress: randomAddress(),
                data: randomAssetData(),
                // The domain is not used in this test, so it's okay if it is left empty.
                domain: {
                    verifyingContractAddress: constants.NULL_ADDRESS,
                    chainId: 0,
                },
            });
        });
    });
});
