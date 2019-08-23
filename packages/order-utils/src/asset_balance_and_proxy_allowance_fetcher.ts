import { ERC20ProxyContract, ERC20TokenContract, ERC721ProxyContract, ERC721TokenContract } from '@0x/abi-gen-wrappers';
import { BigNumber } from '@0x/utils';
import { BlockParamLiteral, SupportedProvider } from 'ethereum-types';
import * as _ from 'lodash';

import { AbstractBalanceAndProxyAllowanceFetcher } from './abstract/abstract_balance_and_proxy_allowance_fetcher';
import { assetDataUtils } from './asset_data_utils';

const UNLIMITED_ALLOWANCE_IN_BASE_UNITS = new BigNumber(2).pow(256).minus(1); // tslint:disable-line:custom-no-magic-numbers

export class AssetBalanceAndProxyAllowanceFetcher implements AbstractBalanceAndProxyAllowanceFetcher {
    private readonly _stateLayer: BlockParamLiteral;
    private readonly _erc20Proxy: ERC20ProxyContract;
    private readonly _erc721Proxy: ERC721ProxyContract;
    private readonly _provider: SupportedProvider;
    constructor(
        erc20Proxy: ERC20ProxyContract,
        erc721Proxy: ERC721ProxyContract,
        provider: SupportedProvider,
        stateLayer: BlockParamLiteral,
    ) {
        this._erc20Proxy = erc20Proxy;
        this._erc721Proxy = erc721Proxy;
        this._stateLayer = stateLayer;
        this._provider = provider;
    }
    public async getBalanceAsync(assetData: string, userAddress: string): Promise<BigNumber> {
        const decodedAssetData = assetDataUtils.decodeAssetDataOrThrow(assetData);
        let balance: BigNumber | undefined;
        const defaultBlock = this._stateLayer;
        const callData = {};
        if (assetDataUtils.isERC20AssetData(decodedAssetData)) {
            const erc20Token = new ERC20TokenContract(decodedAssetData.tokenAddress, this._provider);
            balance = await erc20Token.balanceOf.callAsync(userAddress, {}, defaultBlock);
        } else if (assetDataUtils.isERC721AssetData(decodedAssetData)) {
            const erc721Token = new ERC721TokenContract(decodedAssetData.tokenAddress, this._provider);
            const tokenOwner = await erc721Token.ownerOf.callAsync(decodedAssetData.tokenId, callData, defaultBlock);
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
        const defaultBlock = this._stateLayer;
        const callData = {};
        if (assetDataUtils.isERC20AssetData(decodedAssetData)) {
            const erc20Token = new ERC20TokenContract(decodedAssetData.tokenAddress, this._provider);
            proxyAllowance = await erc20Token.allowance.callAsync(
                userAddress,
                this._erc20Proxy.address,
                callData,
                defaultBlock,
            );
        } else if (assetDataUtils.isERC721AssetData(decodedAssetData)) {
            const erc721Token = new ERC721TokenContract(decodedAssetData.tokenAddress, this._provider);
            const isApprovedForAll = await erc721Token.isApprovedForAll.callAsync(
                userAddress,
                this._erc721Proxy.address,
                callData,
                defaultBlock,
            );
            if (isApprovedForAll) {
                return UNLIMITED_ALLOWANCE_IN_BASE_UNITS;
            } else {
                const approvedAddress = await erc721Token.getApproved.callAsync(
                    decodedAssetData.tokenId,
                    callData,
                    defaultBlock,
                );
                const isApproved = approvedAddress === this._erc721Proxy.address;
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
