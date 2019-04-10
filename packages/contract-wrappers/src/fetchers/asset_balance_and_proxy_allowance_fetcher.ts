import { AbstractBalanceAndProxyAllowanceFetcher, assetDataUtils } from '@0x/order-utils';
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
        if (assetDataUtils.isERC20AssetData(decodedAssetData)) {
            balance = await this._erc20Token.getBalanceAsync(decodedAssetData.tokenAddress, userAddress, {
                defaultBlock: this._stateLayer,
            });
        } else if (assetDataUtils.isERC721AssetData(decodedAssetData)) {
            const tokenOwner = await this._erc721Token.getOwnerOfAsync(
                decodedAssetData.tokenAddress,
                decodedAssetData.tokenId,
                {
                    defaultBlock: this._stateLayer,
                },
            );
            balance = tokenOwner === userAddress ? new BigNumber(1) : new BigNumber(0);
        } else if (assetDataUtils.isMultiAssetData(decodedAssetData)) {
            // The `balance` for MultiAssetData is the total units of the entire `assetData` that are held by the `userAddress`.
            for (const [index, nestedAssetDataElement] of decodedAssetData.nestedAssetData.entries()) {
                const nestedAmountElement = decodedAssetData.amounts[index];
                const nestedAssetBalance = (await this.getBalanceAsync(
                    nestedAssetDataElement,
                    userAddress,
                )).dividedToIntegerBy(nestedAmountElement);
                if (balance === undefined || nestedAssetBalance.isLessThan(balance)) {
                    balance = nestedAssetBalance;
                }
            }
        }
        return balance as BigNumber;
    }
    public async getProxyAllowanceAsync(assetData: string, userAddress: string): Promise<BigNumber> {
        const decodedAssetData = assetDataUtils.decodeAssetDataOrThrow(assetData);
        let proxyAllowance: BigNumber | undefined;
        if (assetDataUtils.isERC20AssetData(decodedAssetData)) {
            proxyAllowance = await this._erc20Token.getProxyAllowanceAsync(decodedAssetData.tokenAddress, userAddress, {
                defaultBlock: this._stateLayer,
            });
        } else if (assetDataUtils.isERC721AssetData(decodedAssetData)) {
            const isApprovedForAll = await this._erc721Token.isProxyApprovedForAllAsync(
                decodedAssetData.tokenAddress,
                userAddress,
                {
                    defaultBlock: this._stateLayer,
                },
            );
            if (isApprovedForAll) {
                return new BigNumber(this._erc20Token.UNLIMITED_ALLOWANCE_IN_BASE_UNITS);
            } else {
                const isApproved = await this._erc721Token.isProxyApprovedAsync(
                    decodedAssetData.tokenAddress,
                    decodedAssetData.tokenId,
                    {
                        defaultBlock: this._stateLayer,
                    },
                );
                proxyAllowance = isApproved ? new BigNumber(1) : new BigNumber(0);
            }
        } else if (assetDataUtils.isMultiAssetData(decodedAssetData)) {
            // The `proxyAllowance` for MultiAssetData is the total units of the entire `assetData` that the proxies have been approved to spend by the `userAddress`.
            for (const [index, nestedAssetDataElement] of decodedAssetData.nestedAssetData.entries()) {
                const nestedAmountElement = decodedAssetData.amounts[index];
                const nestedAssetAllowance = (await this.getProxyAllowanceAsync(
                    nestedAssetDataElement,
                    userAddress,
                )).dividedToIntegerBy(nestedAmountElement);
                if (proxyAllowance === undefined || nestedAssetAllowance.isLessThan(proxyAllowance)) {
                    proxyAllowance = nestedAssetAllowance;
                }
            }
        }
        return proxyAllowance as BigNumber;
    }
}
