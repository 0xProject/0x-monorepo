import { generatePseudoRandomSalt } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';

import { DummyERC721TokenContract } from '@0x/contract-wrappers';

import { provider, txDefaults, web3Wrapper } from './web3_wrapper';

// Those addresses come from migrations. They're deterministic so it's relatively safe to hard-code them here.
// Before we were fetching them from the TokenRegistry but now we can't as it's deprecated and removed.
// TODO(albrow): Import these from the migrations package instead of hard-coding them.
const DUMMY_ERC_20_ADRESSES = [
    '0x34d402f14d58e001d8efbe6585051bf9706aa064',
    '0x25b8fe1de9daf8ba351890744ff28cf7dfa8f5e3',
    '0xcdb594a32b1cc3479d8746279712c39d18a07fc0',
    '0x1e2f9e10d02a6b8f8f69fcbf515e75039d2ea30d',
    '0xbe0037eaf2d64fe5529bca93c18c9702d3930376',
];

const DUMMY_ERC_721_ADRESSES = ['0x07f96aa816c1f244cbc6ef114bb2b023ba54a2eb'];

export const tokenUtils = {
    getDummyERC20TokenAddresses(): string[] {
        return DUMMY_ERC_20_ADRESSES;
    },
    getDummyERC721TokenAddresses(): string[] {
        return DUMMY_ERC_721_ADRESSES;
    },
    async mintDummyERC721Async(address: string, tokenOwner: string): Promise<BigNumber> {
        const erc721 = new DummyERC721TokenContract(address, provider, txDefaults);
        const tokenId = generatePseudoRandomSalt();
        const txHash = await erc721.mint(tokenOwner, tokenId).sendTransactionAsync();
        web3Wrapper.awaitTransactionSuccessAsync(txHash);
        return tokenId;
    },
};
