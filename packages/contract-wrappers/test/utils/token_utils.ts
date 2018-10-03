import { artifacts, wrappers } from '@0xproject/contracts';
import { generatePseudoRandomSalt } from '@0xproject/order-utils';
import { BigNumber } from '@0xproject/utils';

import { provider, txDefaults, web3Wrapper } from './web3_wrapper';

// Those addresses come from migrations. They're deterministic so it's relatively safe to hard-code them here.
// Before we were fetching them from the TokenRegistry but now we can't as it's deprecated and removed.
// TODO(albrow): Import these from the migrations package instead of hard-coding them.
const DUMMY_ERC_20_ADRESSES = [
    '0x6dfff22588be9b3ef8cf0ad6dc9b84796f9fb45f',
    '0xcfc18cec799fbd1793b5c43e773c98d4d61cc2db',
    '0xf22469f31527adc53284441bae1665a7b9214dba',
    '0x10add991de718a69dec2117cb6aa28098836511b',
    '0x8d61158a366019ac78db4149d75fff9dda51160d',
];

const DUMMY_ERC_721_ADRESSES = ['0x131855dda0aaff096f6854854c55a4debf61077a'];

export const tokenUtils = {
    getDummyERC20TokenAddresses(): string[] {
        return DUMMY_ERC_20_ADRESSES;
    },
    getDummyERC721TokenAddresses(): string[] {
        return DUMMY_ERC_721_ADRESSES;
    },
    async mintDummyERC721Async(address: string, tokenOwner: string): Promise<BigNumber> {
        const erc721 = new wrappers.DummyERC721TokenContract(
            artifacts.DummyERC721Token.compilerOutput.abi,
            address,
            provider,
            txDefaults,
        );
        const tokenId = generatePseudoRandomSalt();
        const txHash = await erc721.mint.sendTransactionAsync(tokenOwner, tokenId);
        web3Wrapper.awaitTransactionSuccessAsync(txHash);
        return tokenId;
    },
};
