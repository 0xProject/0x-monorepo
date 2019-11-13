import { web3Wrapper } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import * as combinatorics from 'js-combinatorics';
import * as _ from 'lodash';

import { BalanceStore } from './balance_store';
import { TokenContracts, TokenContractsByName, TokenIds, TokenOwnersByName } from './types';

export class BlockchainBalanceStore extends BalanceStore {
    private readonly _tokenContracts: TokenContracts;
    private readonly _tokenIds: TokenIds;

    /**
     * Constructor.
     * @param tokenOwnersByName The addresses of token owners whose balances will be tracked.
     * @param tokenContractsByName The contracts of tokens to track.
     * @param tokenIds The tokenIds of ERC721 and ERC1155 assets to track.
     */
    public constructor(
        tokenOwnersByName: TokenOwnersByName,
        tokenContractsByName: Partial<TokenContractsByName>,
        tokenIds: Partial<TokenIds> = {},
    ) {
        super(tokenOwnersByName, tokenContractsByName);
        this._tokenContracts = {
            erc20: Object.values(tokenContractsByName.erc20 || {}),
            erc721: Object.values(tokenContractsByName.erc721 || {}),
            erc1155: Object.values(tokenContractsByName.erc1155 || {}),
        };
        this._tokenIds = {
            erc721: tokenIds.erc721 || {},
            erc1155: tokenIds.erc1155 || {},
        };
    }

    /**
     * Updates balances by querying on-chain values.
     */
    public async updateBalancesAsync(): Promise<void> {
        await Promise.all([
            this.updateEthBalancesAsync(),
            this.updateErc20BalancesAsync(),
            this.updateErc721BalancesAsync(),
            this.updateErc1155BalancesAsync(),
        ]);
    }

    /**
     * Updates ETH balances.
     */
    public async updateEthBalancesAsync(): Promise<void> {
        const ethBalances = _.zipObject(
            this._ownerAddresses,
            await Promise.all(this._ownerAddresses.map(address => web3Wrapper.getBalanceInWeiAsync(address))),
        );
        this._balances.eth = ethBalances;
    }

    /**
     * Updates ERC20 balances.
     */
    public async updateErc20BalancesAsync(): Promise<void> {
        const balances = await Promise.all(
            this._ownerAddresses.map(async account =>
                _.zipObject(
                    this._tokenContracts.erc20.map(token => token.address),
                    await Promise.all(this._tokenContracts.erc20.map(token => token.balanceOf(account).callAsync())),
                ),
            ),
        );
        this._balances.erc20 = _.zipObject(this._ownerAddresses, balances);
    }

    /**
     * Updates ERC721 balances.
     */
    public async updateErc721BalancesAsync(): Promise<void> {
        const erc721ContractsByAddress = _.zipObject(
            this._tokenContracts.erc721.map(contract => contract.address),
            this._tokenContracts.erc721,
        );

        this._balances.erc721 = {};
        for (const [tokenAddress, tokenIds] of Object.entries(this._tokenIds.erc721)) {
            for (const tokenId of tokenIds) {
                const tokenOwner = await erc721ContractsByAddress[tokenAddress].ownerOf(tokenId).callAsync();
                _.update(this._balances.erc721, [tokenOwner, tokenAddress], nfts => _.union([tokenId], nfts).sort());
            }
        }
    }

    /**
     * Updates ERC1155 balances.
     */
    public async updateErc1155BalancesAsync(): Promise<void> {
        const erc1155ContractsByAddress = _.zipObject(
            this._tokenContracts.erc1155.map(contract => contract.address),
            this._tokenContracts.erc1155,
        );

        for (const [tokenAddress, { fungible, nonFungible }] of Object.entries(this._tokenIds.erc1155)) {
            const contract = erc1155ContractsByAddress[tokenAddress];
            const tokenIds = [...fungible, ...nonFungible];
            if (this._ownerAddresses.length === 0 || tokenIds.length === 0) {
                continue;
            }

            const [_tokenIds, _tokenOwners] = _.unzip(
                combinatorics.cartesianProduct(tokenIds, this._ownerAddresses).toArray(),
            );
            const balances = await contract
                .balanceOfBatch(_tokenOwners as string[], _tokenIds as BigNumber[])
                .callAsync();

            let i = 0;
            for (const tokenOwner of this._ownerAddresses) {
                // Fungible tokens
                _.set(this._balances.erc1155, [tokenOwner, tokenAddress, 'fungible'], {});
                for (const tokenId of fungible) {
                    _.set(
                        this._balances.erc1155,
                        [tokenOwner, tokenAddress, 'fungible', tokenId.toString()],
                        balances[i++],
                    );
                }
                // Non-fungible tokens
                _.set(this._balances.erc1155, [tokenOwner, tokenAddress, 'nonFungible'], []);
                for (const tokenId of nonFungible) {
                    const isOwner = balances[i++];
                    if (isOwner.isEqualTo(1)) {
                        _.update(this._balances.erc1155, [tokenOwner, tokenAddress, 'nonFungible'], nfts =>
                            _.union([tokenId], nfts).sort(),
                        );
                    }
                }
            }
        }
    }
}
