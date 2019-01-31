import { AssetProxyId, ExchangeContractErrs } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { AbstractBalanceAndProxyAllowanceLazyStore } from './abstract/abstract_balance_and_proxy_allowance_lazy_store';
import { assetDataUtils } from './asset_data_utils';
import { constants } from './constants';
import { TradeSide, TransferType } from './types';

enum FailureReason {
    Balance = 'balance',
    ProxyAllowance = 'proxyAllowance',
}

const ERR_MSG_MAPPING = {
    [FailureReason.Balance]: {
        [TradeSide.Maker]: {
            [TransferType.Trade]: ExchangeContractErrs.InsufficientMakerBalance,
            [TransferType.Fee]: ExchangeContractErrs.InsufficientMakerFeeBalance,
        },
        [TradeSide.Taker]: {
            [TransferType.Trade]: ExchangeContractErrs.InsufficientTakerBalance,
            [TransferType.Fee]: ExchangeContractErrs.InsufficientTakerFeeBalance,
        },
    },
    [FailureReason.ProxyAllowance]: {
        [TradeSide.Maker]: {
            [TransferType.Trade]: ExchangeContractErrs.InsufficientMakerAllowance,
            [TransferType.Fee]: ExchangeContractErrs.InsufficientMakerFeeAllowance,
        },
        [TradeSide.Taker]: {
            [TransferType.Trade]: ExchangeContractErrs.InsufficientTakerAllowance,
            [TransferType.Fee]: ExchangeContractErrs.InsufficientTakerFeeAllowance,
        },
    },
};

/**
 * An exchange transfer simulator which simulates asset transfers exactly how the
 * 0x exchange contract would do them.
 */
export class ExchangeTransferSimulator {
    private readonly _store: AbstractBalanceAndProxyAllowanceLazyStore;
    private static _throwValidationError(
        failureReason: FailureReason,
        tradeSide: TradeSide,
        transferType: TransferType,
    ): never {
        const errMsg = ERR_MSG_MAPPING[failureReason][tradeSide][transferType];
        throw new Error(errMsg);
    }
    /**
     * Instantiate a ExchangeTransferSimulator
     * @param store A class that implements AbstractBalanceAndProxyAllowanceLazyStore
     * @return an instance of ExchangeTransferSimulator
     */
    constructor(store: AbstractBalanceAndProxyAllowanceLazyStore) {
        this._store = store;
    }
    /**
     * Simulates transferFrom call performed by a proxy
     * @param  assetData         Data of the asset being transferred. Includes
     *                           it's identifying information and assetType,
     *                           e.g address for ERC20, address & tokenId for ERC721
     * @param  from              Owner of the transferred tokens
     * @param  to                Recipient of the transferred tokens
     * @param  amountInBaseUnits The amount of tokens being transferred
     * @param  tradeSide         Is Maker/Taker transferring
     * @param  transferType      Is it a fee payment or a value transfer
     */
    public async transferFromAsync(
        assetData: string,
        from: string,
        to: string,
        amountInBaseUnits: BigNumber,
        tradeSide: TradeSide,
        transferType: TransferType,
    ): Promise<void> {
        const assetProxyId = assetDataUtils.decodeAssetProxyId(assetData);
        switch (assetProxyId) {
            case AssetProxyId.ERC20:
            case AssetProxyId.ERC721:
                // HACK: When simulating an open order (e.g taker is NULL_ADDRESS), we don't want to adjust balances/
                // allowances for the taker. We do however, want to increase the balance of the maker since the maker
                // might be relying on those funds to fill subsequent orders or pay the order's fees.
                if (from === constants.NULL_ADDRESS && tradeSide === TradeSide.Taker) {
                    await this._increaseBalanceAsync(assetData, to, amountInBaseUnits);
                    return;
                }
                const balance = await this._store.getBalanceAsync(assetData, from);
                const proxyAllowance = await this._store.getProxyAllowanceAsync(assetData, from);
                if (proxyAllowance.isLessThan(amountInBaseUnits)) {
                    ExchangeTransferSimulator._throwValidationError(
                        FailureReason.ProxyAllowance,
                        tradeSide,
                        transferType,
                    );
                }
                if (balance.isLessThan(amountInBaseUnits)) {
                    ExchangeTransferSimulator._throwValidationError(FailureReason.Balance, tradeSide, transferType);
                }
                await this._decreaseProxyAllowanceAsync(assetData, from, amountInBaseUnits);
                await this._decreaseBalanceAsync(assetData, from, amountInBaseUnits);
                await this._increaseBalanceAsync(assetData, to, amountInBaseUnits);
                break;
            case AssetProxyId.MultiAsset:
                const decodedAssetData = assetDataUtils.decodeMultiAssetData(assetData);
                for (const [index, nestedAssetDataElement] of decodedAssetData.nestedAssetData.entries()) {
                    const amountsElement = decodedAssetData.amounts[index];
                    const totalAmount = amountInBaseUnits.times(amountsElement);
                    await this.transferFromAsync(
                        nestedAssetDataElement,
                        from,
                        to,
                        totalAmount,
                        tradeSide,
                        transferType,
                    );
                }
                break;
            default:
                break;
        }
    }
    private async _decreaseProxyAllowanceAsync(
        assetData: string,
        userAddress: string,
        amountInBaseUnits: BigNumber,
    ): Promise<void> {
        const proxyAllowance = await this._store.getProxyAllowanceAsync(assetData, userAddress);
        // HACK: This code assumes that all tokens with an UNLIMITED_ALLOWANCE_IN_BASE_UNITS set,
        // are UnlimitedAllowanceTokens. This is however not true, it just so happens that all
        // DummyERC20Tokens we use in tests are.
        if (!proxyAllowance.eq(constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS)) {
            this._store.setProxyAllowance(assetData, userAddress, proxyAllowance.minus(amountInBaseUnits));
        }
    }
    private async _increaseBalanceAsync(
        assetData: string,
        userAddress: string,
        amountInBaseUnits: BigNumber,
    ): Promise<void> {
        const balance = await this._store.getBalanceAsync(assetData, userAddress);
        this._store.setBalance(assetData, userAddress, balance.plus(amountInBaseUnits));
    }
    private async _decreaseBalanceAsync(
        assetData: string,
        userAddress: string,
        amountInBaseUnits: BigNumber,
    ): Promise<void> {
        const balance = await this._store.getBalanceAsync(assetData, userAddress);
        this._store.setBalance(assetData, userAddress, balance.minus(amountInBaseUnits));
    }
}
