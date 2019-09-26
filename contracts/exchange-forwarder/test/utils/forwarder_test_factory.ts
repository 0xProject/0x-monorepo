import { ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { DummyERC721TokenContract } from '@0x/contracts-erc721';
import { ExchangeWrapper } from '@0x/contracts-exchange';
import { constants, ERC20BalancesByOwner, expect, OrderStatus, web3Wrapper } from '@0x/contracts-test-utils';
import { OrderInfo, SignedOrder } from '@0x/types';
import { BigNumber, RevertError } from '@0x/utils';
import * as _ from 'lodash';

import { ForwarderWrapper } from './forwarder_wrapper';

// Necessary bookkeeping to validate Forwarder results
interface ForwarderFillState {
    takerAssetFillAmount: BigNumber;
    makerAssetFillAmount: BigNumber;
    protocolFees: BigNumber;
    wethFees: BigNumber;
    percentageFees: BigNumber;
    maxOversoldWeth: BigNumber;
    maxOverboughtMakerAsset: BigNumber;
}

// Since bignumber is not compatible with chai's within
function expectBalanceWithin(balance: BigNumber, low: BigNumber, high: BigNumber, message?: string): void {
    expect(balance, message).to.be.bignumber.gte(low);
    expect(balance, message).to.be.bignumber.lte(high);
}

export class ForwarderTestFactory {
    public static getPercentageOfValue(value: BigNumber, percentage: BigNumber): BigNumber {
        const numerator = constants.PERCENTAGE_DENOMINATOR.times(percentage).dividedToIntegerBy(100);
        const newValue = value.times(numerator).dividedToIntegerBy(constants.PERCENTAGE_DENOMINATOR);
        return newValue;
    }

    constructor(
        private readonly _exchangeWrapper: ExchangeWrapper,
        private readonly _forwarderWrapper: ForwarderWrapper,
        private readonly _erc20Wrapper: ERC20Wrapper,
        private readonly _forwarderAddress: string,
        private readonly _makerAddress: string,
        private readonly _takerAddress: string,
        private readonly _protocolFeeCollectorAddress: string,
        private readonly _orderFeeRecipientAddress: string,
        private readonly _forwarderFeeRecipientAddress: string,
        private readonly _wethAddress: string,
        private readonly _gasPrice: BigNumber,
        private readonly _protocolFeeMultiplier: BigNumber,
    ) {}

    public async marketBuyTestAsync(
        orders: SignedOrder[],
        fractionalNumberOfOrdersToFill: number,
        makerAssetContract: DummyERC20TokenContract | DummyERC721TokenContract,
        options: {
            ethValueAdjustment?: number; // Used to provided insufficient/excess ETH
            forwarderFeePercentage?: BigNumber;
            makerAssetId?: BigNumber;
            revertError?: RevertError;
        } = {},
    ): Promise<void> {
        const ethValueAdjustment = options.ethValueAdjustment || 0;
        const forwarderFeePercentage = options.forwarderFeePercentage || constants.ZERO_AMOUNT;

        const erc20Balances = await this._erc20Wrapper.getBalancesAsync();
        const takerEthBalanceBefore = await web3Wrapper.getBalanceInWeiAsync(this._takerAddress);
        const forwarderFeeRecipientEthBalanceBefore = await web3Wrapper.getBalanceInWeiAsync(
            this._forwarderFeeRecipientAddress,
        );

        const ordersInfoBefore = await Promise.all(orders.map(order => this._exchangeWrapper.getOrderInfoAsync(order)));
        const orderStatusesBefore = ordersInfoBefore.map(orderInfo => orderInfo.orderStatus);

        const expectedResults = this._computeExpectedResults(orders, ordersInfoBefore, fractionalNumberOfOrdersToFill);
        const wethSpent = expectedResults.takerAssetFillAmount
            .plus(expectedResults.protocolFees)
            .plus(expectedResults.wethFees)
            .plus(expectedResults.maxOversoldWeth);
        const ethSpentOnForwarderFee = ForwarderTestFactory.getPercentageOfValue(wethSpent, forwarderFeePercentage);
        const ethValue = wethSpent.plus(ethSpentOnForwarderFee).plus(ethValueAdjustment);

        const feePercentage = ForwarderTestFactory.getPercentageOfValue(
            constants.PERCENTAGE_DENOMINATOR,
            forwarderFeePercentage,
        );
        const tx = this._forwarderWrapper.marketBuyOrdersWithEthAsync(
            orders,
            expectedResults.makerAssetFillAmount.minus(expectedResults.percentageFees),
            {
                value: ethValue,
                from: this._takerAddress,
            },
            { feePercentage, feeRecipient: this._forwarderFeeRecipientAddress },
        );

        if (options.revertError !== undefined) {
            await expect(tx).to.revertWith(options.revertError);
        } else {
            const gasUsed = (await tx).gasUsed;
            const ordersInfoAfter = await Promise.all(
                orders.map(order => this._exchangeWrapper.getOrderInfoAsync(order)),
            );
            const orderStatusesAfter = ordersInfoAfter.map(orderInfo => orderInfo.orderStatus);

            await this._checkResultsAsync(
                fractionalNumberOfOrdersToFill,
                orderStatusesBefore,
                orderStatusesAfter,
                gasUsed,
                expectedResults,
                takerEthBalanceBefore,
                erc20Balances,
                makerAssetContract,
                {
                    forwarderFeePercentage,
                    forwarderFeeRecipientEthBalanceBefore,
                    makerAssetId: options.makerAssetId,
                },
            );
        }
    }

    public async marketSellTestAsync(
        orders: SignedOrder[],
        fractionalNumberOfOrdersToFill: number,
        makerAssetContract: DummyERC20TokenContract,
        options: {
            forwarderFeePercentage?: BigNumber;
            revertError?: RevertError;
        } = {},
    ): Promise<void> {
        const forwarderFeePercentage = options.forwarderFeePercentage || constants.ZERO_AMOUNT;

        const erc20Balances = await this._erc20Wrapper.getBalancesAsync();
        const takerEthBalanceBefore = await web3Wrapper.getBalanceInWeiAsync(this._takerAddress);
        const forwarderFeeRecipientEthBalanceBefore = await web3Wrapper.getBalanceInWeiAsync(
            this._forwarderFeeRecipientAddress,
        );

        const ordersInfoBefore = await Promise.all(orders.map(order => this._exchangeWrapper.getOrderInfoAsync(order)));
        const orderStatusesBefore = ordersInfoBefore.map(orderInfo => orderInfo.orderStatus);

        const expectedResults = this._computeExpectedResults(orders, ordersInfoBefore, fractionalNumberOfOrdersToFill);
        const wethSpent = expectedResults.takerAssetFillAmount
            .plus(expectedResults.protocolFees)
            .plus(expectedResults.wethFees)
            .plus(expectedResults.maxOversoldWeth);

        const ethSpentOnForwarderFee = ForwarderTestFactory.getPercentageOfValue(wethSpent, forwarderFeePercentage);
        const ethValue = wethSpent.plus(ethSpentOnForwarderFee);

        const feePercentage = ForwarderTestFactory.getPercentageOfValue(
            constants.PERCENTAGE_DENOMINATOR,
            forwarderFeePercentage,
        );

        const tx = this._forwarderWrapper.marketSellOrdersWithEthAsync(
            orders,
            {
                value: ethValue,
                from: this._takerAddress,
            },
            { feePercentage, feeRecipient: this._forwarderFeeRecipientAddress },
        );

        if (options.revertError !== undefined) {
            await expect(tx).to.revertWith(options.revertError);
        } else {
            const gasUsed = (await tx).gasUsed;
            const orderStatusesAfter = await Promise.all(
                orders.map(async order => (await this._exchangeWrapper.getOrderInfoAsync(order)).orderStatus),
            );

            await this._checkResultsAsync(
                fractionalNumberOfOrdersToFill,
                orderStatusesBefore,
                orderStatusesAfter,
                gasUsed,
                expectedResults,
                takerEthBalanceBefore,
                erc20Balances,
                makerAssetContract,
                {
                    forwarderFeePercentage,
                    forwarderFeeRecipientEthBalanceBefore,
                },
            );
        }
    }

    private _checkErc20Balances(
        oldBalances: ERC20BalancesByOwner,
        newBalances: ERC20BalancesByOwner,
        expectedResults: ForwarderFillState,
        makerAssetContract: DummyERC20TokenContract,
    ): void {
        const makerAssetAddress = makerAssetContract.address;
        expectBalanceWithin(
            newBalances[this._makerAddress][makerAssetAddress],
            oldBalances[this._makerAddress][makerAssetAddress]
                .minus(expectedResults.makerAssetFillAmount)
                .minus(expectedResults.maxOverboughtMakerAsset),
            oldBalances[this._makerAddress][makerAssetAddress].minus(expectedResults.makerAssetFillAmount),
            'Maker makerAsset balance',
        );
        expectBalanceWithin(
            newBalances[this._takerAddress][makerAssetAddress],
            oldBalances[this._takerAddress][makerAssetAddress]
                .plus(expectedResults.makerAssetFillAmount)
                .minus(expectedResults.percentageFees),
            oldBalances[this._takerAddress][makerAssetAddress]
                .plus(expectedResults.makerAssetFillAmount)
                .minus(expectedResults.percentageFees)
                .plus(expectedResults.maxOverboughtMakerAsset),
            'Taker makerAsset balance',
        );
        expect(
            newBalances[this._orderFeeRecipientAddress][makerAssetAddress],
            'Order fee recipient makerAsset balance',
        ).to.be.bignumber.equal(
            oldBalances[this._orderFeeRecipientAddress][makerAssetAddress].plus(expectedResults.percentageFees),
        );
        expect(
            newBalances[this._forwarderAddress][makerAssetAddress],
            'Forwarder contract makerAsset balance',
        ).to.be.bignumber.equal(constants.ZERO_AMOUNT);
    }

    private async _checkResultsAsync(
        fractionalNumberOfOrdersToFill: number,
        orderStatusesBefore: OrderStatus[],
        orderStatusesAfter: OrderStatus[],
        gasUsed: number,
        expectedResults: ForwarderFillState,
        takerEthBalanceBefore: BigNumber,
        erc20Balances: ERC20BalancesByOwner,
        makerAssetContract: DummyERC20TokenContract | DummyERC721TokenContract,
        options: {
            forwarderFeePercentage?: BigNumber;
            forwarderFeeRecipientEthBalanceBefore?: BigNumber;
            makerAssetId?: BigNumber;
        } = {},
    ): Promise<void> {
        for (const [i, orderStatus] of orderStatusesAfter.entries()) {
            let expectedOrderStatus = orderStatusesBefore[i];
            if (fractionalNumberOfOrdersToFill >= i + 1 && orderStatusesBefore[i] === OrderStatus.Fillable) {
                expectedOrderStatus = OrderStatus.FullyFilled;
            }
            expect(orderStatus, ` Order ${i} status`).to.equal(expectedOrderStatus);
        }

        const wethSpent = expectedResults.takerAssetFillAmount
            .plus(expectedResults.protocolFees)
            .plus(expectedResults.wethFees);
        const ethSpentOnForwarderFee = ForwarderTestFactory.getPercentageOfValue(
            wethSpent,
            options.forwarderFeePercentage || constants.ZERO_AMOUNT,
        );
        const totalEthSpent = wethSpent.plus(ethSpentOnForwarderFee).plus(this._gasPrice.times(gasUsed));

        const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(this._takerAddress);
        const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(this._forwarderAddress);
        const newBalances = await this._erc20Wrapper.getBalancesAsync();

        expectBalanceWithin(
            takerEthBalanceAfter,
            takerEthBalanceBefore.minus(totalEthSpent).minus(expectedResults.maxOversoldWeth),
            takerEthBalanceBefore.minus(totalEthSpent),
            'Taker ETH balance',
        );
        if (options.forwarderFeeRecipientEthBalanceBefore !== undefined) {
            const fowarderFeeRecipientEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(
                this._forwarderFeeRecipientAddress,
            );
            expect(fowarderFeeRecipientEthBalanceAfter, 'Forwarder fee recipient ETH balance').to.be.bignumber.equal(
                options.forwarderFeeRecipientEthBalanceBefore.plus(ethSpentOnForwarderFee),
            );
        }

        if (makerAssetContract instanceof DummyERC20TokenContract) {
            this._checkErc20Balances(erc20Balances, newBalances, expectedResults, makerAssetContract);
        } else if (options.makerAssetId !== undefined) {
            const newOwner = await makerAssetContract.ownerOf.callAsync(options.makerAssetId);
            expect(newOwner, 'New ERC721 owner').to.be.bignumber.equal(this._takerAddress);
        }

        expectBalanceWithin(
            newBalances[this._makerAddress][this._wethAddress],
            erc20Balances[this._makerAddress][this._wethAddress].plus(expectedResults.takerAssetFillAmount),
            erc20Balances[this._makerAddress][this._wethAddress]
                .plus(expectedResults.takerAssetFillAmount)
                .plus(expectedResults.maxOversoldWeth),
            'Maker WETH balance',
        );
        expect(
            newBalances[this._orderFeeRecipientAddress][this._wethAddress],
            'Order fee recipient WETH balance',
        ).to.be.bignumber.equal(
            erc20Balances[this._orderFeeRecipientAddress][this._wethAddress].plus(expectedResults.wethFees),
        );
        expect(
            newBalances[this._forwarderAddress][this._wethAddress],
            'Forwarder contract WETH balance',
        ).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
    }

    // Simulates filling some orders via the Forwarder contract. For example, if
    // orders = [A, B, C, D] and fractionalNumberOfOrdersToFill = 2.3, then
    // we simulate A and B being completely filled, and 0.3 * C being filled.
    private _computeExpectedResults(
        orders: SignedOrder[],
        ordersInfoBefore: OrderInfo[],
        fractionalNumberOfOrdersToFill: number,
    ): ForwarderFillState {
        const currentState = {
            takerAssetFillAmount: constants.ZERO_AMOUNT,
            makerAssetFillAmount: constants.ZERO_AMOUNT,
            protocolFees: constants.ZERO_AMOUNT,
            wethFees: constants.ZERO_AMOUNT,
            percentageFees: constants.ZERO_AMOUNT,
            maxOversoldWeth: constants.ZERO_AMOUNT,
            maxOverboughtMakerAsset: constants.ZERO_AMOUNT,
        };
        let remainingOrdersToFill = fractionalNumberOfOrdersToFill;

        for (const [i, order] of orders.entries()) {
            if (remainingOrdersToFill === 0) {
                break;
            }

            if (ordersInfoBefore[i].orderStatus !== OrderStatus.Fillable) {
                // If the order is not fillable, skip over it but still count it towards fractionalNumberOfOrdersToFill
                remainingOrdersToFill = Math.max(remainingOrdersToFill - 1, 0);
                continue;
            }

            let makerAssetAmount;
            let takerAssetAmount;
            let takerFee;
            if (remainingOrdersToFill < 1) {
                makerAssetAmount = order.makerAssetAmount.times(remainingOrdersToFill).integerValue();
                takerAssetAmount = order.takerAssetAmount.times(remainingOrdersToFill).integerValue();
                takerFee = order.takerFee.times(remainingOrdersToFill).integerValue();

                // Up to 1 wei worth of WETH will be oversold on the last order due to rounding
                currentState.maxOversoldWeth = new BigNumber(1);
                // Equivalently, up to 1 wei worth of maker asset will be overbought
                currentState.maxOverboughtMakerAsset = currentState.maxOversoldWeth
                    .times(order.makerAssetAmount)
                    .dividedToIntegerBy(order.takerAssetAmount);
            } else {
                makerAssetAmount = order.makerAssetAmount;
                takerAssetAmount = order.takerAssetAmount;
                takerFee = order.takerFee;
            }

            // Accounting for partially filled orders
            // As with unfillable orders, these still count as 1 towards fractionalNumberOfOrdersToFill
            const takerAssetFilled = ordersInfoBefore[i].orderTakerAssetFilledAmount;
            const makerAssetFilled = takerAssetFilled
                .times(order.makerAssetAmount)
                .dividedToIntegerBy(order.takerAssetAmount);
            takerAssetAmount = BigNumber.max(takerAssetAmount.minus(takerAssetFilled), constants.ZERO_AMOUNT);
            makerAssetAmount = BigNumber.max(makerAssetAmount.minus(makerAssetFilled), constants.ZERO_AMOUNT);

            currentState.takerAssetFillAmount = currentState.takerAssetFillAmount.plus(takerAssetAmount);
            currentState.makerAssetFillAmount = currentState.makerAssetFillAmount.plus(makerAssetAmount);

            if (this._protocolFeeCollectorAddress !== constants.NULL_ADDRESS) {
                currentState.protocolFees = currentState.protocolFees.plus(
                    this._gasPrice.times(this._protocolFeeMultiplier),
                );
            }
            if (order.takerFeeAssetData === order.makerAssetData) {
                currentState.percentageFees = currentState.percentageFees.plus(takerFee);
            } else if (order.takerFeeAssetData === order.takerAssetData) {
                currentState.wethFees = currentState.wethFees.plus(takerFee);
            }

            remainingOrdersToFill = Math.max(remainingOrdersToFill - 1, 0);
        }

        return currentState;
    }
}
