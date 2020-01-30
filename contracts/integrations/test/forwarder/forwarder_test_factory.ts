import { decodeERC20AssetData, decodeERC20BridgeAssetData} from '@0x/contracts-asset-proxy';
import { ForwarderContract } from '@0x/contracts-exchange-forwarder';
import { constants, expect, OrderStatus } from '@0x/contracts-test-utils';
import { AssetProxyId, OrderInfo, SignedOrder } from '@0x/types';
import { BigNumber, hexUtils, RevertError } from '@0x/utils';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { Taker } from '../framework/actors/taker';
import { BlockchainBalanceStore } from '../framework/balances/blockchain_balance_store';
import { LocalBalanceStore } from '../framework/balances/local_balance_store';
import { DeploymentManager } from '../framework/deployment_manager';

// Necessary bookkeeping to validate Forwarder results
interface ForwarderFillState {
    balances: LocalBalanceStore;
    wethSpentAmount: BigNumber;
    makerAssetAcquiredAmount: BigNumber;
}

interface MarketSellOptions {
    forwarderFeeAmounts: BigNumber[];
    forwarderFeeRecipientAddresses: string[];
    revertError: RevertError;
    bridgeExcessBuyAmount: BigNumber;
    noopOrders: number[]; // Indices of orders expected to noop on _fillOrderNoThrow (e.g. cancelled orders)
}

interface MarketBuyOptions extends MarketSellOptions {
    ethValueAdjustment: number; // Used to provided insufficient/excess ETH
}

function areUnderlyingAssetsEqual(assetData1: string, assetData2: string): boolean {
    const assetProxyId1 = hexUtils.slice(assetData1, 0, 4);
    const assetProxyId2 = hexUtils.slice(assetData2, 0, 4);
    if (
        (assetProxyId1 === AssetProxyId.ERC20 || assetProxyId1 === AssetProxyId.ERC20Bridge) &&
        (assetProxyId2 === AssetProxyId.ERC20 || assetProxyId2 === AssetProxyId.ERC20Bridge)
    ) {
        const tokenAddress1 =
            assetProxyId1 === AssetProxyId.ERC20
                ? decodeERC20AssetData(assetData1)
                : decodeERC20BridgeAssetData(assetData1)[0];
        const tokenAddress2 =
            assetProxyId2 === AssetProxyId.ERC20
                ? decodeERC20AssetData(assetData2)
                : decodeERC20BridgeAssetData(assetData2)[0];
        return tokenAddress2 === tokenAddress1;
    } else {
        return false;
    }
}

export class ForwarderTestFactory {
    constructor(
        private readonly _forwarder: ForwarderContract,
        private readonly _deployment: DeploymentManager,
        private readonly _balanceStore: BlockchainBalanceStore,
        private readonly _taker: Taker,
    ) {}

    public async marketBuyTestAsync(
        orders: SignedOrder[],
        fractionalNumberOfOrdersToFill: number,
        options: Partial<MarketBuyOptions> = {},
    ): Promise<void> {
        const ethValueAdjustment = options.ethValueAdjustment || 0;
        const forwarderFeeAmounts = options.forwarderFeeAmounts || [];
        const forwarderFeeRecipientAddresses = options.forwarderFeeRecipientAddresses || [];

        const orderInfoBefore = await Promise.all(
            orders.map(order => this._deployment.exchange.getOrderInfo(order).callAsync()),
        );
        const expectedOrderStatuses = orderInfoBefore.map((orderInfo, i) =>
            fractionalNumberOfOrdersToFill >= i + 1 && !(options.noopOrders || []).includes(i)
                ? OrderStatus.FullyFilled
                : orderInfo.orderStatus,
        );

        const {
            balances: expectedBalances,
            wethSpentAmount,
            makerAssetAcquiredAmount,
        } = await this._simulateForwarderFillAsync(orders, orderInfoBefore, fractionalNumberOfOrdersToFill, options);

        const tx = this._forwarder
            .marketBuyOrdersWithEth(
                orders,
                makerAssetAcquiredAmount.minus(options.bridgeExcessBuyAmount || 0),
                orders.map(signedOrder => signedOrder.signature),
                forwarderFeeAmounts,
                forwarderFeeRecipientAddresses,
            )
            .awaitTransactionSuccessAsync({
                value: wethSpentAmount.plus(BigNumber.sum(0, ...forwarderFeeAmounts)).plus(ethValueAdjustment),
                from: this._taker.address,
            });

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
            orders.map(order => this._deployment.exchange.getOrderInfo(order).callAsync()),
        );
        const expectedOrderStatuses = orderInfoBefore.map((orderInfo, i) =>
            fractionalNumberOfOrdersToFill >= i + 1 && !(options.noopOrders || []).includes(i)
                ? OrderStatus.FullyFilled
                : orderInfo.orderStatus,
        );

        const { balances: expectedBalances, wethSpentAmount } = await this._simulateForwarderFillAsync(
            orders,
            orderInfoBefore,
            fractionalNumberOfOrdersToFill,
            options,
        );

        const forwarderFeeAmounts = options.forwarderFeeAmounts || [];
        const forwarderFeeRecipientAddresses = options.forwarderFeeRecipientAddresses || [];

        const tx = this._forwarder
            .marketSellOrdersWithEth(
                orders,
                orders.map(signedOrder => signedOrder.signature),
                forwarderFeeAmounts,
                forwarderFeeRecipientAddresses,
            )
            .awaitTransactionSuccessAsync({
                value: wethSpentAmount.plus(BigNumber.sum(0, ...forwarderFeeAmounts)),
                from: this._taker.address,
            });

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
            orders.map(order => this._deployment.exchange.getOrderInfo(order).callAsync()),
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

        const forwarderFeeAmounts = options.forwarderFeeAmounts || [];
        const forwarderFeeRecipientAddresses = options.forwarderFeeRecipientAddresses || [];

        forwarderFeeAmounts.forEach((feeAmount, i) =>
            // In reality the Forwarder is a middleman in this transaction and the ETH gets wrapped and unwrapped.
            balances.sendEth(this._taker.address, forwarderFeeRecipientAddresses[i], feeAmount),
        );

        const currentTotal = {
            wethSpentAmount: constants.ZERO_AMOUNT,
            makerAssetAcquiredAmount: constants.ZERO_AMOUNT,
        };

        let remainingOrdersToFill = fractionalNumberOfOrdersToFill;
        for (const [i, order] of orders.entries()) {
            if (remainingOrdersToFill === 0) {
                break;
            } else if ((options.noopOrders || []).includes(i)) {
                // If the order won't be filled, skip over it but still count it towards fractionalNumberOfOrdersToFill
                remainingOrdersToFill = Math.max(remainingOrdersToFill - 1, 0);
                continue;
            }

            const { wethSpentAmount, makerAssetAcquiredAmount } = this._simulateSingleFill(
                balances,
                order,
                ordersInfoBefore[i].orderTakerAssetFilledAmount,
                Math.min(remainingOrdersToFill, 1),
                options.bridgeExcessBuyAmount || constants.ZERO_AMOUNT,
            );
            remainingOrdersToFill = Math.max(remainingOrdersToFill - 1, 0);

            currentTotal.wethSpentAmount = currentTotal.wethSpentAmount.plus(wethSpentAmount);
            currentTotal.makerAssetAcquiredAmount = currentTotal.makerAssetAcquiredAmount.plus(
                makerAssetAcquiredAmount,
            );
        }

        return { ...currentTotal, balances };
    }

    private _simulateSingleFill(
        balances: LocalBalanceStore,
        order: SignedOrder,
        takerAssetFilled: BigNumber,
        fillFraction: number,
        bridgeExcessBuyAmount: BigNumber,
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

        makerAssetAmount = makerAssetAmount.plus(bridgeExcessBuyAmount);
        let wethSpentAmount = takerAssetAmount.plus(DeploymentManager.protocolFee);
        let makerAssetAcquiredAmount = makerAssetAmount;
        if (areUnderlyingAssetsEqual(order.takerFeeAssetData, order.makerAssetData)) {
            makerAssetAcquiredAmount = makerAssetAcquiredAmount.minus(takerFee);
        } else if (order.takerFeeAssetData === order.takerAssetData) {
            wethSpentAmount = wethSpentAmount.plus(takerFee);
        }

        // Taker sends ETH to Forwarder
        balances.sendEth(this._taker.address, this._forwarder.address, wethSpentAmount);
        // Forwarder wraps the ETH
        balances.wrapEth(this._forwarder.address, this._deployment.tokens.weth.address, wethSpentAmount);
        // (In reality this is done all at once, but we simulate it order by order)

        // Forwarder -> Maker
        balances.transferAsset(this._forwarder.address, order.makerAddress, takerAssetAmount, order.takerAssetData);
        // Maker -> Forwarder
        balances.transferAsset(order.makerAddress, this._forwarder.address, makerAssetAmount, order.makerAssetData);
        // Forwarder -> Order fee recipient
        balances.transferAsset(this._forwarder.address, order.feeRecipientAddress, takerFee, order.takerFeeAssetData);
        // Maker -> Order fee recipient
        balances.transferAsset(order.makerAddress, order.feeRecipientAddress, makerFee, order.makerFeeAssetData);
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
