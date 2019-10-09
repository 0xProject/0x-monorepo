import {
    AssetProxyId,
    ERC20AssetData,
    ERC721AssetData,
    ExchangeContractErrs,
    MultiAssetData,
    ObjectMap,
    OrderRelevantState,
    OrderState,
    OrderStateInvalid,
    OrderStateValid,
    SignedOrder,
    SingleAssetData,
} from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { AbstractBalanceAndProxyAllowanceFetcher } from './abstract/abstract_balance_and_proxy_allowance_fetcher';
import { AbstractOrderFilledCancelledFetcher } from './abstract/abstract_order_filled_cancelled_fetcher';
import { assetDataUtils } from './asset_data_utils';
import { orderHashUtils } from './order_hash';
import { OrderValidationUtils } from './order_validation_utils';
import { RemainingFillableCalculator } from './remaining_fillable_calculator';
import { utils } from './utils';

interface SidedOrderRelevantState {
    isMakerSide: boolean;
    traderBalance: BigNumber;
    traderIndividualBalances: ObjectMap<BigNumber>;
    traderProxyAllowance: BigNumber;
    traderIndividualProxyAllowances: ObjectMap<BigNumber>;
    traderFeeBalance: BigNumber;
    traderFeeProxyAllowance: BigNumber;
    filledTakerAssetAmount: BigNumber;
    remainingFillableAssetAmount: BigNumber;
    isOrderCancelled: boolean;
}
interface OrderValidResult {
    isValid: true;
}
interface OrderInvalidResult {
    isValid: false;
    error: ExchangeContractErrs;
}
type OrderValidationResult = OrderValidResult | OrderInvalidResult;

export class OrderStateUtils {
    private readonly _balanceAndProxyAllowanceFetcher: AbstractBalanceAndProxyAllowanceFetcher;
    private readonly _orderFilledCancelledFetcher: AbstractOrderFilledCancelledFetcher;
    private static _validateIfOrderIsValid(
        signedOrder: SignedOrder,
        sidedOrderRelevantState: SidedOrderRelevantState,
    ): OrderValidationResult {
        const isMakerSide = sidedOrderRelevantState.isMakerSide;
        if (sidedOrderRelevantState.isOrderCancelled) {
            return { isValid: false, error: ExchangeContractErrs.OrderCancelled };
        }
        const availableTakerAssetAmount = signedOrder.takerAssetAmount.minus(
            sidedOrderRelevantState.filledTakerAssetAmount,
        );
        if (availableTakerAssetAmount.eq(0)) {
            return { isValid: false, error: ExchangeContractErrs.OrderRemainingFillAmountZero };
        }

        if (sidedOrderRelevantState.traderBalance.eq(0)) {
            const error = isMakerSide
                ? ExchangeContractErrs.InsufficientMakerBalance
                : ExchangeContractErrs.InsufficientTakerBalance;
            return { isValid: false, error };
        }
        if (sidedOrderRelevantState.traderProxyAllowance.eq(0)) {
            const error = isMakerSide
                ? ExchangeContractErrs.InsufficientMakerAllowance
                : ExchangeContractErrs.InsufficientTakerAllowance;
            return { isValid: false, error };
        }
        if (!signedOrder.makerFee.eq(0)) {
            if (sidedOrderRelevantState.traderFeeBalance.eq(0)) {
                const error = isMakerSide
                    ? ExchangeContractErrs.InsufficientMakerFeeBalance
                    : ExchangeContractErrs.InsufficientTakerFeeBalance;
                return { isValid: false, error };
            }
            if (sidedOrderRelevantState.traderFeeProxyAllowance.eq(0)) {
                const error = isMakerSide
                    ? ExchangeContractErrs.InsufficientMakerFeeAllowance
                    : ExchangeContractErrs.InsufficientTakerFeeAllowance;
                return { isValid: false, error };
            }
        }
        const remainingTakerAssetAmount = signedOrder.takerAssetAmount.minus(
            sidedOrderRelevantState.filledTakerAssetAmount,
        );
        const isRoundingError = OrderValidationUtils.isRoundingErrorFloor(
            remainingTakerAssetAmount,
            signedOrder.takerAssetAmount,
            signedOrder.makerAssetAmount,
        );
        if (isRoundingError) {
            return { isValid: false, error: ExchangeContractErrs.OrderFillRoundingError };
        }
        return { isValid: true };
    }
    /**
     * Instantiate OrderStateUtils
     * @param balanceAndProxyAllowanceFetcher A class that is capable of fetching balances
     * and proxyAllowances for Ethereum addresses. It must implement AbstractBalanceAndProxyAllowanceFetcher
     * @param orderFilledCancelledFetcher A class that is capable of fetching whether an order
     * is cancelled and how much of it has been filled. It must implement AbstractOrderFilledCancelledFetcher
     * @return Instance of OrderStateUtils
     */
    constructor(
        balanceAndProxyAllowanceFetcher: AbstractBalanceAndProxyAllowanceFetcher,
        orderFilledCancelledFetcher: AbstractOrderFilledCancelledFetcher,
    ) {
        this._balanceAndProxyAllowanceFetcher = balanceAndProxyAllowanceFetcher;
        this._orderFilledCancelledFetcher = orderFilledCancelledFetcher;
    }
    /**
     * Get the orderState for an "open" order (i.e where takerAddress=NULL_ADDRESS)
     * This method will only check the maker's balance/allowance to calculate the
     * OrderState.
     * @param signedOrder The order of interest
     * @return State relevant to the signedOrder, as well as whether the signedOrder is "valid".
     * Validity is defined as a non-zero amount of the order can still be filled.
     */
    public async getOpenOrderStateAsync(signedOrder: SignedOrder, transactionHash?: string): Promise<OrderState> {
        const orderRelevantState = await this.getOpenOrderRelevantStateAsync(signedOrder);
        const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
        const isOrderCancelled = await this._orderFilledCancelledFetcher.isOrderCancelledAsync(signedOrder);
        const sidedOrderRelevantState = {
            isMakerSide: true,
            traderBalance: orderRelevantState.makerBalance,
            traderIndividualBalances: orderRelevantState.makerIndividualBalances,
            traderProxyAllowance: orderRelevantState.makerProxyAllowance,
            traderIndividualProxyAllowances: orderRelevantState.makerIndividualProxyAllowances,
            traderFeeBalance: orderRelevantState.makerFeeBalance,
            traderFeeProxyAllowance: orderRelevantState.makerFeeProxyAllowance,
            filledTakerAssetAmount: orderRelevantState.filledTakerAssetAmount,
            remainingFillableAssetAmount: orderRelevantState.remainingFillableMakerAssetAmount,
            isOrderCancelled,
        };
        const orderValidationResult = OrderStateUtils._validateIfOrderIsValid(signedOrder, sidedOrderRelevantState);
        if (orderValidationResult.isValid) {
            const orderState: OrderStateValid = {
                isValid: true,
                orderHash,
                orderRelevantState,
                transactionHash,
            };
            return orderState;
        } else {
            const orderState: OrderStateInvalid = {
                isValid: false,
                orderHash,
                error: orderValidationResult.error,
                transactionHash,
            };
            return orderState;
        }
    }
    /**
     * Get state relevant to an order (i.e makerBalance, makerAllowance, filledTakerAssetAmount, etc...
     * @param signedOrder Order of interest
     * @return An instance of OrderRelevantState
     */
    public async getOpenOrderRelevantStateAsync(signedOrder: SignedOrder): Promise<OrderRelevantState> {
        const isMaker = true;
        const sidedOrderRelevantState = await this._getSidedOrderRelevantStateAsync(
            isMaker,
            signedOrder,
            signedOrder.takerAddress,
        );
        const remainingFillableTakerAssetAmount = sidedOrderRelevantState.remainingFillableAssetAmount
            .times(signedOrder.takerAssetAmount)
            .dividedToIntegerBy(signedOrder.makerAssetAmount);

        const orderRelevantState = {
            makerBalance: sidedOrderRelevantState.traderBalance,
            makerIndividualBalances: sidedOrderRelevantState.traderIndividualBalances,
            makerProxyAllowance: sidedOrderRelevantState.traderProxyAllowance,
            makerIndividualProxyAllowances: sidedOrderRelevantState.traderIndividualProxyAllowances,
            makerFeeBalance: sidedOrderRelevantState.traderFeeBalance,
            makerFeeProxyAllowance: sidedOrderRelevantState.traderFeeProxyAllowance,
            filledTakerAssetAmount: sidedOrderRelevantState.filledTakerAssetAmount,
            remainingFillableMakerAssetAmount: sidedOrderRelevantState.remainingFillableAssetAmount,
            remainingFillableTakerAssetAmount,
        };
        return orderRelevantState;
    }
    /**
     * Get the max amount of the supplied order's takerAmount that could still be filled
     * @param signedOrder Order of interest
     * @param takerAddress Hypothetical taker of the order
     * @return fillableTakerAssetAmount
     */
    public async getMaxFillableTakerAssetAmountAsync(
        signedOrder: SignedOrder,
        takerAddress: string,
    ): Promise<BigNumber> {
        // Get max fillable amount for an order, considering the makers ability to fill
        let isMaker = true;
        const orderRelevantMakerState = await this._getSidedOrderRelevantStateAsync(
            isMaker,
            signedOrder,
            signedOrder.takerAddress,
        );
        const remainingFillableTakerAssetAmountGivenMakersStatus = signedOrder.makerAssetAmount.eq(0)
            ? new BigNumber(0)
            : utils.getPartialAmountFloor(
                  orderRelevantMakerState.remainingFillableAssetAmount,
                  signedOrder.makerAssetAmount,
                  signedOrder.takerAssetAmount,
              );

        // Get max fillable amount for an order, considering the takers ability to fill
        isMaker = false;
        const orderRelevantTakerState = await this._getSidedOrderRelevantStateAsync(isMaker, signedOrder, takerAddress);
        const remainingFillableTakerAssetAmountGivenTakersStatus = orderRelevantTakerState.remainingFillableAssetAmount;

        // The min of these two in the actualy max fillable by either party
        const fillableTakerAssetAmount = BigNumber.min(
            remainingFillableTakerAssetAmountGivenMakersStatus,
            remainingFillableTakerAssetAmountGivenTakersStatus,
        );

        return fillableTakerAssetAmount;
    }
    private async _getSidedOrderRelevantStateAsync(
        isMakerSide: boolean,
        signedOrder: SignedOrder,
        takerAddress: string,
    ): Promise<SidedOrderRelevantState> {
        let traderAddress;
        let assetData;
        let assetAmount;
        let feeAssetData;
        let feeAmount;
        if (isMakerSide) {
            traderAddress = signedOrder.makerAddress;
            assetData = signedOrder.makerAssetData;
            assetAmount = signedOrder.makerAssetAmount;
            feeAssetData = signedOrder.makerFeeAssetData;
            feeAmount = signedOrder.makerFee;
        } else {
            traderAddress = takerAddress;
            assetData = signedOrder.takerAssetData;
            assetAmount = signedOrder.takerAssetAmount;
            feeAssetData = signedOrder.takerFeeAssetData;
            feeAmount = signedOrder.takerFee;
        }
        const isPercentageFee = assetData === feeAssetData;

        const traderBalance = await this._balanceAndProxyAllowanceFetcher.getBalanceAsync(assetData, traderAddress);
        const traderIndividualBalances = await this._getAssetBalancesAsync(assetData, traderAddress);
        const traderProxyAllowance = await this._balanceAndProxyAllowanceFetcher.getProxyAllowanceAsync(
            assetData,
            traderAddress,
        );
        const traderIndividualProxyAllowances = await this._getAssetProxyAllowancesAsync(assetData, traderAddress);
        const traderFeeBalance = await this._balanceAndProxyAllowanceFetcher.getBalanceAsync(
            feeAssetData,
            traderAddress,
        );
        const traderFeeProxyAllowance = await this._balanceAndProxyAllowanceFetcher.getProxyAllowanceAsync(
            feeAssetData,
            traderAddress,
        );

        const transferrableTraderAssetAmount = BigNumber.min(traderProxyAllowance, traderBalance);
        const transferrableFeeAssetAmount = BigNumber.min(traderFeeProxyAllowance, traderFeeBalance);

        const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
        const filledTakerAssetAmount = await this._orderFilledCancelledFetcher.getFilledTakerAmountAsync(orderHash);
        const totalMakerAssetAmount = signedOrder.makerAssetAmount;
        const totalTakerAssetAmount = signedOrder.takerAssetAmount;
        const isOrderCancelled = await this._orderFilledCancelledFetcher.isOrderCancelledAsync(signedOrder);
        const remainingTakerAssetAmount = isOrderCancelled
            ? new BigNumber(0)
            : totalTakerAssetAmount.minus(filledTakerAssetAmount);
        const remainingMakerAssetAmount = remainingTakerAssetAmount.eq(0)
            ? new BigNumber(0)
            : remainingTakerAssetAmount.times(totalMakerAssetAmount).dividedToIntegerBy(totalTakerAssetAmount);
        const remainingAssetAmount = isMakerSide ? remainingMakerAssetAmount : remainingTakerAssetAmount;

        const remainingFillableCalculator = new RemainingFillableCalculator(
            feeAmount,
            assetAmount,
            isPercentageFee,
            transferrableTraderAssetAmount,
            transferrableFeeAssetAmount,
            remainingAssetAmount,
        );
        const remainingFillableAssetAmount = remainingFillableCalculator.computeRemainingFillable();

        const sidedOrderRelevantState = {
            isMakerSide,
            traderBalance,
            traderIndividualBalances,
            traderProxyAllowance,
            traderIndividualProxyAllowances,
            traderFeeBalance,
            traderFeeProxyAllowance,
            filledTakerAssetAmount,
            remainingFillableAssetAmount,
            isOrderCancelled,
        };
        return sidedOrderRelevantState;
    }
    private async _getAssetBalancesAsync(
        assetData: string,
        traderAddress: string,
        initialBalances: ObjectMap<BigNumber> = {},
    ): Promise<ObjectMap<BigNumber>> {
        const decodedAssetData = assetDataUtils.decodeAssetDataOrThrow(assetData);
        let balances: ObjectMap<BigNumber> = { ...initialBalances };
        if (isERC20AssetData(decodedAssetData) || isERC721AssetData(decodedAssetData)) {
            const balance = await this._balanceAndProxyAllowanceFetcher.getBalanceAsync(assetData, traderAddress);
            // tslint:disable-next-line:no-unnecessary-type-assertion
            const tokenAddress = (decodedAssetData as ERC20AssetData | ERC721AssetData).tokenAddress;
            balances[tokenAddress] =
                initialBalances[tokenAddress] === undefined ? balance : balances[tokenAddress].plus(balance);
        } else if (isMultiAssetData(decodedAssetData)) {
            for (const assetDataElement of (decodedAssetData as MultiAssetData).nestedAssetData) {
                balances = await this._getAssetBalancesAsync(assetDataElement, traderAddress, balances);
            }
        }
        return balances;
    }
    private async _getAssetProxyAllowancesAsync(
        assetData: string,
        traderAddress: string,
        initialAllowances: ObjectMap<BigNumber> = {},
    ): Promise<ObjectMap<BigNumber>> {
        const decodedAssetData = assetDataUtils.decodeAssetDataOrThrow(assetData);
        let allowances: ObjectMap<BigNumber> = { ...initialAllowances };
        if (isERC20AssetData(decodedAssetData) || isERC721AssetData(decodedAssetData)) {
            const allowance = await this._balanceAndProxyAllowanceFetcher.getProxyAllowanceAsync(
                assetData,
                traderAddress,
            );
            // tslint:disable-next-line:no-unnecessary-type-assertion
            const tokenAddress = (decodedAssetData as ERC20AssetData | ERC721AssetData).tokenAddress;
            allowances[tokenAddress] =
                initialAllowances[tokenAddress] === undefined ? allowance : allowances[tokenAddress].plus(allowance);
        } else if (isMultiAssetData(decodedAssetData)) {
            for (const assetDataElement of (decodedAssetData as MultiAssetData).nestedAssetData) {
                allowances = await this._getAssetBalancesAsync(assetDataElement, traderAddress, allowances);
            }
        }
        return allowances;
    }
}

function isERC20AssetData(decodedAssetData: SingleAssetData | MultiAssetData): boolean {
    return decodedAssetData.assetProxyId === AssetProxyId.ERC20;
}
function isERC721AssetData(decodedAssetData: SingleAssetData | MultiAssetData): boolean {
    return decodedAssetData.assetProxyId === AssetProxyId.ERC721;
}
function isMultiAssetData(decodedAssetData: SingleAssetData | MultiAssetData): boolean {
    return decodedAssetData.assetProxyId === AssetProxyId.MultiAsset;
}
