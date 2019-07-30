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
    const input = '0x1901'.concat(
        domainHash.slice(2, domainHash.length).concat(hashStruct.slice(2, hashStruct.length)),
    );
    const expectedHash = '0x'.concat(ethUtil.sha3(input).toString('hex'));
    const actualHash = await lib.externalHashEIP712Message.callAsync(domainHash, hashStruct);
    expect(actualHash).to.be.eq(expectedHash);
}

describe('LibEIP712', () => {
    let lib: TestLibEIP712Contract;

    before(async () => {
        await blockchainLifecycle.startAsync();
        // Deploy SafeMath
        lib = await TestLibEIP712Contract.deployFrom0xArtifactAsync(artifacts.TestLibEIP712, provider, txDefaults);
    });

    after(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('_hashEIP712Domain', async () => {
        it('should correctly hash empty input', async () => {
            await testHashEIP712DomainAsync(lib, '', '', 0, constants.NULL_ADDRESS);
        });
    });

    describe('_hashEIP712Message', () => {
        it('should correctly hash empty input', async () => {
            /*
            const expectedHash = hashEIP712Message(constants.NULL_BYTES32, constants.NULL_BYTES32);
            const actualHash = await lib.externalHashEIP712Message.callAsync(constants.NULL_BYTES32, constants.NULL_BYTES32);
            expect(actualHash).to.be.eq(expectedHash);
             */
            await testHashEIP712MessageAsync(lib, constants.NULL_BYTES32, constants.NULL_BYTES32);
        });
    });
});
