import { assetDataUtils } from '@0x/order-utils';
import { AssetProxyId } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { BalanceStore } from './balance_store';

export class LocalBalanceStore extends BalanceStore {
    /**
     * Creates a new balance store based on an existing one.
     * @param balanceStore Existing balance store whose values should be copied.
     */
    public static create(sourceBalanceStore?: BalanceStore): LocalBalanceStore {
        const localBalanceStore = new LocalBalanceStore();
        if (sourceBalanceStore !== undefined) {
            localBalanceStore.copyBalancesFrom(sourceBalanceStore);
        }
        return localBalanceStore;
    }

    /**
     * Constructor.
     */
    public constructor() {
        super();
    }

    /**
     * Transfers assets from `fromAddress` to `toAddress`.
     * @param fromAddress Sender of asset(s)
     * @param toAddress Receiver of asset(s)
     * @param amount Amount of asset(s) to transfer
     * @param assetData Asset data of assets being transferred.
     */
    public transferAsset(fromAddress: string, toAddress: string, amount: BigNumber, assetData: string): void {
        if (fromAddress === toAddress) {
            return;
        }
        const assetProxyId = assetDataUtils.decodeAssetProxyId(assetData);
        switch (assetProxyId) {
            case AssetProxyId.ERC20: {
                const erc20AssetData = assetDataUtils.decodeERC20AssetData(assetData);
                const assetAddress = erc20AssetData.tokenAddress;
                const fromBalances = this._balances.erc20[fromAddress];
                const toBalances = this._balances.erc20[toAddress];
                fromBalances[assetAddress] = fromBalances[assetAddress].minus(amount);
                toBalances[assetAddress] = toBalances[assetAddress].plus(amount);
                break;
            }
            case AssetProxyId.ERC721: {
                const erc721AssetData = assetDataUtils.decodeERC721AssetData(assetData);
                const assetAddress = erc721AssetData.tokenAddress;
                const tokenId = erc721AssetData.tokenId;
                const fromTokens = this._balances.erc721[fromAddress][assetAddress];
                const toTokens = this._balances.erc721[toAddress][assetAddress];
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
                const fromBalances = this._balances.erc1155[fromAddress][assetAddress];
                const toBalances = this._balances.erc1155[toAddress][assetAddress];
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
                // sort NFT's by name
                toBalances.nonFungible.sort();
                break;
            }
            case AssetProxyId.MultiAsset: {
                const multiAssetData = assetDataUtils.decodeMultiAssetData(assetData);
                for (const i of _.times(multiAssetData.amounts.length)) {
                    const nestedAmount = amount.times(multiAssetData.amounts[i]);
                    const nestedAssetData = multiAssetData.nestedAssetData[i];
                    this.transferAsset(fromAddress, toAddress, nestedAmount, nestedAssetData);
                }
                break;
            }
            case AssetProxyId.StaticCall:
                // Do nothing
                break;
            default:
                throw new Error(`Unhandled asset proxy ID: ${assetProxyId}`);
        }
    }
}
