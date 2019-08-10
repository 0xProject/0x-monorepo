import { BigNumber } from '@0x/utils';

export interface ERC1155Holdings {
    [owner: string]: {
        [contract: string]: {
            fungible: {
                [tokenId: string]: BigNumber;
            };
            nonFungible: BigNumber[];
        };
    };
}

export interface TokenBalances {
    erc20: {
        [owner: string]: {
            [contract: string]: BigNumber;
        };
    };
    erc721: {
        [owner: string]: {
            [contract: string]: BigNumber[];
        };
    };
    erc1155: ERC1155Holdings;
}

/**
 * Retrieve the current token balances of all known addresses.
 * @param erc20Wrapper The ERC20Wrapper instance.
 * @param erc721Wrapper The ERC721Wrapper instance.
 * @param erc1155Wrapper The ERC1155ProxyWrapper instance.
 * @return A promise that resolves to a `TokenBalances`.
 */
export async function getTokenBalancesAsync(
    erc20Wrapper: ERC20Wrapper,
    erc721Wrapper: ERC721Wrapper,
    erc1155ProxyWrapper: ERC1155ProxyWrapper,
): Promise<TokenBalances> {
    const [erc20, erc721, erc1155] = await Promise.all([
        erc20Wrapper.getBalancesAsync(),
        erc721Wrapper.getBalancesAsync(),
        erc1155ProxyWrapper.getBalancesAsync(),
    ]);
    return {
        erc20,
        erc721,
        erc1155: transformERC1155Holdings(erc1155),
    };
}

/**
 * Restructures `ERC1155HoldingsByOwner` to be compatible with `TokenBalances.erc1155`.
 * @param erc1155HoldingsByOwner Holdings returned by `ERC1155ProxyWrapper.getBalancesAsync()`.
 */
function transformERC1155Holdings(erc1155HoldingsByOwner: ERC1155HoldingsByOwner): ERC1155Holdings {
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

function encodeTokenBalances(obj: any): any {
    if (!_.isPlainObject(obj)) {
        if (BigNumber.isBigNumber(obj)) {
            return obj.toString(10);
        }
        if (_.isArray(obj)) {
            return _.sortBy(obj, v => encodeTokenBalances(v));
        }
        return obj;
    }
    const keys = _.keys(obj).sort();
    return _.zip(keys, keys.map(k => encodeTokenBalances(obj[k])));
}

/**
 * Takes a `totalBalances`, a `balances`, and an `initialBalances`, subtracts the `initialBalances
 * from the `balances`, and then adds the result to `totalBalances`.
 * @param totalBalances A set of balances to be updated with new results.
 * @param balances A new set of results that deviate from the `initialBalances` by one matched
 *                 order. Subtracting away the `initialBalances` leaves behind a diff of the
 *                 matched orders effect on the `initialBalances`.
 * @param initialBalances The token balances from before the call to `batchMatchOrders()`.
 * @return The updated total balances using the derived balance difference.
 */
function aggregateBalances(
    totalBalances: TokenBalances,
    balances: TokenBalances,
    initialBalances: TokenBalances,
): TokenBalances {
    // ERC20
    for (const owner of _.keys(totalBalances.erc20)) {
        for (const contract of _.keys(totalBalances.erc20[owner])) {
            const difference = balances.erc20[owner][contract].minus(initialBalances.erc20[owner][contract]);
            totalBalances.erc20[owner][contract] = totalBalances.erc20[owner][contract].plus(difference);
        }
    }
    // ERC721
    for (const owner of _.keys(totalBalances.erc721)) {
        for (const contract of _.keys(totalBalances.erc721[owner])) {
            totalBalances.erc721[owner][contract] = _.zipWith(
                totalBalances.erc721[owner][contract],
                balances.erc721[owner][contract],
                initialBalances.erc721[owner][contract],
                (a: BigNumber, b: BigNumber, c: BigNumber) => a.plus(b.minus(c)),
            );
        }
    }
    // ERC1155
    for (const owner of _.keys(totalBalances.erc1155)) {
        for (const contract of _.keys(totalBalances.erc1155[owner])) {
            // Fungible
            for (const tokenId of _.keys(totalBalances.erc1155[owner][contract].fungible)) {
                const difference = balances.erc1155[owner][contract].fungible[tokenId].minus(
                    initialBalances.erc1155[owner][contract].fungible[tokenId],
                );
                totalBalances.erc1155[owner][contract].fungible[tokenId] = totalBalances.erc1155[owner][
                    contract
                ].fungible[tokenId].plus(difference);
            }

            // Nonfungible
            let isDuplicate = false;
            for (const value of balances.erc1155[owner][contract].nonFungible) {
                // If the value is in the initial balances or the total balances, skip the
                // value since it will already be added.
                for (const val of totalBalances.erc1155[owner][contract].nonFungible) {
                    if (value.isEqualTo(val)) {
                        isDuplicate = true;
                    }
                }

                if (!isDuplicate) {
                    for (const val of initialBalances.erc1155[owner][contract].nonFungible) {
                        if (value.isEqualTo(val)) {
                            isDuplicate = true;
                        }
                    }
                }

                if (!isDuplicate) {
                    totalBalances.erc1155[owner][contract].nonFungible.push(value);
                }
                isDuplicate = false;
            }
        }
    }
    return totalBalances;
}


/**
 * Simulates a transfer of assets from `fromAddress` to `toAddress`
 *       by updating `matchResults`.
 */
export function transferAsset(
    fromAddress: string,
    toAddress: string,
    amount: BigNumber,
    assetData: string,
    matchResults: MatchResults,
): void {
    if (fromAddress === toAddress) return;
    const assetProxyId = assetDataUtils.decodeAssetProxyId(assetData);
    switch (assetProxyId) {
        case AssetProxyId.ERC20: {
            const erc20AssetData = assetDataUtils.decodeERC20AssetData(assetData);
            const assetAddress = erc20AssetData.tokenAddress;
            const fromBalances = matchResults.balances.erc20[fromAddress];
            const toBalances = matchResults.balances.erc20[toAddress];
            fromBalances[assetAddress] = fromBalances[assetAddress].minus(amount);
            toBalances[assetAddress] = toBalances[assetAddress].plus(amount);
            break;
        }
        case AssetProxyId.ERC721: {
            const erc721AssetData = assetDataUtils.decodeERC721AssetData(assetData);
            const assetAddress = erc721AssetData.tokenAddress;
            const tokenId = erc721AssetData.tokenId;
            const fromTokens = matchResults.balances.erc721[fromAddress][assetAddress];
            const toTokens = matchResults.balances.erc721[toAddress][assetAddress];
            if (amount.gte(1)) {
                const tokenIndex = _.findIndex(fromTokens, t => t.eq(tokenId));
                if (tokenIndex !== -1) {
                    fromTokens.splice(tokenIndex, 1);
                    toTokens.push(tokenId);
                }
            }
            break;
        }
        case AssetProxyId.ERC1155: {
            const erc1155AssetData = assetDataUtils.decodeERC1155AssetData(assetData);
            const assetAddress = erc1155AssetData.tokenAddress;
            const fromBalances = matchResults.balances.erc1155[fromAddress][assetAddress];
            const toBalances = matchResults.balances.erc1155[toAddress][assetAddress];
            for (const i of _.times(erc1155AssetData.tokenIds.length)) {
                const tokenId = erc1155AssetData.tokenIds[i];
                const tokenValue = erc1155AssetData.tokenValues[i];
                const tokenAmount = amount.times(tokenValue);
                if (tokenAmount.gt(0)) {
                    const tokenIndex = _.findIndex(fromBalances.nonFungible, t => t.eq(tokenId));
                    if (tokenIndex !== -1) {
                        // Transfer a non-fungible.
                        fromBalances.nonFungible.splice(tokenIndex, 1);
                        toBalances.nonFungible.push(tokenId);
                    } else {
                        // Transfer a fungible.
                        const _tokenId = tokenId.toString(10);
                        fromBalances.fungible[_tokenId] = fromBalances.fungible[_tokenId].minus(tokenAmount);
                        toBalances.fungible[_tokenId] = toBalances.fungible[_tokenId].plus(tokenAmount);
                    }
                }
            }
            break;
        }
        case AssetProxyId.MultiAsset: {
            const multiAssetData = assetDataUtils.decodeMultiAssetData(assetData);
            for (const i of _.times(multiAssetData.amounts.length)) {
                const nestedAmount = amount.times(multiAssetData.amounts[i]);
                const nestedAssetData = multiAssetData.nestedAssetData[i];
                transferAsset(fromAddress, toAddress, nestedAmount, nestedAssetData, matchResults);
            }
            break;
        }
        default:
            throw new Error(`Unhandled asset proxy ID: ${assetProxyId}`);
    }
}