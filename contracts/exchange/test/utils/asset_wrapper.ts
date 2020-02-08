import {
    decodeERC1155AssetData,
    decodeERC721AssetData,
    decodeMultiAssetData,
    ERC1155ProxyWrapper,
    ERC20Wrapper,
    ERC721Wrapper,
    getAssetDataProxyId,
} from '@0x/contracts-asset-proxy';
import { AbstractAssetWrapper, constants } from '@0x/contracts-test-utils';
import { AssetProxyId } from '@0x/types';
import { BigNumber, errorUtils } from '@0x/utils';
import * as _ from 'lodash';

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

    constructor(assetWrappers: AbstractAssetWrapper[], private readonly _burnerAddress: string) {
        this._proxyIdToAssetWrappers = {};
        _.each(assetWrappers, assetWrapper => {
            const proxyId = assetWrapper.getProxyId();
            this._proxyIdToAssetWrappers[proxyId] = assetWrapper;
        });
    }
    public async getBalanceAsync(userAddress: string, assetData: string): Promise<BigNumber> {
        const proxyId = getAssetDataProxyId(assetData);
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
                // tslint:disable-next-line:no-unused-variable
                const [tokenAddress, tokenId] = decodeERC721AssetData(assetData);
                const isOwner = await assetWrapper.isOwnerAsync(userAddress, tokenAddress, tokenId);
                const balance = isOwner ? ONE_NFT_UNIT : ZERO_NFT_UNIT;
                return balance;
            }
            case AssetProxyId.ERC1155: {
                // tslint:disable-next-line:no-unnecessary-type-assertion
                const assetProxyWrapper = this._proxyIdToAssetWrappers[proxyId] as ERC1155ProxyWrapper;
                const [
                    // tslint:disable-next-line:no-unused-variable
                    tokenAddress,
                    tokenIds,
                ] = decodeERC1155AssetData(assetData);
                const assetWrapper = assetProxyWrapper.getContractWrapper(tokenAddress);
                const balances = await Promise.all(
                    _.map(tokenIds).map(tokenId => assetWrapper.getBalanceAsync(userAddress, tokenId)),
                );
                return BigNumber.min(...balances);
            }
            case AssetProxyId.MultiAsset: {
                // tslint:disable-next-line:no-unused-variable
                const [amounts, nestedAssetData] = decodeMultiAssetData(assetData);
                const nestedBalances = await Promise.all(
                    nestedAssetData.map(async _nestedAssetData => this.getBalanceAsync(userAddress, _nestedAssetData)),
                );
                const scaledBalances = _.zip(amounts, nestedBalances).map(([amount, balance]) =>
                    (balance as BigNumber).div(amount as BigNumber).integerValue(BigNumber.ROUND_HALF_UP),
                );
                return BigNumber.min(...scaledBalances);
            }
            default:
                throw errorUtils.spawnSwitchErr('proxyId', proxyId);
        }
    }
    public async setBalanceAsync(userAddress: string, assetData: string, desiredBalance: BigNumber): Promise<void> {
        const proxyId = getAssetDataProxyId(assetData);
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
                // tslint:disable-next-line:no-unused-variable
                const [tokenAddress, tokenId] = decodeERC721AssetData(assetData);
                const doesTokenExist = erc721Wrapper.doesTokenExistAsync(tokenAddress, tokenId);
                if (!doesTokenExist && desiredBalance.gte(1)) {
                    await erc721Wrapper.mintAsync(tokenAddress, tokenId, userAddress);
                    return;
                } else if (!doesTokenExist && desiredBalance.lt(1)) {
                    return; // noop
                }
                const tokenOwner = await erc721Wrapper.ownerOfAsync(tokenAddress, tokenId);
                if (userAddress !== tokenOwner && desiredBalance.gte(1)) {
                    await erc721Wrapper.transferFromAsync(tokenAddress, tokenId, tokenOwner, userAddress);
                } else if (tokenOwner === userAddress && desiredBalance.lt(1)) {
                    // Burn token
                    await erc721Wrapper.transferFromAsync(tokenAddress, tokenId, tokenOwner, this._burnerAddress);
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
                const [
                    // tslint:disable-next-line:no-unused-variable
                    tokenAddress,
                    tokenIds,
                    tokenValues,
                ] = decodeERC1155AssetData(assetData);
                const assetWrapper = assetProxyWrapper.getContractWrapper(tokenAddress);
                const tokenValuesSum = BigNumber.sum(...tokenValues);
                let tokenValueRatios = tokenValues;
                if (!tokenValuesSum.eq(0)) {
                    tokenValueRatios = tokenValues.map(v => v.div(tokenValuesSum));
                }
                for (const i of _.times(tokenIds.length)) {
                    const tokenId = tokenIds[i];
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
                // tslint:disable-next-line:no-unused-variable
                const [amounts, nestedAssetData] = decodeMultiAssetData(assetData);
                const amountsSum = BigNumber.sum(...amounts);
                let assetAmountRatios = amounts;
                if (!amountsSum.eq(0)) {
                    assetAmountRatios = amounts.map(amt => amt.div(amountsSum));
                }
                for (const i of _.times(amounts.length)) {
                    const assetAmountRatio = assetAmountRatios[i];
                    await this.setBalanceAsync(userAddress, nestedAssetData[i], desiredBalance.times(assetAmountRatio));
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
        const proxyId = getAssetDataProxyId(assetData);
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
        const proxyId = getAssetDataProxyId(assetData);
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
                // tslint:disable-next-line:no-unused-variable
                const [tokenAddress, tokenId] = decodeERC721AssetData(assetData);
                const isProxyApprovedForAll = await assetWrapper.isProxyApprovedForAllAsync(userAddress, tokenAddress);
                if (isProxyApprovedForAll) {
                    return constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS;
                }

                const isProxyApproved = await assetWrapper.isProxyApprovedAsync(tokenAddress, tokenId);
                const allowance = isProxyApproved ? ONE_NFT_UNIT : ZERO_NFT_UNIT;
                return allowance;
            }
            case AssetProxyId.ERC1155: {
                // tslint:disable-next-line:no-unnecessary-type-assertion
                const assetProxyWrapper = this._proxyIdToAssetWrappers[proxyId] as ERC1155ProxyWrapper;
                // tslint:disable-next-line:no-unused-variable
                const [tokenAddress] = decodeERC1155AssetData(assetData);
                const isApprovedForAll = await assetProxyWrapper.isProxyApprovedForAllAsync(userAddress, tokenAddress);
                if (!isApprovedForAll) {
                    // ERC1155 is all or nothing.
                    return constants.ZERO_AMOUNT;
                }
                return constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS;
            }
            case AssetProxyId.MultiAsset: {
                // tslint:disable-next-line:no-unused-variable
                const [amounts, nestedAssetData] = decodeMultiAssetData(assetData);
                const allowances = await Promise.all(
                    nestedAssetData.map(async _nestedAssetData =>
                        this.getProxyAllowanceAsync(userAddress, _nestedAssetData),
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
        const proxyId = getAssetDataProxyId(assetData);
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
                // tslint:disable-next-line:no-unused-variable
                const [tokenAddress, tokenId] = decodeERC721AssetData(assetData);

                const doesTokenExist = await erc721Wrapper.doesTokenExistAsync(tokenAddress, tokenId);
                if (!doesTokenExist) {
                    throw new Error(`Cannot setProxyAllowance on non-existent token: ${tokenAddress} ${tokenId}`);
                }
                const isProxyApprovedForAll = await erc721Wrapper.isProxyApprovedForAllAsync(userAddress, tokenAddress);
                if (!isProxyApprovedForAll && desiredAllowance.eq(constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS)) {
                    const isApproved = true;
                    await erc721Wrapper.approveProxyForAllAsync(tokenAddress, userAddress, isApproved);
                } else if (isProxyApprovedForAll && desiredAllowance.eq(0)) {
                    const isApproved = false;
                    await erc721Wrapper.approveProxyForAllAsync(tokenAddress, userAddress, isApproved);
                } else if (isProxyApprovedForAll && desiredAllowance.eq(constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS)) {
                    return; // Noop
                }

                const isProxyApproved = await erc721Wrapper.isProxyApprovedAsync(tokenAddress, tokenId);
                if (!isProxyApproved && desiredAllowance.eq(1)) {
                    await erc721Wrapper.approveProxyAsync(tokenAddress, tokenId);
                } else if (isProxyApproved && desiredAllowance.eq(0)) {
                    // Remove approval
                    await erc721Wrapper.approveAsync(constants.NULL_ADDRESS, tokenAddress, tokenId);
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
                // tslint:disable-next-line:no-unused-variable
                const [tokenAddress] = decodeERC1155AssetData(assetData);
                // ERC1155 allowances are all or nothing.
                const shouldApprovedForAll = desiredAllowance.gt(0);
                const currentAllowance = await this.getProxyAllowanceAsync(userAddress, assetData);
                if (shouldApprovedForAll && currentAllowance.eq(constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS)) {
                    // Nothing to do.
                } else if (!shouldApprovedForAll && currentAllowance.eq(constants.ZERO_AMOUNT)) {
                    // Nothing to do.
                } else {
                    assetProxyWrapper.setProxyAllowanceForAllAsync(userAddress, tokenAddress, shouldApprovedForAll);
                }
                break;
            }
            case AssetProxyId.MultiAsset: {
                // tslint:disable-next-line:no-unused-variable
                const [amounts, nestedAssetData] = decodeMultiAssetData(assetData);
                await Promise.all(
                    nestedAssetData.map(async _nestedAssetData =>
                        this.setProxyAllowanceAsync(userAddress, _nestedAssetData, desiredAllowance),
                    ),
                );
                break;
            }
            default:
                throw errorUtils.spawnSwitchErr('proxyId', proxyId);
        }
    }
}
