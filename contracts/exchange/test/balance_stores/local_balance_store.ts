import { constants } from '@0x/contracts-test-utils';
import { assetDataUtils } from '@0x/order-utils';
import { AssetProxyId } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { BalanceStore } from './balance_store';
import { TokenContractsByName, TokenOwnersByName } from './types';

export class LocalBalanceStore extends BalanceStore {
    /**
     * Creates a new balance store based on an existing one.
     * @param sourceBalanceStore Existing balance store whose values should be copied.
     */
    public static create(sourceBalanceStore?: BalanceStore): LocalBalanceStore {
        const localBalanceStore = new LocalBalanceStore();
        if (sourceBalanceStore !== undefined) {
            localBalanceStore.cloneFrom(sourceBalanceStore);
        }
        return localBalanceStore;
    }

    /**
     * Constructor.
     * Note that parameters are given {} defaults because `LocalBalanceStore`s will typically
     * be initialized via `create`.
     */
    public constructor(
        tokenOwnersByName: TokenOwnersByName = {},
        tokenContractsByName: Partial<TokenContractsByName> = {},
    ) {
        super(tokenOwnersByName, tokenContractsByName);
    }

    /**
     * Decreases the ETH balance of an address to simulate gas usage.
     * @param senderAddress Address whose ETH balance to decrease.
     * @param amount Amount to decrease the balance by.
     */
    public burnGas(senderAddress: string, amount: BigNumber | number): void {
        this._balances.eth[senderAddress] = this._balances.eth[senderAddress].minus(amount);
    }

    /**
     * Sends ETH from `fromAddress` to `toAddress`.
     * @param fromAddress Sender of ETH.
     * @param toAddress Receiver of ETH.
     * @param amount Amount of ETH to transfer.
     */
    public sendEth(fromAddress: string, toAddress: string, amount: BigNumber | number): void {
        this._balances.eth[fromAddress] = this._balances.eth[fromAddress].minus(amount);
        this._balances.eth[toAddress] = this._balances.eth[toAddress].plus(amount);
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
                _.update(this._balances.erc20, [fromAddress, assetAddress], balance => balance.minus(amount));
                _.update(this._balances.erc20, [toAddress, assetAddress], balance =>
                    (balance || constants.ZERO_AMOUNT).plus(amount),
                );
                break;
            }
            case AssetProxyId.ERC721: {
                const erc721AssetData = assetDataUtils.decodeERC721AssetData(assetData);
                const assetAddress = erc721AssetData.tokenAddress;
                const tokenId = erc721AssetData.tokenId;
                const fromTokens = _.get(this._balances.erc721, [fromAddress, assetAddress], []);
                const toTokens = _.get(this._balances.erc721, [toAddress, assetAddress], []);
                if (amount.gte(1)) {
                    const tokenIndex = _.findIndex(fromTokens as BigNumber[], t => t.eq(tokenId));
                    if (tokenIndex !== -1) {
                        fromTokens.splice(tokenIndex, 1);
                        toTokens.push(tokenId);
                        toTokens.sort();
                    }
                }
                _.set(this._balances.erc721, [fromAddress, assetAddress], fromTokens);
                _.set(this._balances.erc721, [toAddress, assetAddress], toTokens);
                break;
            }
            case AssetProxyId.ERC1155: {
                const erc1155AssetData = assetDataUtils.decodeERC1155AssetData(assetData);
                const assetAddress = erc1155AssetData.tokenAddress;
                const fromBalances = {
                    // tslint:disable-next-line:no-inferred-empty-object-type
                    fungible: _.get(this._balances.erc1155, [fromAddress, assetAddress, 'fungible'], {}),
                    nonFungible: _.get(this._balances.erc1155, [fromAddress, assetAddress, 'nonFungible'], []),
                };
                const toBalances = {
                    // tslint:disable-next-line:no-inferred-empty-object-type
                    fungible: _.get(this._balances.erc1155, [toAddress, assetAddress, 'fungible'], {}),
                    nonFungible: _.get(this._balances.erc1155, [toAddress, assetAddress, 'nonFungible'], []),
                };
                for (const [i, tokenId] of erc1155AssetData.tokenIds.entries()) {
                    const tokenValue = erc1155AssetData.tokenValues[i];
                    const tokenAmount = amount.times(tokenValue);
                    if (tokenAmount.gt(0)) {
                        const tokenIndex = _.findIndex(fromBalances.nonFungible as BigNumber[], t => t.eq(tokenId));
                        if (tokenIndex !== -1) {
                            // Transfer a non-fungible.
                            fromBalances.nonFungible.splice(tokenIndex, 1);
                            toBalances.nonFungible.push(tokenId);
                            // sort NFT's by name
                            toBalances.nonFungible.sort();
                        } else {
                            // Transfer a fungible.
                            const _tokenId = tokenId.toString();
                            _.update(fromBalances.fungible, [_tokenId], balance => balance.minus(tokenAmount));
                            _.update(toBalances.fungible, [_tokenId], balance =>
                                (balance || constants.ZERO_AMOUNT).plus(tokenAmount),
                            );
                        }
                    }
                }
                _.set(this._balances.erc1155, [fromAddress, assetAddress], fromBalances);
                _.set(this._balances.erc1155, [toAddress, assetAddress], toBalances);
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
