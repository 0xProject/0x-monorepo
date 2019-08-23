import { ERC1155Holdings, ERC1155HoldingsByOwner, TokenBalances } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

/**
 * Note - this should live in `@0x/contracts-test-utils` but that would create a circular
 * dependency in `BlockchainBlanceStore`. We should be able to mvoe this once we can rely
 * solely on auto-generated wrappers opposed to the existing ERC20Wrapper, ERC721Wrapper,
 * and ERC1155Wrapper.
 */
export class BalanceStore {
    protected _balances: TokenBalances;

    /**
     * Returns true iff balance stores do have the same entries.
     * @param lhs First balance store to compare
     * @param rhs Second balance store to compare
     */
    public static isEqual(lhs: BalanceStore, rhs: BalanceStore): boolean {
        return _.isEqual(lhs.getRawBalances(), rhs.getRawBalances());
    }

    /**
     * Throws iff balance stores do not have the same entries.
     * @param lhs First balance store to compare
     * @param rhs Second balance store to compare
     */
    public static assertEqual(lhs: BalanceStore, rhs: BalanceStore): void {
        if (!BalanceStore.isEqual(lhs, rhs)) {
            throw new Error(`Balance stores are not equal:\n\nLeft:\n${lhs}\n\nRight:\n${rhs}`);
        }
    }

    /**
     * Restructures `ERC1155HoldingsByOwner` to be compatible with `TokenBalances.erc1155`.
     * @param erc1155HoldingsByOwner Holdings returned by `ERC1155ProxyWrapper.getBalancesAsync()`.
     */
    protected static _transformERC1155Holdings(erc1155HoldingsByOwner: ERC1155HoldingsByOwner): ERC1155Holdings {
        const result = {};
        for (const owner of _.keys(erc1155HoldingsByOwner.fungible)) {
            for (const contract of _.keys(erc1155HoldingsByOwner.fungible[owner])) {
                _.set(result as any, [owner, contract, 'fungible'], erc1155HoldingsByOwner.fungible[owner][contract]);
            }
        }
        for (const owner of _.keys(erc1155HoldingsByOwner.nonFungible)) {
            for (const contract of _.keys(erc1155HoldingsByOwner.nonFungible[owner])) {
                const tokenIds = _.flatten(_.values(erc1155HoldingsByOwner.nonFungible[owner][contract]));
                _.set(result as any, [owner, contract, 'nonFungible'], _.uniqBy(tokenIds, v => v.toString(10)));
            }
        }
        return result;
    }

    /**
     * Encodes token balances in a way that they can be compared by lodash.
     */
    protected static _encodeTokenBalances(obj: any): any {
        if (!_.isPlainObject(obj)) {
            if (BigNumber.isBigNumber(obj)) {
                return obj.toString(10);
            }
            if (_.isArray(obj)) {
                return _.sortBy(obj, v => BalanceStore._encodeTokenBalances(v));
            }
            return obj;
        }
        const keys = _.keys(obj).sort();
        return _.zip(keys, keys.map(k => BalanceStore._encodeTokenBalances(obj[k])));
    }

    /**
     * Constructor.
     */
    public constructor() {
        this._balances = { erc20: {}, erc721: {}, erc1155: {}, eth: {} };
    }

    /**
     * Copies the balance from an existing balance store.
     * @param balanceStore to copy balances from.
     */
    public copyBalancesFrom(balanceStore: BalanceStore): void {
        this._balances = _.cloneDeep(balanceStore._balances);
    }

    /**
     * Returns the raw `TokenBalances` that this class encapsulates.
     */
    public getRawBalances(): TokenBalances {
        return _.cloneDeep(this._balances);
    }
}
