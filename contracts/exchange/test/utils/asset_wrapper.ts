import { AbstractAssetWrapper, constants } from '@0x/contracts-test-utils';
import { assetDataUtils } from '@0x/order-utils';
import { AssetProxyId } from '@0x/types';
import { BigNumber, errorUtils } from '@0x/utils';
import * as _ from 'lodash';

import { ERC1155ProxyWrapper, ERC20Wrapper, ERC721Wrapper } from '@0x/contracts-asset-proxy';

interface ProxyIdToAssetWrappers {
    [proxyId: string]: AbstractAssetWrapper;
}

const ONE_NFT_UNIT = new BigNumber(1);
const ZERO_NFT_UNIT = new BigNumber(0);

/**
 * This class abstracts away the differences between ERC20 and ERC721 tokens so that
 * the logic that uses it does not need to care what standard a token belongs to.
 */
export class AssetWrapper {
    private readonly _proxyIdToAssetWrappers: ProxyIdToAssetWrappers;
    private readonly _burnerAddress: string;
    constructor(assetWrappers: AbstractAssetWrapper[], burnerAddress: string) {
        this._proxyIdToAssetWrappers = {};
        this._burnerAddress = burnerAddress;
        _.each(assetWrappers, assetWrapper => {
            const proxyId = assetWrapper.getProxyId();
            this._proxyIdToAssetWrappers[proxyId] = assetWrapper;
        });
    }
    public async getBalanceAsync(userAddress: string, assetData: string): Promise<BigNumber> {
        const proxyId = assetDataUtils.decodeAssetProxyId(assetData);
        switch (proxyId) {
            case AssetProxyId.ERC20: {
                // tslint:disable-next-line:no-unnecessary-type-assertion
                const erc20Wrapper = this._proxyIdToAssetWrappers[proxyId] as ERC20Wrapper;
                const balance = await erc20Wrapper.getBalanceAsync(userAddress, assetData);
                return balance;
            }
            case AssetProxyId.ERC721: {
                // tslint:disable-next-line:no-unnecessary-type-assertion
                const assetWrapper = this._proxyIdToAssetWrappers[proxyId] as ERC721Wrapper;
                const assetProxyData = assetDataUtils.decodeERC721AssetData(assetData);
                const isOwner = await assetWrapper.isOwnerAsync(
                    userAddress,
                    assetProxyData.tokenAddress,
                    assetProxyData.tokenId,
                );
                const balance = isOwner ? ONE_NFT_UNIT : ZERO_NFT_UNIT;
                return balance;
            }
            case AssetProxyId.ERC1155: {
                // tslint:disable-next-line:no-unnecessary-type-assertion
                const assetProxyWrapper = this._proxyIdToAssetWrappers[proxyId] as ERC1155ProxyWrapper;
                const assetProxyData = assetDataUtils.decodeERC1155AssetData(assetData);
                const assetWrapper = assetProxyWrapper.getContractWrapper(assetProxyData.tokenAddress);
                const balances = await Promise.all(
                    _.map(assetProxyData.tokenIds).map(tokenId => assetWrapper.getBalanceAsync(userAddress, tokenId)),
                );
                return BigNumber.min(...balances);
            }
            case AssetProxyId.MultiAsset: {
                const assetProxyData = assetDataUtils.decodeMultiAssetData(assetData);
                const nestedBalances = await Promise.all(
                    assetProxyData.nestedAssetData.map(async nestedAssetData =>
                        this.getBalanceAsync(userAddress, nestedAssetData),
                    ),
                );
                const scaledBalances = _.zip(assetProxyData.amounts, nestedBalances).map(([amount, balance]) =>
                    (balance as BigNumber).div(amount as BigNumber).integerValue(BigNumber.ROUND_HALF_UP),
                );
                return BigNumber.min(...scaledBalances);
            }
            default:
                throw errorUtils.spawnSwitchErr('proxyId', proxyId);
        }
    }
    public async setBalanceAsync(userAddress: string, assetData: string, desiredBalance: BigNumber): Promise<void> {
        const proxyId = assetDataUtils.decodeAssetProxyId(assetData);
        switch (proxyId) {
            case AssetProxyId.ERC20: {
                // tslint:disable-next-line:no-unnecessary-type-assertion
                const erc20Wrapper = this._proxyIdToAssetWrappers[proxyId] as ERC20Wrapper;
                await erc20Wrapper.setBalanceAsync(
                    userAddress,
                    assetData,
                    desiredBalance.integerValue(BigNumber.ROUND_DOWN),
                );
                return;
            }
            case AssetProxyId.ERC721: {
                // tslint:disable-next-line:no-unnecessary-type-assertion
                const erc721Wrapper = this._proxyIdToAssetWrappers[proxyId] as ERC721Wrapper;
                const assetProxyData = assetDataUtils.decodeERC721AssetData(assetData);
                const doesTokenExist = erc721Wrapper.doesTokenExistAsync(
                    assetProxyData.tokenAddress,
                    assetProxyData.tokenId,
                );
                if (!doesTokenExist && desiredBalance.gte(1)) {
                    await erc721Wrapper.mintAsync(assetProxyData.tokenAddress, assetProxyData.tokenId, userAddress);
                    return;
                } else if (!doesTokenExist && desiredBalance.lt(1)) {
                    return; // noop
                }
                const tokenOwner = await erc721Wrapper.ownerOfAsync(
                    assetProxyData.tokenAddress,
                    assetProxyData.tokenId,
                );
                if (userAddress !== tokenOwner && desiredBalance.gte(1)) {
                    await erc721Wrapper.transferFromAsync(
                        assetProxyData.tokenAddress,
                        assetProxyData.tokenId,
                        tokenOwner,
                        userAddress,
                    );
                } else if (tokenOwner === userAddress && desiredBalance.lt(1)) {
                    // Burn token
                    await erc721Wrapper.transferFromAsync(
                        assetProxyData.tokenAddress,
                        assetProxyData.tokenId,
                        tokenOwner,
                        this._burnerAddress,
                    );
                    return;
                } else if (
                    (userAddress !== tokenOwner && desiredBalance.lt(1)) ||
                    (tokenOwner === userAddress && desiredBalance.gte(1))
                ) {
                    return; // noop
                }
                break;
            }
            case AssetProxyId.ERC1155: {
                // tslint:disable-next-line:no-unnecessary-type-assertion
                const assetProxyWrapper = this._proxyIdToAssetWrappers[proxyId] as ERC1155ProxyWrapper;
                const assetProxyData = assetDataUtils.decodeERC1155AssetData(assetData);
                const assetWrapper = assetProxyWrapper.getContractWrapper(assetProxyData.tokenAddress);
                const tokenValuesSum = BigNumber.sum(...assetProxyData.tokenValues);
                let tokenValueRatios = assetProxyData.tokenValues;
                if (!tokenValuesSum.eq(0)) {
                    tokenValueRatios = assetProxyData.tokenValues.map(v => v.div(tokenValuesSum));
                }
                for (const i of _.times(assetProxyData.tokenIds.length)) {
                    const tokenId = assetProxyData.tokenIds[i];
                    const tokenValueRatio = tokenValueRatios[i];
                    const scaledDesiredBalance = desiredBalance.times(tokenValueRatio);
                    const isFungible = await assetWrapper.isFungibleItemAsync(tokenId);
                    if (isFungible) {
                        // Token is fungible.
                        const currentBalance = await assetWrapper.getBalanceAsync(userAddress, tokenId);
                        const difference = scaledDesiredBalance
                            .minus(currentBalance)
                            .integerValue(BigNumber.ROUND_DOWN);
                        if (difference.eq(0)) {
                            // Just right. Nothing to do.
                        } else if (difference.lt(0)) {
                            // Too much. Burn some tokens.
                            await assetWrapper.safeTransferFromAsync(
                                userAddress,
                                this._burnerAddress,
                                tokenId,
                                difference.abs(),
                            );
                        } else {
                            // difference.gt(0)
                            // Too little. Mint some tokens.
                            await assetWrapper.mintKnownFungibleTokensAsync(tokenId, [userAddress], [difference]);
                        }
                    } else {
                        const nftOwner = await assetWrapper.getOwnerOfAsync(tokenId);
                        if (scaledDesiredBalance.gte(1)) {
                            if (nftOwner === userAddress) {
                                // Nothing to do.
                            } else if (nftOwner !== constants.NULL_ADDRESS) {
                                // Transfer from current owner.
                                await assetWrapper.safeTransferFromAsync(nftOwner, userAddress, tokenId, ONE_NFT_UNIT);
                            } else {
                                throw new Error(`Cannot mint new ERC1155 tokens with a specific token ID.`);
                            }
                        } else {
                            if (nftOwner === userAddress) {
                                // Burn the token.
                                await assetWrapper.safeTransferFromAsync(
                                    userAddress,
                                    this._burnerAddress,
                                    tokenId,
                                    ONE_NFT_UNIT,
                                );
                            } else {
                                // Nothing to do.
                            }
                        }
                    }
                }
                break;
            }
            case AssetProxyId.MultiAsset: {
                const assetProxyData = assetDataUtils.decodeMultiAssetData(assetData);
                const amountsSum = BigNumber.sum(...assetProxyData.amounts);
                let assetAmountRatios = assetProxyData.amounts;
                if (!amountsSum.eq(0)) {
                    assetAmountRatios = assetProxyData.amounts.map(amt => amt.div(amountsSum));
                }
                for (const i of _.times(assetProxyData.amounts.length)) {
                    const nestedAssetData = assetProxyData.nestedAssetData[i];
                    const assetAmountRatio = assetAmountRatios[i];
                    await this.setBalanceAsync(userAddress, nestedAssetData, desiredBalance.times(assetAmountRatio));
                }
                break;
            }
            default:
                throw errorUtils.spawnSwitchErr('proxyId', proxyId);
        }
    }
    public async setUnscaledBalanceAsync(
        userAddress: string,
        assetData: string,
        desiredBalance: BigNumber,
    ): Promise<void> {
        const proxyId = assetDataUtils.decodeAssetProxyId(assetData);
        switch (proxyId) {
            case AssetProxyId.ERC20:
            case AssetProxyId.ERC721:
                return this.setBalanceAsync(userAddress, assetData, desiredBalance);
            case AssetProxyId.ERC1155:
            case AssetProxyId.MultiAsset: {
                const currentBalance = await this.getBalanceAsync(userAddress, assetData);
                return this.setBalanceAsync(userAddress, assetData, desiredBalance.times(currentBalance));
            }
            default:
                throw errorUtils.spawnSwitchErr('proxyId', proxyId);
        }
    }
    public async getProxyAllowanceAsync(userAddress: string, assetData: string): Promise<BigNumber> {
        const proxyId = assetDataUtils.decodeAssetProxyId(assetData);
        switch (proxyId) {
            case AssetProxyId.ERC20: {
                // tslint:disable-next-line:no-unnecessary-type-assertion
                const erc20Wrapper = this._proxyIdToAssetWrappers[proxyId] as ERC20Wrapper;
                const allowance = await erc20Wrapper.getProxyAllowanceAsync(userAddress, assetData);
                return allowance;
            }
            case AssetProxyId.ERC721: {
                // tslint:disable-next-line:no-unnecessary-type-assertion
                const assetWrapper = this._proxyIdToAssetWrappers[proxyId] as ERC721Wrapper;
                const erc721ProxyData = assetDataUtils.decodeERC721AssetData(assetData);
                const isProxyApprovedForAll = await assetWrapper.isProxyApprovedForAllAsync(
                    userAddress,
                    erc721ProxyData.tokenAddress,
                );
                if (isProxyApprovedForAll) {
                    return constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS;
                }

                const isProxyApproved = await assetWrapper.isProxyApprovedAsync(
                    erc721ProxyData.tokenAddress,
                    erc721ProxyData.tokenId,
                );
                const allowance = isProxyApproved ? ONE_NFT_UNIT : ZERO_NFT_UNIT;
                return allowance;
            }
            case AssetProxyId.ERC1155: {
                // tslint:disable-next-line:no-unnecessary-type-assertion
                const assetProxyWrapper = this._proxyIdToAssetWrappers[proxyId] as ERC1155ProxyWrapper;
                const assetProxyData = assetDataUtils.decodeERC1155AssetData(assetData);
                const isApprovedForAll = await assetProxyWrapper.isProxyApprovedForAllAsync(
                    userAddress,
                    assetProxyData.tokenAddress,
                );
                if (!isApprovedForAll) {
                    // ERC1155 is all or nothing.
                    return constants.ZERO_AMOUNT;
                }
                return constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS;
            }
            case AssetProxyId.MultiAsset: {
                const assetProxyData = assetDataUtils.decodeMultiAssetData(assetData);
                const allowances = await Promise.all(
                    assetProxyData.nestedAssetData.map(async nestedAssetData =>
                        this.getProxyAllowanceAsync(userAddress, nestedAssetData),
                    ),
                );
                return BigNumber.min(...allowances);
            }
            default:
                throw errorUtils.spawnSwitchErr('proxyId', proxyId);
        }
    }
    public async setProxyAllowanceAsync(
        userAddress: string,
        assetData: string,
        desiredAllowance: BigNumber,
    ): Promise<void> {
        const proxyId = assetDataUtils.decodeAssetProxyId(assetData);
        switch (proxyId) {
            case AssetProxyId.ERC20: {
                // tslint:disable-next-line:no-unnecessary-type-assertion
                const erc20Wrapper = this._proxyIdToAssetWrappers[proxyId] as ERC20Wrapper;
                await erc20Wrapper.setAllowanceAsync(userAddress, assetData, desiredAllowance);
                return;
            }
            case AssetProxyId.ERC721: {
                if (
                    !desiredAllowance.eq(0) &&
                    !desiredAllowance.eq(1) &&
                    !desiredAllowance.eq(constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS)
                ) {
                    throw new Error(
                        `Allowance for ERC721 token can only be set to 0, 1 or 2^256-1. Got: ${desiredAllowance}`,
                    );
                }
                // tslint:disable-next-line:no-unnecessary-type-assertion
                const erc721Wrapper = this._proxyIdToAssetWrappers[proxyId] as ERC721Wrapper;
                const assetProxyData = assetDataUtils.decodeERC721AssetData(assetData);

                const doesTokenExist = await erc721Wrapper.doesTokenExistAsync(
                    assetProxyData.tokenAddress,
                    assetProxyData.tokenId,
                );
                if (!doesTokenExist) {
                    throw new Error(
                        `Cannot setProxyAllowance on non-existent token: ${assetProxyData.tokenAddress} ${
                            assetProxyData.tokenId
                        }`,
                    );
                }
                const isProxyApprovedForAll = await erc721Wrapper.isProxyApprovedForAllAsync(
                    userAddress,
                    assetProxyData.tokenAddress,
                );
                if (!isProxyApprovedForAll && desiredAllowance.eq(constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS)) {
                    const isApproved = true;
                    await erc721Wrapper.approveProxyForAllAsync(assetProxyData.tokenAddress, userAddress, isApproved);
                } else if (isProxyApprovedForAll && desiredAllowance.eq(0)) {
                    const isApproved = false;
                    await erc721Wrapper.approveProxyForAllAsync(assetProxyData.tokenAddress, userAddress, isApproved);
                } else if (isProxyApprovedForAll && desiredAllowance.eq(constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS)) {
                    return; // Noop
                }

                const isProxyApproved = await erc721Wrapper.isProxyApprovedAsync(
                    assetProxyData.tokenAddress,
                    assetProxyData.tokenId,
                );
                if (!isProxyApproved && desiredAllowance.eq(1)) {
                    await erc721Wrapper.approveProxyAsync(assetProxyData.tokenAddress, assetProxyData.tokenId);
                } else if (isProxyApproved && desiredAllowance.eq(0)) {
                    // Remove approval
                    await erc721Wrapper.approveAsync(
                        constants.NULL_ADDRESS,
                        assetProxyData.tokenAddress,
                        assetProxyData.tokenId,
                    );
                } else if (
                    (!isProxyApproved && desiredAllowance.eq(0)) ||
                    (isProxyApproved && desiredAllowance.eq(1))
                ) {
                    // noop
                }
                break;
            }
            case AssetProxyId.ERC1155: {
                // tslint:disable-next-line:no-unnecessary-type-assertion
                const assetProxyWrapper = this._proxyIdToAssetWrappers[proxyId] as ERC1155ProxyWrapper;
                const assetProxyData = assetDataUtils.decodeERC1155AssetData(assetData);
                // ERC1155 allowances are all or nothing.
                const shouldApprovedForAll = desiredAllowance.gt(0);
                const currentAllowance = await this.getProxyAllowanceAsync(userAddress, assetData);
                if (shouldApprovedForAll && currentAllowance.eq(constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS)) {
                    // Nothing to do.
                } else if (!shouldApprovedForAll && currentAllowance.eq(constants.ZERO_AMOUNT)) {
                    // Nothing to do.
                } else {
                    assetProxyWrapper.setProxyAllowanceForAllAsync(
                        userAddress,
                        assetProxyData.tokenAddress,
                        shouldApprovedForAll,
                    );
                }
                break;
            }
            case AssetProxyId.MultiAsset: {
                const assetProxyData = assetDataUtils.decodeMultiAssetData(assetData);
                await Promise.all(
                    assetProxyData.nestedAssetData.map(async nestedAssetData =>
                        this.setProxyAllowanceAsync(userAddress, nestedAssetData, desiredAllowance),
                    ),
                );
                break;
            }
            default:
                throw errorUtils.spawnSwitchErr('proxyId', proxyId);
        }
    }
}
