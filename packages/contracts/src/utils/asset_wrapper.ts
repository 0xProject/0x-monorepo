import { assetProxyUtils } from '@0xproject/order-utils';
import { BigNumber, errorUtils } from '@0xproject/utils';
import * as _ from 'lodash';

import { AbstractAssetWrapper } from '../abstract/abstract_asset_wrapper';

import { constants } from './constants';
import { ERC20Wrapper } from './erc20_wrapper';
import { ERC721Wrapper } from './erc721_wrapper';

interface ProxyIdToAssetWrappers {
    [proxyId: number]: AbstractAssetWrapper;
}

/**
 * This class abstracts away the differences between ERC20 and ERC721 tokens so that
 * the logic that uses it does not need to care what standard a token belongs to.
 */
export class AssetWrapper {
    private _proxyIdToAssetWrappers: ProxyIdToAssetWrappers;
    constructor(assetWrappers: AbstractAssetWrapper[]) {
        this._proxyIdToAssetWrappers = {};
        _.each(assetWrappers, assetWrapper => {
            const proxyId = assetWrapper.getProxyId();
            this._proxyIdToAssetWrappers[proxyId] = assetWrapper;
        });
    }
    public async getBalanceAsync(userAddress: string, assetData: string): Promise<BigNumber> {
        const proxyId = assetProxyUtils.decodeAssetDataId(assetData);
        switch (proxyId) {
            case constants.ERC20_PROXY_ID: {
                const erc20Wrapper = this._proxyIdToAssetWrappers[proxyId] as ERC20Wrapper;
                const balance = await erc20Wrapper.getBalanceAsync(userAddress, assetData);
                return balance;
            }
            case constants.ERC721_PROXY_ID: {
                const assetWrapper = this._proxyIdToAssetWrappers[proxyId] as ERC721Wrapper;
                const assetProxyData = assetProxyUtils.decodeERC721AssetData(assetData);
                const isOwner = await assetWrapper.isOwnerAsync(
                    userAddress,
                    assetProxyData.tokenAddress,
                    assetProxyData.tokenId,
                );
                const balance = isOwner ? new BigNumber(1) : new BigNumber(0);
                return balance;
            }
            default:
                throw errorUtils.spawnSwitchErr('proxyId', proxyId);
        }
    }
    public async setBalanceAsync(userAddress: string, assetData: string, desiredBalance: BigNumber): Promise<void> {
        const proxyId = assetProxyUtils.decodeAssetDataId(assetData);
        switch (proxyId) {
            case constants.ERC20_PROXY_ID: {
                const erc20Wrapper = this._proxyIdToAssetWrappers[proxyId] as ERC20Wrapper;
                await erc20Wrapper.setBalanceAsync(userAddress, assetData, desiredBalance);
                return;
            }
            case constants.ERC721_PROXY_ID: {
                if (!desiredBalance.eq(0) && !desiredBalance.eq(1)) {
                    throw new Error(`Balance for ERC721 token can only be set to 0 or 1. Got: ${desiredBalance}`);
                }
                const erc721Wrapper = this._proxyIdToAssetWrappers[proxyId] as ERC721Wrapper;
                const assetProxyData = assetProxyUtils.decodeERC721AssetData(assetData);
                const doesTokenExist = erc721Wrapper.doesTokenExistAsync(
                    assetProxyData.tokenAddress,
                    assetProxyData.tokenId,
                );
                if (!doesTokenExist && desiredBalance.eq(1)) {
                    await erc721Wrapper.mintAsync(assetProxyData.tokenAddress, assetProxyData.tokenId, userAddress);
                    return;
                } else if (!doesTokenExist && desiredBalance.eq(0)) {
                    return; // noop
                }
                const tokenOwner = await erc721Wrapper.ownerOfAsync(
                    assetProxyData.tokenAddress,
                    assetProxyData.tokenId,
                );
                if (userAddress !== tokenOwner && desiredBalance.eq(1)) {
                    await erc721Wrapper.transferFromAsync(
                        assetProxyData.tokenAddress,
                        assetProxyData.tokenId,
                        tokenOwner,
                        userAddress,
                    );
                } else if (tokenOwner === userAddress && desiredBalance.eq(0)) {
                    // Burn token
                    await erc721Wrapper.burnAsync(assetProxyData.tokenAddress, assetProxyData.tokenId, userAddress);
                    return;
                }
                break;
            }
            default:
                throw errorUtils.spawnSwitchErr('proxyId', proxyId);
        }
    }
    public async getProxyAllowanceAsync(userAddress: string, assetData: string): Promise<BigNumber> {
        const proxyId = assetProxyUtils.decodeAssetDataId(assetData);
        switch (proxyId) {
            case constants.ERC20_PROXY_ID: {
                const erc20Wrapper = this._proxyIdToAssetWrappers[proxyId] as ERC20Wrapper;
                const allowance = await erc20Wrapper.getProxyAllowanceAsync(userAddress, assetData);
                return allowance;
            }
            case constants.ERC721_PROXY_ID: {
                const assetWrapper = this._proxyIdToAssetWrappers[proxyId] as ERC721Wrapper;
                const erc721ProxyData = assetProxyUtils.decodeERC721AssetData(assetData);
                const isProxyApproved = await assetWrapper.isProxyApprovedAsync(
                    erc721ProxyData.tokenAddress,
                    erc721ProxyData.tokenId,
                );
                const isProxyApprovedForAllAsync = await assetWrapper.isProxyApprovedForAllAsync(
                    userAddress,
                    erc721ProxyData.tokenAddress,
                    erc721ProxyData.tokenId,
                );
                const allowance = isProxyApproved || isProxyApprovedForAllAsync ? new BigNumber(1) : new BigNumber(0);
                return allowance;
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
        const proxyId = assetProxyUtils.decodeAssetDataId(assetData);
        switch (proxyId) {
            case constants.ERC20_PROXY_ID: {
                const erc20Wrapper = this._proxyIdToAssetWrappers[proxyId] as ERC20Wrapper;
                await erc20Wrapper.setAllowanceAsync(userAddress, assetData, desiredAllowance);
                return;
            }
            case constants.ERC721_PROXY_ID: {
                if (!desiredAllowance.eq(0) && !desiredAllowance.eq(1)) {
                    throw new Error(`Allowance for ERC721 token can only be set to 0 or 1. Got: ${desiredAllowance}`);
                }
                const erc721Wrapper = this._proxyIdToAssetWrappers[proxyId] as ERC721Wrapper;
                const assetProxyData = assetProxyUtils.decodeERC721AssetData(assetData);

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
                    assetProxyData.tokenId,
                );
                // HACK: We do not currently support ApprovedForAll when setting proxy allowance
                // This was intentional since unsetting ApprovedForAll, will unset approval for unrelated
                // tokens other then the one specified in the call to this method.
                if (isProxyApprovedForAll) {
                    throw new Error(`We don't currently support the use of "approveAll" functionality for ERC721.`);
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
                }

                break;
            }
            default:
                throw errorUtils.spawnSwitchErr('proxyId', proxyId);
        }
    }
}
