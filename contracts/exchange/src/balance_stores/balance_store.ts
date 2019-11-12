import { BaseContract } from '@0x/base-contract';
import { expect, TokenBalances } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { TokenAddresses, TokenContractsByName, TokenOwnersByName } from './types';

export class BalanceStore {
    protected _balances: TokenBalances;
    protected _tokenAddresses: TokenAddresses;
    protected _ownerAddresses: string[];
    private _addressNames: {
        [address: string]: string;
    };

    /**
     * Constructor.
     * @param tokenOwnersByName Addresses of token owners to track balances of.
     * @param tokenContractsByName Contracts of tokens to track balances of.
     */
    public constructor(tokenOwnersByName: TokenOwnersByName, tokenContractsByName: Partial<TokenContractsByName>) {
        this._balances = { erc20: {}, erc721: {}, erc1155: {}, eth: {} };
        this._ownerAddresses = Object.values(tokenOwnersByName);

        _.defaults(tokenContractsByName, { erc20: {}, erc721: {}, erc1155: {} });
        const tokenAddressesByName = _.mapValues(
            { ...tokenContractsByName.erc20, ...tokenContractsByName.erc721, ...tokenContractsByName.erc1155 },
            contract => (contract as BaseContract).address,
        );
        this._addressNames = _.invert({ ...tokenOwnersByName, ...tokenAddressesByName });

        this._tokenAddresses = {
            erc20: Object.values(tokenContractsByName.erc20 || {}).map(contract => contract.address),
            erc721: Object.values(tokenContractsByName.erc721 || {}).map(contract => contract.address),
            erc1155: Object.values(tokenContractsByName.erc1155 || {}).map(contract => contract.address),
        };
    }

    /**
     * Throws iff balance stores do not have the same entries.
     * @param rhs Balance store to compare to
     */
    public assertEquals(rhs: BalanceStore): void {
        this._assertEthBalancesEqual(rhs);
        this._assertErc20BalancesEqual(rhs);
        this._assertErc721BalancesEqual(rhs);
        this._assertErc1155BalancesEqual(rhs);
    }

    /**
     * Copies from an existing balance store.
     * @param balanceStore to copy from.
     */
    public cloneFrom(balanceStore: BalanceStore): void {
        this._balances = _.cloneDeep(balanceStore._balances);
        this._tokenAddresses = _.cloneDeep(balanceStore._tokenAddresses);
        this._ownerAddresses = _.cloneDeep(balanceStore._ownerAddresses);
        this._addressNames = _.cloneDeep(balanceStore._addressNames);
    }

    /**
     * Returns the human-readable name for the given address, if it exists.
     * @param address The address to get the name for.
     */
    private _readableAddressName(address: string): string {
        return this._addressNames[address] || address;
    }

    /**
     * Throws iff balance stores do not have the same ETH balances.
     * @param rhs Balance store to compare to
     */
    private _assertEthBalancesEqual(rhs: BalanceStore): void {
        for (const ownerAddress of [...this._ownerAddresses, ...rhs._ownerAddresses]) {
            const thisBalance = _.get(this._balances.eth, [ownerAddress], new BigNumber(0));
            const rhsBalance = _.get(rhs._balances.eth, [ownerAddress], new BigNumber(0));
            expect(thisBalance, `${this._readableAddressName(ownerAddress)} ETH balance`).to.bignumber.equal(
                rhsBalance,
            );
        }
    }

    /**
     * Throws iff balance stores do not have the same ERC20 balances.
     * @param rhs Balance store to compare to
     */
    private _assertErc20BalancesEqual(rhs: BalanceStore): void {
        for (const ownerAddress of [...this._ownerAddresses, ...rhs._ownerAddresses]) {
            for (const tokenAddress of [...this._tokenAddresses.erc20, ...rhs._tokenAddresses.erc20]) {
                const thisBalance = _.get(this._balances.erc20, [ownerAddress, tokenAddress], new BigNumber(0));
                const rhsBalance = _.get(rhs._balances.erc20, [ownerAddress, tokenAddress], new BigNumber(0));
                expect(
                    thisBalance,
                    `${this._readableAddressName(ownerAddress)} ${this._readableAddressName(tokenAddress)} balance`,
                ).to.bignumber.equal(rhsBalance);
            }
        }
    }

    /**
     * Throws iff balance stores do not have the same ERC721 balances.
     * @param rhs Balance store to compare to
     */
    private _assertErc721BalancesEqual(rhs: BalanceStore): void {
        for (const ownerAddress of [...this._ownerAddresses, ...rhs._ownerAddresses]) {
            for (const tokenAddress of [...this._tokenAddresses.erc721, ...rhs._tokenAddresses.erc721]) {
                const thisBalance = _.get(this._balances.erc721, [ownerAddress, tokenAddress], []);
                const rhsBalance = _.get(rhs._balances.erc721, [ownerAddress, tokenAddress], []);
                expect(
                    thisBalance,
                    `${this._readableAddressName(ownerAddress)} ${this._readableAddressName(tokenAddress)} balance`,
                ).to.deep.equal(rhsBalance);
            }
        }
    }

    /**
     * Throws iff balance stores do not have the same ERC1155 balances.
     * @param rhs Balance store to compare to
     */
    private _assertErc1155BalancesEqual(rhs: BalanceStore): void {
        for (const ownerAddress of [...this._ownerAddresses, ...rhs._ownerAddresses]) {
            for (const tokenAddress of [...this._tokenAddresses.erc1155, ...rhs._tokenAddresses.erc1155]) {
                const thisBalance = _.get(this._balances.erc1155, [ownerAddress, tokenAddress], {});
                const rhsBalance = _.get(rhs._balances.erc1155, [ownerAddress, tokenAddress], {});
                expect(
                    thisBalance,
                    `${this._readableAddressName(ownerAddress)} ${this._readableAddressName(tokenAddress)} balance`,
                ).to.deep.equal(rhsBalance);
            }
        }
    }
}
