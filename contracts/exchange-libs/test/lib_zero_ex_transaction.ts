import { blockchainTests, constants, describe, expect, hexRandom } from '@0x/contracts-test-utils';
import { eip712Utils, transactionHashUtils } from '@0x/order-utils';
import { ZeroExTransaction } from '@0x/types';
import { BigNumber, signTypedDataUtils } from '@0x/utils';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { TestLibZeroExTransactionContract } from './wrappers';

import { artifacts } from './artifacts';

blockchainTests('LibZeroExTransaction', env => {
    let libZeroExTransactionContract: TestLibZeroExTransactionContract;

    const randomAddress = () => hexRandom(constants.ADDRESS_LENGTH);
    const randomHash = () => hexRandom(constants.WORD_LENGTH);
    const randomUint256 = () => new BigNumber(randomHash());
    const randomAssetData = () => hexRandom(36);

    const EMPTY_TRANSACTION: ZeroExTransaction = {
        salt: constants.ZERO_AMOUNT,
        expirationTimeSeconds: constants.ZERO_AMOUNT,
        gasPrice: constants.ZERO_AMOUNT,
        signerAddress: constants.NULL_ADDRESS,
        data: constants.NULL_BYTES,
        domain: {
            verifyingContract: constants.NULL_ADDRESS,
            chainId: 0,
        },
    };

    before(async () => {
        libZeroExTransactionContract = await TestLibZeroExTransactionContract.deployFrom0xArtifactAsync(
            artifacts.TestLibZeroExTransaction,
            env.provider,
            env.txDefaults,
            {},
        );
    });

    /**
     * Tests the `getTypedDataHash()` function against a reference hash.
     */
    async function testGetTypedDataHashAsync(transaction: ZeroExTransaction): Promise<void> {
        const expectedHash = transactionHashUtils.getTransactionHashHex(transaction);
        const domainHash = ethUtil.bufferToHex(
            signTypedDataUtils.generateDomainHash({
                ...transaction.domain,
                name: constants.EIP712_DOMAIN_NAME,
                version: constants.EIP712_DOMAIN_VERSION,
            }),
        );
        const actualHash = await libZeroExTransactionContract.getTypedDataHash(transaction, domainHash).callAsync();
        expect(actualHash).to.be.eq(expectedHash);
    }

    describe('getTypedDataHash', () => {
        it('should correctly hash an empty transaction', async () => {
            await testGetTypedDataHashAsync({
                ...EMPTY_TRANSACTION,
                domain: {
                    ...EMPTY_TRANSACTION.domain,
                    verifyingContract: libZeroExTransactionContract.address,
                },
            });
        });

        it('should correctly hash a non-empty transaction', async () => {
            await testGetTypedDataHashAsync({
                salt: randomUint256(),
                expirationTimeSeconds: randomUint256(),
                gasPrice: randomUint256(),
                signerAddress: randomAddress(),
                data: randomAssetData(),
                domain: {
                    ...EMPTY_TRANSACTION.domain,
                    verifyingContract: libZeroExTransactionContract.address,
                },
            });
        });
        it('transactionHash should differ if the domain hash is different', async () => {
            const domainHash1 = ethUtil.bufferToHex(
                signTypedDataUtils.generateDomainHash({
                    ...EMPTY_TRANSACTION.domain,
                    name: constants.EIP712_DOMAIN_NAME,
                    version: constants.EIP712_DOMAIN_VERSION,
                }),
            );
            const domainHash2 = ethUtil.bufferToHex(
                signTypedDataUtils.generateDomainHash({
                    ...EMPTY_TRANSACTION.domain,
                    name: constants.EIP712_DOMAIN_NAME,
                    version: constants.EIP712_DOMAIN_VERSION,
                    chainId: 1337,
                }),
            );
            const transactionHashHex1 = await libZeroExTransactionContract
                .getTypedDataHash(EMPTY_TRANSACTION, domainHash1)
                .callAsync();
            const transactionHashHex2 = await libZeroExTransactionContract
                .getTypedDataHash(EMPTY_TRANSACTION, domainHash2)
                .callAsync();
            expect(transactionHashHex1).to.be.not.equal(transactionHashHex2);
        });
    });

    /**
     * Tests the `getStructHash()` function against a reference hash.
     */
    async function testGetStructHashAsync(transaction: ZeroExTransaction): Promise<void> {
        const typedData = eip712Utils.createZeroExTransactionTypedData(transaction);
        const expectedHash = ethUtil.bufferToHex(signTypedDataUtils.generateTypedDataHashWithoutDomain(typedData));
        const actualHash = await libZeroExTransactionContract.getStructHash(transaction).callAsync();
        expect(actualHash).to.be.eq(expectedHash);
    }

    describe('getStructHash', () => {
        it('should correctly hash an empty transaction', async () => {
            await testGetStructHashAsync(EMPTY_TRANSACTION);
        });

        it('should correctly hash a non-empty transaction', async () => {
            await testGetStructHashAsync({
                salt: randomUint256(),
                expirationTimeSeconds: randomUint256(),
                gasPrice: randomUint256(),
                signerAddress: randomAddress(),
                data: randomAssetData(),
                // The domain is not used in this test, so it's okay if it is left empty.
                domain: {
                    verifyingContract: constants.NULL_ADDRESS,
                    chainId: 0,
                },
            });
        });
    });
});
