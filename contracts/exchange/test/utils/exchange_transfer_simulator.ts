import { DevUtilsContract } from '@0x/contracts-dev-utils';
import { constants } from '@0x/contracts-test-utils';
import { AssetProxyId, ExchangeContractErrs } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { AbstractBalanceAndProxyAllowanceLazyStore } from './abstract/abstract_balance_and_proxy_allowance_lazy_store';
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
    private readonly _devUtils: DevUtilsContract;
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
    constructor(store: AbstractBalanceAndProxyAllowanceLazyStore, devUtilsContract: DevUtilsContract) {
        this._store = store;
        this._devUtils = devUtilsContract;
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
        const assetProxyId = await this._devUtils.decodeAssetProxyId(assetData).callAsync();
        switch (assetProxyId) {
            case AssetProxyId.ERC1155:
            case AssetProxyId.ERC20:
            case AssetProxyId.ERC721: {
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
                if (assetProxyId !== AssetProxyId.ERC1155) {
                    // No need to decrease allowance for ERC115 because it's all or nothing.
                    await this._decreaseProxyAllowanceAsync(assetData, from, amountInBaseUnits);
                }
                await this._decreaseBalanceAsync(assetData, from, amountInBaseUnits);
                await this._increaseBalanceAsync(assetData, to, amountInBaseUnits);
                break;
            }
            case AssetProxyId.MultiAsset: {
                const decodedAssetData = await this._devUtils.decodeMultiAssetData(assetData).callAsync();
                await this._decreaseBalanceAsync(assetData, from, amountInBaseUnits);
                await this._increaseBalanceAsync(assetData, to, amountInBaseUnits);
                for (const [index, nestedAssetDataElement] of decodedAssetData[2].entries()) {
                    const amountsElement = decodedAssetData[1][index];
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
            }
            default:
                throw new Error(`Unhandled asset proxy ID: ${assetProxyId}`);
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
