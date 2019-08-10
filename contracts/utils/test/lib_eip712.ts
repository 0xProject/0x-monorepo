import { chaiSetup, constants, hexConcat, provider, txDefaults, web3Wrapper } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { BigNumber, signTypedDataUtils } from '@0x/utils';
import * as chai from 'chai';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { artifacts, TestLibEIP712Contract } from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

/**
 * Tests a specific instance of EIP712 domain hashing.
 * @param lib The LibEIP712 contract to call.
 * @param name The name of the domain.
 * @param version The version of the domain.
 * @param chainId The chain id of the domain.
 * @param verifyingContractAddress The verifying contract address of the domain.
 */
async function testHashEIP712DomainAsync(
    lib: TestLibEIP712Contract,
    name: string,
    version: string,
    chainId: number,
    verifyingContractAddress: string,
): Promise<void> {
    const expectedHash = signTypedDataUtils.generateDomainHash({
        name,
        version,
        chainId,
        verifyingContractAddress,
    });
    const actualHash = await lib.externalHashEIP712DomainSeperator.callAsync(
        name,
        version,
        new BigNumber(chainId),
        verifyingContractAddress,
    );
    expect(actualHash).to.be.eq(hexConcat(expectedHash));
}

describe('LibEIP712', () => {
    let lib: TestLibEIP712Contract;

    before(async () => {
        await blockchainLifecycle.startAsync();
        // Deploy LibEIP712
        lib = await TestLibEIP712Contract.deployFrom0xArtifactAsync(artifacts.TestLibEIP712, provider, txDefaults);
    });

    after(async () => {
        await blockchainLifecycle.revertAsync();
    });

    /**
     * Tests a specific instance of EIP712 message hashing.
     * @param lib The LibEIP712 contract to call.
     * @param domainHash The hash of the EIP712 domain of this instance.
     * @param hashStruct The hash of the struct of this instance.
     */
    async function testHashEIP712MessageAsync(
        lib: TestLibEIP712Contract,
        domainHash: string,
        hashStruct: string,
    ): Promise<void> {
        // Remove the hex prefix from the domain hash and the hash struct
        const unprefixedDomainHash = domainHash.slice(2, domainHash.length);
        const unprefixedHashStruct = hashStruct.slice(2, hashStruct.length);

        // Hash the provided input to get the expected hash
        const input = '0x1901'.concat(unprefixedDomainHash.concat(unprefixedHashStruct));
        const expectedHash = '0x'.concat(ethUtil.sha3(input).toString('hex'));

        // Get the actual hash by calling the smart contract
        const actualHash = await lib.externalHashEIP712Message.callAsync(domainHash, hashStruct);

        // Verify that the actual hash matches the expected hash
        expect(actualHash).to.be.eq(expectedHash);
    }

    describe('_hashEIP712Domain', async () => {
        it('should correctly hash empty input', async () => {
            await testHashEIP712DomainAsync(lib, '', '', 0, constants.NULL_ADDRESS);
        });

        it('should correctly hash non-empty input', async () => {
            await testHashEIP712DomainAsync(lib, '_hashEIP712Domain', '1.0', 62, lib.address);
        });

        it('should correctly hash non-empty input', async () => {
            await testHashEIP712DomainAsync(lib, '_hashEIP712Domain', '2.0', 0, lib.address);
        });
    });

    describe('_hashEIP712Message', () => {
        it('should correctly hash empty input', async () => {
            await testHashEIP712MessageAsync(lib, constants.NULL_BYTES32, constants.NULL_BYTES32);
        });

        it('should correctly hash non-empty input', async () => {
            await testHashEIP712MessageAsync(
                lib,
                '0xb10e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d9fcbe2b7fa0cf6', // keccak256(abi.encode(1))
                '0x405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace', // keccak256(abi.encode(2))
            );
        });

        it('should correctly hash non-empty input', async () => {
            await testHashEIP712MessageAsync(
                lib,
                '0x405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace', // keccak256(abi.encode(2))
                '0xc2575a0e9e593c00f959f8c92f12db2869c3395a3b0502d05e2516446f71f85b', // keccak256(abi.encode(3))
            );
        });
    });
});
