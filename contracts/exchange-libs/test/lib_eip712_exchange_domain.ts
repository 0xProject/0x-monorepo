import { blockchainTests, constants, describe, expect, hexRandom } from '@0x/contracts-test-utils';
import { eip712Utils, orderHashUtils } from '@0x/order-utils';
import { Order } from '@0x/types';
import { BigNumber, signTypedDataUtils } from '@0x/utils';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { artifacts, TestLibsContract } from '../src';

blockchainTests('LibEIP712ExchangeDomain', env => {
    let libsContract: TestLibsContract;
    let exchangeDomainHash: string;
    const CHAIN_ID = 1337;

    // Random generator functions
    const randomAddress = () => hexRandom(constants.ADDRESS_LENGTH);
    const randomHash = () => hexRandom(constants.WORD_LENGTH);

    /**
     * Tests a specific instance of EIP712 message hashing.
     * @param lib The LibEIP712 contract to call.
     * @param domainHash The hash of the EIP712 domain of this instance.
     * @param hashStruct The hash of the struct of this instance.
     */
    async function testHashEIP712MessageAsync(hashStruct: string): Promise<void> {
        // Remove the hex-prefix from the exchangeDomainHash and the hashStruct
        const unprefixedHashStruct = hashStruct.slice(2, hashStruct.length);

        // Hash the provided input to get the expected hash
        const input = '0x1901'.concat(exchangeDomainHash, unprefixedHashStruct);
        const expectedHash = '0x'.concat(ethUtil.sha3(input).toString('hex'));

        // Get the actual hash by calling the smart contract
        const actualHash = await libsContract.hashEIP712ExchangeMessage.callAsync(hashStruct);

        // Verify that the actual hash matches the expected hash
        expect(actualHash).to.be.eq(expectedHash);
    }

    before(async () => {
        libsContract = await TestLibsContract.deployFrom0xArtifactAsync(
            artifacts.TestLibs,
            env.provider,
            env.txDefaults,
            new BigNumber(CHAIN_ID),
        );

        // Generate the domain hash of 0x Exchange V3
        exchangeDomainHash = signTypedDataUtils
            .generateDomainHash({
                name: '0x Protocol',
                version: '3.0.0',
                chainId: CHAIN_ID,
                verifyingContractAddress: libsContract.address,
            })
            .toString('hex');
    });

    describe('hashEIP712ExchangeMessage', () => {
        it('should correctly match an empty hash', async () => {
            await testHashEIP712MessageAsync(constants.NULL_BYTES32);
        });

        it('should correctly match a non-empty hash', async () => {
            await testHashEIP712MessageAsync(randomHash());
        });
    });
});
