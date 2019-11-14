import { DevUtilsContract } from '@0x/contracts-dev-utils';
import { constants, Numberish } from '@0x/contracts-test-utils';
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
    public static create(devUtils: DevUtilsContract, sourceBalanceStore?: BalanceStore): LocalBalanceStore {
        const localBalanceStore = new LocalBalanceStore(devUtils);
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
    protected constructor(
        private readonly _devUtils: DevUtilsContract,
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
    public burnGas(senderAddress: string, amount: Numberish): void {
        this.balances.eth[senderAddress] = this.balances.eth[senderAddress].minus(amount);
    }

    /**
     * Converts some amount of the ETH balance of an address to WETH balance to simulate wrapping ETH.
     * @param senderAddress Address whose ETH to wrap.
     * @param amount Amount to wrap.
     */
    public wrapEth(senderAddress: string, wethAddress: string, amount: Numberish): void {
        this.balances.eth[senderAddress] = this.balances.eth[senderAddress].minus(amount);
        _.update(this.balances.erc20, [senderAddress, wethAddress], balance =>
            (balance || constants.ZERO_AMOUNT).plus(amount),
        );
    }

    /**
     * Sends ETH from `fromAddress` to `toAddress`.
     * @param fromAddress Sender of ETH.
     * @param toAddress Receiver of ETH.
     * @param amount Amount of ETH to transfer.
     */
    public sendEth(fromAddress: string, toAddress: string, amount: Numberish): void {
        this.balances.eth[fromAddress] = this.balances.eth[fromAddress].minus(amount);
        this.balances.eth[toAddress] = this.balances.eth[toAddress].plus(amount);
    }

    /**
     * Transfers assets from `fromAddress` to `toAddress`.
     * @param fromAddress Sender of asset(s)
     * @param toAddress Receiver of asset(s)
     * @param amount Amount of asset(s) to transfer
     * @param assetData Asset data of assets being transferred.
     */
    public async transferAssetAsync(
        fromAddress: string,
        toAddress: string,
        amount: BigNumber,
        assetData: string,
    ): Promise<void> {
        if (fromAddress === toAddress) {
            return;
        }
        const assetProxyId = await this._devUtils.decodeAssetProxyId(assetData).callAsync();
        switch (assetProxyId) {
            case AssetProxyId.ERC20: {
                // tslint:disable-next-line:no-unused-variable
                const [_proxyId, tokenAddress] = await this._devUtils.decodeERC20AssetData(assetData).callAsync();
                _.update(this.balances.erc20, [fromAddress, tokenAddress], balance => balance.minus(amount));
                _.update(this.balances.erc20, [toAddress, tokenAddress], balance =>
                    (balance || constants.ZERO_AMOUNT).plus(amount),
                );
                break;
            }
            case AssetProxyId.ERC721: {
                // tslint:disable-next-line:no-unused-variable
                const [_proxyId, tokenAddress, tokenId] = await this._devUtils
                    .decodeERC721AssetData(assetData)
                    .callAsync();
                const fromTokens = _.get(this.balances.erc721, [fromAddress, tokenAddress], []);
                const toTokens = _.get(this.balances.erc721, [toAddress, tokenAddress], []);
                if (amount.gte(1)) {
                    const tokenIndex = _.findIndex(fromTokens as BigNumber[], t => t.eq(tokenId));
                    if (tokenIndex !== -1) {
                        fromTokens.splice(tokenIndex, 1);
                        toTokens.push(tokenId);
                        toTokens.sort();
                    }
                }
                _.set(this.balances.erc721, [fromAddress, tokenAddress], fromTokens);
                _.set(this.balances.erc721, [toAddress, tokenAddress], toTokens);
                break;
            }
            case AssetProxyId.ERC1155: {
                const [
                    _proxyId, // tslint:disable-line:no-unused-variable
                    tokenAddress,
                    tokenIds,
                    tokenValues,
                ] = await this._devUtils.decodeERC1155AssetData(assetData).callAsync();
                const fromBalances = {
                    // tslint:disable-next-line:no-inferred-empty-object-type
                    fungible: _.get(this.balances.erc1155, [fromAddress, tokenAddress, 'fungible'], {}),
                    nonFungible: _.get(this.balances.erc1155, [fromAddress, tokenAddress, 'nonFungible'], []),
                };
                const toBalances = {
                    // tslint:disable-next-line:no-inferred-empty-object-type
                    fungible: _.get(this.balances.erc1155, [toAddress, tokenAddress, 'fungible'], {}),
                    nonFungible: _.get(this.balances.erc1155, [toAddress, tokenAddress, 'nonFungible'], []),
                };
                for (const [i, tokenId] of tokenIds.entries()) {
                    const tokenValue = tokenValues[i];
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
                _.set(this.balances.erc1155, [fromAddress, tokenAddress], fromBalances);
                _.set(this.balances.erc1155, [toAddress, tokenAddress], toBalances);
                break;
            }
            case AssetProxyId.MultiAsset: {
                // tslint:disable-next-line:no-unused-variable
                const [_proxyId, amounts, nestedAssetData] = await this._devUtils
                    .decodeMultiAssetData(assetData)
                    .callAsync();
                for (const [i, amt] of amounts.entries()) {
                    const nestedAmount = amount.times(amt);
                    await this.transferAssetAsync(fromAddress, toAddress, nestedAmount, nestedAssetData[i]);
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
