// tslint:disable:no-unnecessary-type-assertion
import { AbstractBalanceAndProxyAllowanceFetcher, assetDataUtils } from '@0x/order-utils';
import { AssetProxyId, ERC20AssetData, ERC721AssetData, MultiAssetData } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { BlockParamLiteral } from 'ethereum-types';
import * as _ from 'lodash';

import { ERC20TokenWrapper } from '../contract_wrappers/erc20_token_wrapper';
import { ERC721TokenWrapper } from '../contract_wrappers/erc721_token_wrapper';

export class AssetBalanceAndProxyAllowanceFetcher implements AbstractBalanceAndProxyAllowanceFetcher {
    private readonly _erc20Token: ERC20TokenWrapper;
    private readonly _erc721Token: ERC721TokenWrapper;
    private readonly _stateLayer: BlockParamLiteral;
    constructor(erc20Token: ERC20TokenWrapper, erc721Token: ERC721TokenWrapper, stateLayer: BlockParamLiteral) {
        this._erc20Token = erc20Token;
        this._erc721Token = erc721Token;
        this._stateLayer = stateLayer;
    }
    public async getBalanceAsync(assetData: string, userAddress: string): Promise<BigNumber> {
        const decodedAssetData = assetDataUtils.decodeAssetDataOrThrow(assetData);
        let balance: BigNumber | undefined;
        switch (decodedAssetData.assetProxyId) {
            case AssetProxyId.ERC20:
                const decodedERC20AssetData = decodedAssetData as ERC20AssetData;
                balance = await this._erc20Token.getBalanceAsync(decodedERC20AssetData.tokenAddress, userAddress, {
                    defaultBlock: this._stateLayer,
                });
                break;
            case AssetProxyId.ERC721:
                const decodedERC721AssetData = decodedAssetData as ERC721AssetData;
                const tokenOwner = await this._erc721Token.getOwnerOfAsync(
                    decodedERC721AssetData.tokenAddress,
                    decodedERC721AssetData.tokenId,
                    {
                        defaultBlock: this._stateLayer,
                    },
                );
                balance = tokenOwner === userAddress ? new BigNumber(1) : new BigNumber(0);
                break;
            case AssetProxyId.MultiAsset:
                // The `balance` for MultiAssetData is the total units of the entire `assetData` that are held by the `userAddress`.
                for (const [
                    index,
                    nestedAssetDataElement,
                ] of (decodedAssetData as MultiAssetData).nestedAssetData.entries()) {
                    const nestedAmountElement = (decodedAssetData as MultiAssetData).amounts[index];
                    const nestedAssetBalance = (await this.getBalanceAsync(
                        nestedAssetDataElement,
                        userAddress,
                    )).dividedToIntegerBy(nestedAmountElement);
                    if (_.isUndefined(balance) || nestedAssetBalance.lessThan(balance)) {
                        balance = nestedAssetBalance;
                    }
                }
                break;
            default:
                throw new Error(`Proxy with id ${decodedAssetData.assetProxyId} not supported`);
        }
        return balance as BigNumber;
    }
    public async getProxyAllowanceAsync(assetData: string, userAddress: string): Promise<BigNumber> {
        const decodedAssetData = assetDataUtils.decodeAssetDataOrThrow(assetData);
        let proxyAllowance: BigNumber | undefined;
        switch (decodedAssetData.assetProxyId) {
            case AssetProxyId.ERC20:
                const decodedERC20AssetData = decodedAssetData as ERC20AssetData;
                proxyAllowance = await this._erc20Token.getProxyAllowanceAsync(
                    decodedERC20AssetData.tokenAddress,
                    userAddress,
                    {
                        defaultBlock: this._stateLayer,
                    },
                );
                break;
            case AssetProxyId.ERC721:
                const decodedERC721AssetData = decodedAssetData as ERC721AssetData;
                const isApprovedForAll = await this._erc721Token.isProxyApprovedForAllAsync(
                    decodedERC721AssetData.tokenAddress,
                    userAddress,
                    {
                        defaultBlock: this._stateLayer,
                    },
                );
                if (isApprovedForAll) {
                    return new BigNumber(this._erc20Token.UNLIMITED_ALLOWANCE_IN_BASE_UNITS);
                } else {
                    const isApproved = await this._erc721Token.isProxyApprovedAsync(
                        decodedERC721AssetData.tokenAddress,
                        decodedERC721AssetData.tokenId,
                        {
                            defaultBlock: this._stateLayer,
                        },
                    );
                    proxyAllowance = isApproved ? new BigNumber(1) : new BigNumber(0);
                }
                break;
            case AssetProxyId.MultiAsset:
                // The `proxyAllowance` for MultiAssetData is the total units of the entire `assetData` that the proxies have been approved to spend by the `userAddress`.
                for (const [
                    index,
                    nestedAssetDataElement,
                ] of (decodedAssetData as MultiAssetData).nestedAssetData.entries()) {
                    const nestedAmountElement = (decodedAssetData as MultiAssetData).amounts[index];
                    const nestedAssetAllowance = (await this.getProxyAllowanceAsync(
                        nestedAssetDataElement,
                        userAddress,
                    )).dividedToIntegerBy(nestedAmountElement);
                    if (_.isUndefined(proxyAllowance) || nestedAssetAllowance.lessThan(proxyAllowance)) {
                        proxyAllowance = nestedAssetAllowance;
                    }
                }
                break;
            default:
                throw new Error(`Proxy with id ${decodedAssetData.assetProxyId} not supported`);
        }
        return proxyAllowance as BigNumber;
    }
}
