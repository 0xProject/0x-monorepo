import { BlockchainBalanceStore, LocalBalanceStore } from '@0x/contracts-exchange';
import { ForwarderContract } from '@0x/contracts-exchange-forwarder';
import { constants, expect, getPercentageOfValue, OrderStatus } from '@0x/contracts-test-utils';
import { OrderInfo, SignedOrder } from '@0x/types';
import { BigNumber, RevertError } from '@0x/utils';
import * as _ from 'lodash';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { Actor, FeeRecipient, Maker } from '../actors';
import { DeploymentManager } from '../utils/deployment_manager';

// Necessary bookkeeping to validate Forwarder results
interface ForwarderFillState {
    balances: LocalBalanceStore;
    wethSpentAmount: BigNumber;
    makerAssetAcquiredAmount: BigNumber;
}

interface MarketSellOptions {
    forwarderFeePercentage: BigNumber;
    revertError: RevertError;
}

interface MarketBuyOptions extends MarketSellOptions {
    ethValueAdjustment: number; // Used to provided insufficient/excess ETH
}

export class ForwarderTestFactory {
    constructor(
        private readonly _forwarder: ForwarderContract,
        private readonly _deployment: DeploymentManager,
        private readonly _balanceStore: BlockchainBalanceStore,
        private readonly _maker: Maker,
        private readonly _taker: Actor,
        private readonly _orderFeeRecipient: FeeRecipient,
        private readonly _forwarderFeeRecipient: FeeRecipient,
    ) {}

    public async marketBuyTestAsync(
        orders: SignedOrder[],
        fractionalNumberOfOrdersToFill: number,
        options: Partial<MarketBuyOptions> = {},
    ): Promise<void> {
        const ethValueAdjustment = options.ethValueAdjustment || 0;
        const forwarderFeePercentage = options.forwarderFeePercentage || 0;

        const orderInfoBefore = await Promise.all(
            orders.map(order => this._deployment.exchange.getOrderInfo.callAsync(order)),
        );
        const expectedOrderStatuses = orderInfoBefore.map((orderInfo, i) =>
            fractionalNumberOfOrdersToFill >= i + 1 && orderInfo.orderStatus === OrderStatus.Fillable
                ? OrderStatus.FullyFilled
                : orderInfo.orderStatus,
        );

        const {
            balances: expectedBalances,
            wethSpentAmount,
            makerAssetAcquiredAmount,
        } = await this._simulateForwarderFillAsync(orders, orderInfoBefore, fractionalNumberOfOrdersToFill, options);

        const ethSpentOnForwarderFee = getPercentageOfValue(wethSpentAmount, forwarderFeePercentage);
        const feePercentage = getPercentageOfValue(constants.PERCENTAGE_DENOMINATOR, forwarderFeePercentage);

        const tx = this._forwarder.marketBuyOrdersWithEth.awaitTransactionSuccessAsync(
            orders,
            makerAssetAcquiredAmount,
            orders.map(signedOrder => signedOrder.signature),
            feePercentage,
            this._forwarderFeeRecipient.address,
            {
                value: wethSpentAmount.plus(ethSpentOnForwarderFee).plus(ethValueAdjustment),
                from: this._taker.address,
            },
        );

        if (options.revertError !== undefined) {
            await expect(tx).to.revertWith(options.revertError);
        } else {
            const txReceipt = await tx;
            await this._checkResultsAsync(txReceipt, orders, expectedOrderStatuses, expectedBalances);
        }
    }

    public async marketSellTestAsync(
        orders: SignedOrder[],
        fractionalNumberOfOrdersToFill: number,
        options: Partial<MarketSellOptions> = {},
    ): Promise<void> {
        const orderInfoBefore = await Promise.all(
            orders.map(order => this._deployment.exchange.getOrderInfo.callAsync(order)),
        );
        const expectedOrderStatuses = orderInfoBefore.map((orderInfo, i) =>
            fractionalNumberOfOrdersToFill >= i + 1 && orderInfo.orderStatus === OrderStatus.Fillable
                ? OrderStatus.FullyFilled
                : orderInfo.orderStatus,
        );

        const { balances: expectedBalances, wethSpentAmount } = await this._simulateForwarderFillAsync(
            orders,
            orderInfoBefore,
            fractionalNumberOfOrdersToFill,
            options,
        );

        const forwarderFeePercentage = options.forwarderFeePercentage || 0;
        const ethSpentOnForwarderFee = getPercentageOfValue(wethSpentAmount, forwarderFeePercentage);
        const feePercentage = getPercentageOfValue(constants.PERCENTAGE_DENOMINATOR, forwarderFeePercentage);

        const tx = this._forwarder.marketSellOrdersWithEth.awaitTransactionSuccessAsync(
            orders,
            orders.map(signedOrder => signedOrder.signature),
            feePercentage,
            this._forwarderFeeRecipient.address,
            {
                value: wethSpentAmount.plus(ethSpentOnForwarderFee),
                from: this._taker.address,
            },
        );

        if (options.revertError !== undefined) {
            await expect(tx).to.revertWith(options.revertError);
        } else {
            const txReceipt = await tx;
            await this._checkResultsAsync(txReceipt, orders, expectedOrderStatuses, expectedBalances);
        }
    }

    private async _checkResultsAsync(
        txReceipt: TransactionReceiptWithDecodedLogs,
        orders: SignedOrder[],
        expectedOrderStatuses: OrderStatus[],
        expectedBalances: LocalBalanceStore,
    ): Promise<void> {
        // Transaction gas cost
        expectedBalances.burnGas(txReceipt.from, DeploymentManager.gasPrice.times(txReceipt.gasUsed));
        await this._balanceStore.updateBalancesAsync();
        // Check balances
        this._balanceStore.assertEquals(expectedBalances);

        // Get updated order info
        const orderInfoAfter = await Promise.all(
            orders.map(order => this._deployment.exchange.getOrderInfo.callAsync(order)),
        );
        // Check order statuses
        for (const [i, orderInfo] of orderInfoAfter.entries()) {
            expect(orderInfo.orderStatus, ` Order ${i} status`).to.equal(expectedOrderStatuses[i]);
        }
    }

    // Simulates filling some orders via the Forwarder contract. For example, if
    // orders = [A, B, C, D] and fractionalNumberOfOrdersToFill = 2.3, then
    // we simulate A and B being completely filled, and 0.3 * C being filled.
    private async _simulateForwarderFillAsync(
        orders: SignedOrder[],
        ordersInfoBefore: OrderInfo[],
        fractionalNumberOfOrdersToFill: number,
        options: Partial<MarketBuyOptions>,
    ): Promise<ForwarderFillState> {
        await this._balanceStore.updateBalancesAsync();
        const balances = LocalBalanceStore.create(this._balanceStore);
        const currentTotal = {
            wethSpentAmount: constants.ZERO_AMOUNT,
            makerAssetAcquiredAmount: constants.ZERO_AMOUNT,
        };

        let remainingOrdersToFill = fractionalNumberOfOrdersToFill;
        for (const [i, order] of orders.entries()) {
            if (remainingOrdersToFill === 0) {
                break;
            } else if (ordersInfoBefore[i].orderStatus !== OrderStatus.Fillable) {
                // If the order is not fillable, skip over it but still count it towards fractionalNumberOfOrdersToFill
                remainingOrdersToFill = Math.max(remainingOrdersToFill - 1, 0);
                continue;
            }

            const { wethSpentAmount, makerAssetAcquiredAmount } = this._simulateSingleFill(
                balances,
                order,
                ordersInfoBefore[i].orderTakerAssetFilledAmount,
                Math.min(remainingOrdersToFill, 1),
            );
            remainingOrdersToFill = Math.max(remainingOrdersToFill - 1, 0);

            currentTotal.wethSpentAmount = currentTotal.wethSpentAmount.plus(wethSpentAmount);
            currentTotal.makerAssetAcquiredAmount = currentTotal.makerAssetAcquiredAmount.plus(
                makerAssetAcquiredAmount,
            );
        }

        const ethSpentOnForwarderFee = getPercentageOfValue(
            currentTotal.wethSpentAmount,
            options.forwarderFeePercentage || 0,
        );
        // In reality the Forwarder is a middleman in this transaction and the ETH gets wrapped and unwrapped.
        balances.sendEth(this._taker.address, this._forwarderFeeRecipient.address, ethSpentOnForwarderFee);

        return { ...currentTotal, balances };
    }

    private _simulateSingleFill(
        balances: LocalBalanceStore,
        order: SignedOrder,
        takerAssetFilled: BigNumber,
        fillFraction: number,
    ): ForwarderFillState {
        let { makerAssetAmount, takerAssetAmount, makerFee, takerFee } = order;
        makerAssetAmount = makerAssetAmount.times(fillFraction).integerValue(BigNumber.ROUND_CEIL);
        takerAssetAmount = takerAssetAmount.times(fillFraction).integerValue(BigNumber.ROUND_CEIL);
        makerFee = makerFee.times(fillFraction).integerValue(BigNumber.ROUND_CEIL);
        takerFee = takerFee.times(fillFraction).integerValue(BigNumber.ROUND_CEIL);

        // Accounting for partially filled orders
        // As with unfillable orders, these still count as 1 towards fractionalNumberOfOrdersToFill
        takerAssetAmount = BigNumber.max(takerAssetAmount.minus(takerAssetFilled), 0);
        const makerAssetFilled = takerAssetFilled
            .times(order.makerAssetAmount)
            .dividedToIntegerBy(order.takerAssetAmount);
        makerAssetAmount = BigNumber.max(makerAssetAmount.minus(makerAssetFilled), 0);
        const makerFeeFilled = takerAssetFilled.times(order.makerFee).dividedToIntegerBy(order.takerAssetAmount);
        makerFee = BigNumber.max(makerFee.minus(makerFeeFilled), 0);
        const takerFeeFilled = takerAssetFilled.times(order.takerFee).dividedToIntegerBy(order.takerAssetAmount);
        takerFee = BigNumber.max(takerFee.minus(takerFeeFilled), 0);

        let wethSpentAmount = takerAssetAmount.plus(DeploymentManager.protocolFee);
        let makerAssetAcquiredAmount = makerAssetAmount;
        if (order.takerFeeAssetData === order.makerAssetData) {
            makerAssetAcquiredAmount = makerAssetAcquiredAmount.minus(takerFee);
        } else if (order.takerFeeAssetData === order.takerAssetData) {
            wethSpentAmount = wethSpentAmount.plus(takerFee);
        }

        // Taker sends ETH to Forwarder
        balances.sendEth(this._taker.address, this._forwarder.address, wethSpentAmount);
        // Forwarder wraps the ETH
        balances.wrapEth(this._forwarder.address, this._deployment.tokens.weth.address, wethSpentAmount);
        // (In reality this is done all at once, but we simulate it order by order)

        // Maker -> Forwarder
        balances.transferAsset(this._maker.address, this._forwarder.address, makerAssetAmount, order.makerAssetData);
        // Maker -> Order fee recipient
        balances.transferAsset(this._maker.address, this._orderFeeRecipient.address, makerFee, order.makerFeeAssetData);
        // Forwarder -> Maker
        balances.transferAsset(this._forwarder.address, this._maker.address, takerAssetAmount, order.takerAssetData);
        // Forwarder -> Order fee recipient
        balances.transferAsset(
            this._forwarder.address,
            this._orderFeeRecipient.address,
            takerFee,
            order.takerFeeAssetData,
        );
        // Forwarder pays the protocol fee in WETH
        balances.transferAsset(
            this._forwarder.address,
            this._deployment.staking.stakingProxy.address,
            DeploymentManager.protocolFee,
            order.takerAssetData,
        );
        // Forwarder gives acquired maker asset to taker
        balances.transferAsset(
            this._forwarder.address,
            this._taker.address,
            makerAssetAcquiredAmount,
            order.makerAssetData,
        );

        return { wethSpentAmount, makerAssetAcquiredAmount, balances };
    }
}
