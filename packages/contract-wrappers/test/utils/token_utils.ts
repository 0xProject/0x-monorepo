import { generatePseudoRandomSalt } from '@0xproject/order-utils';
import { BigNumber } from '@0xproject/utils';

import { artifacts } from '../../src/artifacts';
import { DummyERC721TokenContract } from '../../src/contract_wrappers/generated/dummy_erc721_token';

import { constants } from './constants';
import { provider, txDefaults, web3Wrapper } from './web3_wrapper';

const DUMMY_ERC_20_ADRESSES = [
    '0x07f96aa816c1f244cbc6ef114bb2b023ba54a2eb',
    '0x6a4a62e5a7ed13c361b176a5f62c2ee620ac0df8',
    '0x6dfff22588be9b3ef8cf0ad6dc9b84796f9fb45f',
    '0xcfc18cec799fbd1793b5c43e773c98d4d61cc2db',
    '0xf22469f31527adc53284441bae1665a7b9214dba',
];

const DUMMY_ERC_721_ADRESSES = ['0x10add991de718a69dec2117cb6aa28098836511b'];

export const tokenUtils = {
    getProtocolTokenAddress(): string {
        return artifacts.ZRXToken.networks[constants.TESTRPC_NETWORK_ID].address;
    },
    getWethTokenAddress(): string {
        return artifacts.EtherToken.networks[constants.TESTRPC_NETWORK_ID].address;
    },
    getDummyERC20TokenAddresses(): string[] {
        return DUMMY_ERC_20_ADRESSES;
    },
    getDummyERC721TokenAddresses(): string[] {
        return DUMMY_ERC_721_ADRESSES;
    },
    async mintDummyERC721Async(address: string, tokenOwner: string): Promise<BigNumber> {
        const erc721 = new DummyERC721TokenContract(
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
