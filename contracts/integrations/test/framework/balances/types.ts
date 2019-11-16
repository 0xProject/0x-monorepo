import { ERC1155MintableContract } from '@0x/contracts-erc1155';
import { DummyERC20TokenContract, DummyNoReturnERC20TokenContract, WETH9Contract } from '@0x/contracts-erc20';
import { DummyERC721TokenContract } from '@0x/contracts-erc721';
import { BigNumber } from '@0x/utils';

// alias for clarity
type address = string;

export interface TokenData<TERC20, TERC721, TERC1155> {
    erc20: TERC20;
    erc721: TERC721;
    erc1155: TERC1155;
}

export type TokenAddresses = TokenData<address[], address[], address[]>;

export type TokenContracts = TokenData<
    Array<DummyERC20TokenContract | DummyNoReturnERC20TokenContract | WETH9Contract>,
    DummyERC721TokenContract[],
    ERC1155MintableContract[]
>;

export interface Named<T> {
    [readableName: string]: T;
}

export type TokenOwnersByName = Named<address>;

export type TokenAddressesByName = TokenData<Named<address>, Named<address>, Named<address>>;

export type TokenContractsByName = TokenData<
    Named<DummyERC20TokenContract | DummyNoReturnERC20TokenContract | WETH9Contract>,
    Named<DummyERC721TokenContract>,
    Named<ERC1155MintableContract>
>;

export interface ERC721TokenIds {
    [tokenAddress: string]: BigNumber[];
}

export interface ERC1155TokenIds {
    [tokenAddress: string]: {
        fungible: BigNumber[];
        nonFungible: BigNumber[];
    };
}

export interface TokenIds {
    erc721: ERC721TokenIds;
    erc1155: ERC1155TokenIds;
}
