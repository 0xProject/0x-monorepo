import { blockchainTests, constants, expect, randomAddress } from '@0x/contracts-test-utils';
import { BigNumber, signTypedDataUtils } from '@0x/utils';
import * as ethUtil from 'ethereumjs-util';

import { artifacts, TestLibEIP712ExchangeDomainContract } from '../src';

blockchainTests('LibEIP712ExchangeDomain', env => {
    describe('constructor', () => {
        it('should calculate the correct domain hash when verifyingContractAddressIfExists is set to null', async () => {
            const chainId = 1;
            const libEIP712ExchangeDomainContract = await TestLibEIP712ExchangeDomainContract.deployFrom0xArtifactAsync(
                artifacts.TestLibEIP712ExchangeDomain,
                env.provider,
                env.txDefaults,
                {},
                new BigNumber(chainId),
                constants.NULL_ADDRESS,
            );
            const domain = {
                verifyingContractAddress: libEIP712ExchangeDomainContract.address,
                chainId,
                name: constants.EIP712_DOMAIN_NAME,
                version: constants.EIP712_DOMAIN_VERSION,
            };
            const expectedDomainHash = ethUtil.bufferToHex(signTypedDataUtils.generateDomainHash(domain));
            const actualDomainHash = await libEIP712ExchangeDomainContract.EIP712_EXCHANGE_DOMAIN_HASH.callAsync();
            expect(actualDomainHash).to.be.equal(expectedDomainHash);
        });
        it('should calculate the correct domain hash when verifyingContractAddressIfExists is set to a non-null address', async () => {
            const chainId = 1;
            const verifyingContractAddress = randomAddress();
            const libEIP712ExchangeDomainContract = await TestLibEIP712ExchangeDomainContract.deployFrom0xArtifactAsync(
                artifacts.TestLibEIP712ExchangeDomain,
                env.provider,
                env.txDefaults,
                {},
                new BigNumber(chainId),
                verifyingContractAddress,
            );
            const domain = {
                verifyingContractAddress,
                chainId,
                name: constants.EIP712_DOMAIN_NAME,
                version: constants.EIP712_DOMAIN_VERSION,
            };
            const expectedDomainHash = ethUtil.bufferToHex(signTypedDataUtils.generateDomainHash(domain));
            const actualDomainHash = await libEIP712ExchangeDomainContract.EIP712_EXCHANGE_DOMAIN_HASH.callAsync();
            expect(actualDomainHash).to.be.equal(expectedDomainHash);
        });
    });
});
