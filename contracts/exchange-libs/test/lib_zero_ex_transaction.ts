import { addressUtils, blockchainTests, constants, describe, expect } from '@0x/contracts-test-utils';
import { transactionHashUtils } from '@0x/order-utils';
import { ZeroExTransaction } from '@0x/types';
import { BigNumber, signTypedDataUtils } from '@0x/utils';
import * as ethUtil from 'ethereumjs-util';

import { artifacts, TestLibZeroExTransactionContract } from '../src';

blockchainTests('LibZeroExTransaction', env => {
    let libZeroExTransactionContract: TestLibZeroExTransactionContract;
    let zeroExTransaction: ZeroExTransaction;
    before(async () => {
        libZeroExTransactionContract = await TestLibZeroExTransactionContract.deployFrom0xArtifactAsync(
            artifacts.TestLibZeroExTransaction,
            env.provider,
            env.txDefaults,
        );
        const domain = {
            verifyingContractAddress: libZeroExTransactionContract.address,
            chainId: 1,
        };
        zeroExTransaction = {
            signerAddress: addressUtils.generatePseudoRandomAddress(),
            salt: new BigNumber(0),
            expirationTimeSeconds: new BigNumber(0),
            data: constants.NULL_BYTES,
            domain,
        };
    });

    describe('LibZeroExTransaction', () => {
        describe('getTransactionHash', () => {
            it('should return the correct transactionHash', async () => {
                const domainHash = ethUtil.bufferToHex(
                    signTypedDataUtils.generateDomainHash({
                        ...zeroExTransaction.domain,
                        name: constants.EIP712_DOMAIN_NAME,
                        version: constants.EIP712_DOMAIN_VERSION,
                    }),
                );
                const orderHashHex = await libZeroExTransactionContract.getZeroExTransactionHash.callAsync(
                    zeroExTransaction,
                    domainHash,
                );
                expect(transactionHashUtils.getTransactionHashHex(zeroExTransaction)).to.be.equal(orderHashHex);
            });
            it('transactionHash should differ if the domain hash is different', async () => {
                const domainHash1 = ethUtil.bufferToHex(
                    signTypedDataUtils.generateDomainHash({
                        ...zeroExTransaction.domain,
                        name: constants.EIP712_DOMAIN_NAME,
                        version: constants.EIP712_DOMAIN_VERSION,
                    }),
                );
                const domainHash2 = ethUtil.bufferToHex(
                    signTypedDataUtils.generateDomainHash({
                        ...zeroExTransaction.domain,
                        name: constants.EIP712_DOMAIN_NAME,
                        version: constants.EIP712_DOMAIN_VERSION,
                        chainId: 1337,
                    }),
                );
                const transactionHashHex1 = await libZeroExTransactionContract.getZeroExTransactionHash.callAsync(
                    zeroExTransaction,
                    domainHash1,
                );
                const transactionHashHex2 = await libZeroExTransactionContract.getZeroExTransactionHash.callAsync(
                    zeroExTransaction,
                    domainHash2,
                );
                expect(transactionHashHex1).to.be.not.equal(transactionHashHex2);
            });
        });
    });
});
