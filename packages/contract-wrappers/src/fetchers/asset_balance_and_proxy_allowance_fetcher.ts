// tslint:disable:no-unnecessary-type-assertion
import { AbstractBalanceAndProxyAllowanceFetcher, assetDataUtils } from '@0x/order-utils';
import { AssetProxyId, ERC20AssetData, ERC721AssetData } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { BlockParamLiteral } from 'ethereum-types';

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
        if (decodedAssetData.assetProxyId === AssetProxyId.ERC20) {
            const decodedERC20AssetData = decodedAssetData as ERC20AssetData;
            const balance = await this._erc20Token.getBalanceAsync(decodedERC20AssetData.tokenAddress, userAddress, {
                defaultBlock: this._stateLayer,
            });
            return balance;
        } else {
            const decodedERC721AssetData = decodedAssetData as ERC721AssetData;
            const tokenOwner = await this._erc721Token.getOwnerOfAsync(
                decodedERC721AssetData.tokenAddress,
                decodedERC721AssetData.tokenId,
                {
                    defaultBlock: this._stateLayer,
                },
            );
            const balance = tokenOwner === userAddress ? new BigNumber(1) : new BigNumber(0);
            return balance;
        }
    }
    public async getProxyAllowanceAsync(assetData: string, userAddress: string): Promise<BigNumber> {
        const decodedAssetData = assetDataUtils.decodeAssetDataOrThrow(assetData);
        if (decodedAssetData.assetProxyId === AssetProxyId.ERC20) {
            const decodedERC20AssetData = decodedAssetData as ERC20AssetData;
            const proxyAllowance = await this._erc20Token.getProxyAllowanceAsync(
                decodedERC20AssetData.tokenAddress,
                userAddress,
                {
                    defaultBlock: this._stateLayer,
                },
            );
            return proxyAllowance;
        } else {
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
                const proxyAllowance = isApproved ? new BigNumber(1) : new BigNumber(0);
                return proxyAllowance;
            }
        }
    }
}
