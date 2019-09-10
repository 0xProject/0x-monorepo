import {
    DevUtilsContract,
    ExchangeContract,
    getContractAddressesForNetworkOrThrow,
    IAssetProxyContract,
    NetworkId,
} from '@0x/abi-gen-wrappers';
import { assert } from '@0x/assert';
import { getNetworkIdByExchangeAddressOrThrow } from '@0x/contract-addresses';
import { ExchangeContractErrs, RevertReason, SignedOrder } from '@0x/types';
import { BigNumber, providerUtils } from '@0x/utils';
import { SupportedProvider, ZeroExProvider } from 'ethereum-types';
import * as _ from 'lodash';

import { AbstractOrderFilledCancelledFetcher } from './abstract/abstract_order_filled_cancelled_fetcher';
import { AssetBalanceAndProxyAllowanceFetcher } from './asset_balance_and_proxy_allowance_fetcher';
import { assetDataUtils } from './asset_data_utils';
import { constants } from './constants';
import { ExchangeTransferSimulator } from './exchange_transfer_simulator';
import { orderCalculationUtils } from './order_calculation_utils';
import { orderHashUtils } from './order_hash';
import { OrderStateUtils } from './order_state_utils';
import { validateOrderFillableOptsSchema } from './schemas/validate_order_fillable_opts_schema';
import { signatureUtils } from './signature_utils';
import { BalanceAndProxyAllowanceLazyStore } from './store/balance_and_proxy_allowance_lazy_store';
import { TradeSide, TransferType, TypedDataError, ValidateOrderFillableOpts } from './types';
import { utils } from './utils';

/**
 * A utility class for validating orders
 */
export class OrderValidationUtils {
    private readonly _orderFilledCancelledFetcher: AbstractOrderFilledCancelledFetcher;
    private readonly _provider: ZeroExProvider;
    /**
     * A TypeScript implementation mirroring the implementation of isRoundingError in the
     * Exchange smart contract
     * @param numerator Numerator value. When used to check an order, pass in `takerAssetFilledAmount`
     * @param denominator Denominator value.  When used to check an order, pass in `order.takerAssetAmount`
     * @param target Target value. When used to check an order, pass in `order.makerAssetAmount`
     */
    public static isRoundingErrorFloor(numerator: BigNumber, denominator: BigNumber, target: BigNumber): boolean {
        // Solidity's mulmod() in JS
        // Source: https://solidity.readthedocs.io/en/latest/units-and-global-variables.html#mathematical-and-cryptographic-functions
        if (denominator.eq(0)) {
            throw new Error('denominator cannot be 0');
        }
        const remainder = target.multipliedBy(numerator).mod(denominator);
        if (remainder.eq(0)) {
            return false; // no rounding error
        }

        // tslint:disable-next-line:custom-no-magic-numbers
        const errPercentageTimes1000000 = remainder.multipliedBy(1000000).div(numerator.multipliedBy(target));
        // tslint:disable-next-line:custom-no-magic-numbers
        const isError = errPercentageTimes1000000.gt(1000);
        return isError;
    }

    /**
     * Validate that the maker & taker have sufficient balances/allowances
     * to fill the supplied order to the fillTakerAssetAmount amount
     * @param exchangeTradeEmulator ExchangeTradeEmulator to use
     * @param signedOrder SignedOrder to test
     * @param fillTakerAssetAmount Amount of takerAsset to fill the signedOrder
     * @param senderAddress Sender of the fillOrder tx
     * @param zrxAssetData AssetData for the ZRX token
     */
    public static async validateFillOrderBalancesAllowancesThrowIfInvalidAsync(
        exchangeTradeEmulator: ExchangeTransferSimulator,
        signedOrder: SignedOrder,
        fillTakerAssetAmount: BigNumber,
        senderAddress: string,
        zrxAssetData: string,
    ): Promise<void> {
        const fillMakerTokenAmount = utils.getPartialAmountFloor(
            fillTakerAssetAmount,
            signedOrder.takerAssetAmount,
            signedOrder.makerAssetAmount,
        );
        await exchangeTradeEmulator.transferFromAsync(
            signedOrder.makerAssetData,
            signedOrder.makerAddress,
            senderAddress,
            fillMakerTokenAmount,
            TradeSide.Maker,
            TransferType.Trade,
        );
        await exchangeTradeEmulator.transferFromAsync(
            signedOrder.takerAssetData,
            senderAddress,
            signedOrder.makerAddress,
            fillTakerAssetAmount,
            TradeSide.Taker,
            TransferType.Trade,
        );
        const makerFeeAmount = utils.getPartialAmountFloor(
            fillTakerAssetAmount,
            signedOrder.takerAssetAmount,
            signedOrder.makerFee,
        );
        await exchangeTradeEmulator.transferFromAsync(
            zrxAssetData,
            signedOrder.makerAddress,
            signedOrder.feeRecipientAddress,
            makerFeeAmount,
            TradeSide.Maker,
            TransferType.Fee,
        );
        const takerFeeAmount = utils.getPartialAmountFloor(
            fillTakerAssetAmount,
            signedOrder.takerAssetAmount,
            signedOrder.takerFee,
        );
        await exchangeTradeEmulator.transferFromAsync(
            zrxAssetData,
            senderAddress,
            signedOrder.feeRecipientAddress,
            takerFeeAmount,
            TradeSide.Taker,
            TransferType.Fee,
        );
    }
    // TODO(xianny): remove this method once the smart contracts have been refactored
    // to return helpful revert reasons instead of ORDER_UNFILLABLE. Instruct devs
    // to make "calls" to validate transfers
    /**
     * Validate the transfer from the maker to the taker. This is simulated on-chain
     * via an eth_call. If this call fails, the asset is currently nontransferable.
     * @param exchangeTradeEmulator ExchangeTradeEmulator to use
     * @param signedOrder SignedOrder of interest
     * @param makerAssetAmount Amount to transfer from the maker
     * @param takerAddress The address to transfer to, defaults to signedOrder.takerAddress
     */
    public static async validateMakerTransferThrowIfInvalidAsync(
        networkId: NetworkId,
        supportedProvider: SupportedProvider,
        signedOrder: SignedOrder,
        makerAssetAmount: BigNumber,
        takerAddress?: string,
    ): Promise<void> {
        const toAddress = takerAddress === undefined ? signedOrder.takerAddress : takerAddress;
        const contractAddresses = getContractAddressesForNetworkOrThrow(networkId);
        const makerAssetDataProxyId = assetDataUtils.decodeAssetProxyId(signedOrder.makerAssetData);
        const exchangeContract = new ExchangeContract(contractAddresses.exchange, supportedProvider);
        const assetProxyAddress = await exchangeContract.assetProxies.callAsync(makerAssetDataProxyId);
        const assetProxy = new IAssetProxyContract(assetProxyAddress, supportedProvider);
        const result = await assetProxy.transferFrom.callAsync(
            signedOrder.makerAssetData,
            signedOrder.makerAddress,
            toAddress,
            makerAssetAmount,
            {
                from: exchangeContract.address,
            },
        );
        if (result !== undefined) {
            throw new Error(`Error during maker transfer simulation: ${result}`);
        }
    }

    private static _validateOrderNotExpiredOrThrow(expirationTimeSeconds: BigNumber): void {
        const currentUnixTimestampSec = utils.getCurrentUnixTimestampSec();
        if (expirationTimeSeconds.isLessThan(currentUnixTimestampSec)) {
            throw new Error(RevertReason.OrderUnfillable);
        }
    }
    /**
     * Instantiate OrderValidationUtils
     * @param orderFilledCancelledFetcher A module that implements the AbstractOrderFilledCancelledFetcher
     * @param supportedProvider Web3 provider to use for JSON RPC calls
     * @return An instance of OrderValidationUtils
     */
    constructor(
        orderFilledCancelledFetcher: AbstractOrderFilledCancelledFetcher,
        supportedProvider: SupportedProvider,
    ) {
        this._orderFilledCancelledFetcher = orderFilledCancelledFetcher;
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        this._provider = provider;
    }

    // TODO(xianny): remove this method once the smart contracts have been refactored
    // to return helpful revert reasons instead of ORDER_UNFILLABLE. Instruct devs
    // to make "calls" to validate order fillability + getOrderInfo for fillable amount.
    // This method recreates functionality from ExchangeWrapper (@0x/contract-wrappers < 11.0.0)
    // to make migrating easier in the interim.
    /**
     * Validate if the supplied order is fillable, and throw if it isn't
     * @param provider The same provider used to interact with contracts
     * @param signedOrder SignedOrder of interest
     * @param opts ValidateOrderFillableOpts options (e.g expectedFillTakerTokenAmount.
     * If it isn't supplied, we check if the order is fillable for the remaining amount.
     * To check if the order is fillable for a non-zero amount, set `validateRemainingOrderAmountIsFillable` to false.)
     */
    public async simpleValidateOrderFillableOrThrowAsync(
        provider: SupportedProvider,
        signedOrder: SignedOrder,
        opts: ValidateOrderFillableOpts = {},
    ): Promise<void> {
        assert.doesConformToSchema('opts', opts, validateOrderFillableOptsSchema);

        const exchangeAddress = signedOrder.exchangeAddress;
        const networkId = getNetworkIdByExchangeAddressOrThrow(exchangeAddress);
        const { zrxToken, devUtils } = getContractAddressesForNetworkOrThrow(networkId);
        const exchangeContract = new ExchangeContract(exchangeAddress, provider);
        const balanceAllowanceFetcher = new AssetBalanceAndProxyAllowanceFetcher(
            new DevUtilsContract(devUtils, provider),
        );
        const balanceAllowanceStore = new BalanceAndProxyAllowanceLazyStore(balanceAllowanceFetcher);
        const exchangeTradeSimulator = new ExchangeTransferSimulator(balanceAllowanceStore);

        // Define fillable taker asset amount
        let fillableTakerAssetAmount;
        const shouldValidateRemainingOrderAmountIsFillable =
            opts.validateRemainingOrderAmountIsFillable === undefined
                ? true
                : opts.validateRemainingOrderAmountIsFillable;
        if (opts.expectedFillTakerTokenAmount) {
            // If the caller has specified a taker fill amount, we use this for all validation
            fillableTakerAssetAmount = opts.expectedFillTakerTokenAmount;
        } else if (shouldValidateRemainingOrderAmountIsFillable) {
            // Default behaviour is to validate the amount left on the order.
            const filledTakerTokenAmount = await exchangeContract.filled.callAsync(
                orderHashUtils.getOrderHashHex(signedOrder),
            );
            fillableTakerAssetAmount = signedOrder.takerAssetAmount.minus(filledTakerTokenAmount);
        } else {
            const orderStateUtils = new OrderStateUtils(balanceAllowanceStore, this._orderFilledCancelledFetcher);
            // Calculate the taker amount fillable given the maker balance and allowance
            const orderRelevantState = await orderStateUtils.getOpenOrderRelevantStateAsync(signedOrder);
            fillableTakerAssetAmount = orderRelevantState.remainingFillableTakerAssetAmount;
        }

        await this.validateOrderFillableOrThrowAsync(
            exchangeTradeSimulator,
            signedOrder,
            assetDataUtils.encodeERC20AssetData(zrxToken),
            fillableTakerAssetAmount,
        );
        const makerTransferAmount = orderCalculationUtils.getMakerFillAmount(signedOrder, fillableTakerAssetAmount);
        await OrderValidationUtils.validateMakerTransferThrowIfInvalidAsync(
            networkId,
            provider,
            signedOrder,
            makerTransferAmount,
            opts.simulationTakerAddress,
        );
    }
    // TODO(fabio): remove this method once the smart contracts have been refactored
    // to return helpful revert reasons instead of ORDER_UNFILLABLE. Instruct devs
    // to make "calls" to validate order fillability + getOrderInfo for fillable amount.
    /**
     * Validate if the supplied order is fillable, and throw if it isn't
     * @param exchangeTradeEmulator ExchangeTradeEmulator instance
     * @param signedOrder SignedOrder of interest
     * @param zrxAssetData ZRX assetData
     * @param expectedFillTakerTokenAmount If supplied, this call will make sure this amount is fillable.
     * If it isn't supplied, we check if the order is fillable for a non-zero amount
     */
    public async validateOrderFillableOrThrowAsync(
        exchangeTradeEmulator: ExchangeTransferSimulator,
        signedOrder: SignedOrder,
        zrxAssetData: string,
        expectedFillTakerTokenAmount?: BigNumber,
    ): Promise<void> {
        const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
        const isValidSignature = await signatureUtils.isValidSignatureAsync(
            this._provider,
            orderHash,
            signedOrder.signature,
            signedOrder.makerAddress,
            signedOrder.exchangeAddress,
        );
        if (!isValidSignature) {
            throw new Error(RevertReason.InvalidOrderSignature);
        }

        const isCancelled = await this._orderFilledCancelledFetcher.isOrderCancelledAsync(signedOrder);
        if (isCancelled) {
            throw new Error('CANCELLED');
        }
        const filledTakerTokenAmount = await this._orderFilledCancelledFetcher.getFilledTakerAmountAsync(orderHash);
        if (signedOrder.takerAssetAmount.eq(filledTakerTokenAmount)) {
            throw new Error('FULLY_FILLED');
        }
        try {
            OrderValidationUtils._validateOrderNotExpiredOrThrow(signedOrder.expirationTimeSeconds);
        } catch (err) {
            throw new Error('EXPIRED');
        }
        let fillTakerAssetAmount = signedOrder.takerAssetAmount.minus(filledTakerTokenAmount);
        if (expectedFillTakerTokenAmount !== undefined) {
            fillTakerAssetAmount = expectedFillTakerTokenAmount;
        }
        await OrderValidationUtils.validateFillOrderBalancesAllowancesThrowIfInvalidAsync(
            exchangeTradeEmulator,
            signedOrder,
            fillTakerAssetAmount,
            signedOrder.takerAddress,
            zrxAssetData,
        );
    }
    /**
     * Validate a call to FillOrder and throw if it wouldn't succeed
     * @param exchangeTradeEmulator ExchangeTradeEmulator to use
     * @param supportedProvider Web3 provider to use for JSON RPC requests
     * @param signedOrder SignedOrder of interest
     * @param fillTakerAssetAmount Amount we'd like to fill the order for
     * @param takerAddress The taker of the order
     * @param zrxAssetData ZRX asset data
     */
    public async validateFillOrderThrowIfInvalidAsync(
        exchangeTradeEmulator: ExchangeTransferSimulator,
        supportedProvider: SupportedProvider,
        signedOrder: SignedOrder,
        fillTakerAssetAmount: BigNumber,
        takerAddress: string,
        zrxAssetData: string,
    ): Promise<BigNumber> {
        if (signedOrder.makerAssetAmount.eq(0) || signedOrder.takerAssetAmount.eq(0)) {
            throw new Error(RevertReason.OrderUnfillable);
        }
        if (fillTakerAssetAmount.eq(0)) {
            throw new Error(RevertReason.InvalidTakerAmount);
        }
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
        const isValid = await signatureUtils.isValidSignatureAsync(
            provider,
            orderHash,
            signedOrder.signature,
            signedOrder.makerAddress,
            signedOrder.exchangeAddress,
        );
        if (!isValid) {
            throw new Error(TypedDataError.InvalidSignature);
        }
        const filledTakerTokenAmount = await this._orderFilledCancelledFetcher.getFilledTakerAmountAsync(orderHash);
        if (signedOrder.takerAssetAmount.eq(filledTakerTokenAmount)) {
            throw new Error(RevertReason.OrderUnfillable);
        }
        if (signedOrder.takerAddress !== constants.NULL_ADDRESS && signedOrder.takerAddress !== takerAddress) {
            throw new Error(RevertReason.InvalidTaker);
        }
        OrderValidationUtils._validateOrderNotExpiredOrThrow(signedOrder.expirationTimeSeconds);
        const remainingTakerTokenAmount = signedOrder.takerAssetAmount.minus(filledTakerTokenAmount);
        const desiredFillTakerTokenAmount = remainingTakerTokenAmount.isLessThan(fillTakerAssetAmount)
            ? remainingTakerTokenAmount
            : fillTakerAssetAmount;
        try {
            await OrderValidationUtils.validateFillOrderBalancesAllowancesThrowIfInvalidAsync(
                exchangeTradeEmulator,
                signedOrder,
                desiredFillTakerTokenAmount,
                takerAddress,
                zrxAssetData,
            );
        } catch (err) {
            const transferFailedErrorMessages = [
                ExchangeContractErrs.InsufficientMakerBalance,
                ExchangeContractErrs.InsufficientMakerFeeBalance,
                ExchangeContractErrs.InsufficientTakerBalance,
                ExchangeContractErrs.InsufficientTakerFeeBalance,
                ExchangeContractErrs.InsufficientMakerAllowance,
                ExchangeContractErrs.InsufficientMakerFeeAllowance,
                ExchangeContractErrs.InsufficientTakerAllowance,
                ExchangeContractErrs.InsufficientTakerFeeAllowance,
            ];
            if (_.includes(transferFailedErrorMessages, err.message)) {
                throw new Error(RevertReason.TransferFailed);
            }
            throw err;
        }

        const wouldRoundingErrorOccur = OrderValidationUtils.isRoundingErrorFloor(
            desiredFillTakerTokenAmount,
            signedOrder.takerAssetAmount,
            signedOrder.makerAssetAmount,
        );
        if (wouldRoundingErrorOccur) {
            throw new Error(RevertReason.RoundingError);
        }
        return filledTakerTokenAmount;
    }
}
