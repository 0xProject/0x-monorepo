import { ERC20Wrapper, ERC721Wrapper } from '@0x/contracts-asset-proxy';
import { chaiSetup, constants, ERC20BalancesByOwner, expectTransactionFailedAsync, web3Wrapper } from '@0x/contracts-test-utils';
import { RevertReason, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { ForwarderWrapper } from './forwarder_wrapper';

chaiSetup.configure();
const expect = chai.expect;

interface ForwarderFillState {
    takerAssetFillAmount: BigNumber;
    makerAssetFillAmount: BigNumber;
    wethFees: BigNumber;
    percentageFees: BigNumber;
    maxOversoldWeth: BigNumber;
    maxOverboughtMakerAsset: BigNumber;
}

function computeExpectedResults(
    orders: SignedOrder[],
    fractionalNumberOfOrdersToFill: BigNumber,
): ForwarderFillState {
    const currentState = {
        takerAssetFillAmount: constants.ZERO_AMOUNT,
        makerAssetFillAmount: constants.ZERO_AMOUNT,
        wethFees: constants.ZERO_AMOUNT,
        percentageFees: constants.ZERO_AMOUNT,
        maxOversoldWeth: constants.ZERO_AMOUNT,
        maxOverboughtMakerAsset: constants.ZERO_AMOUNT,
    };
    let remainingOrdersToFill = fractionalNumberOfOrdersToFill;

    _.forEach(orders, (order: SignedOrder): void => {
        if (remainingOrdersToFill.isEqualTo(constants.ZERO_AMOUNT)) {
            return;
        }

        let makerAssetAmount;
        let takerAssetAmount;
        let takerFee;
        if (remainingOrdersToFill.isLessThan(new BigNumber(1))) {
            const [partialFillNumerator, partialFillDenominator] = remainingOrdersToFill.toFraction();
            makerAssetAmount = order.makerAssetAmount.times(partialFillNumerator).dividedToIntegerBy(partialFillDenominator);
            takerAssetAmount = order.takerAssetAmount.times(partialFillNumerator).dividedToIntegerBy(partialFillDenominator);
            takerFee = order.takerFee.times(partialFillNumerator).dividedToIntegerBy(partialFillDenominator);
        } else {
            makerAssetAmount = order.makerAssetAmount;
            takerAssetAmount = order.takerAssetAmount;
            takerFee = order.takerFee;
        }

        currentState.takerAssetFillAmount = currentState.takerAssetFillAmount.plus(takerAssetAmount);
        currentState.makerAssetFillAmount = currentState.makerAssetFillAmount.plus(makerAssetAmount);

        if (order.takerFeeAssetData === order.makerAssetData) {
            currentState.percentageFees = currentState.percentageFees.plus(takerFee);
        } else if (order.takerFeeAssetData === order.takerAssetData) {
            currentState.wethFees = currentState.wethFees.plus(takerFee);
            // Up to 1 wei worth of WETH will be oversold per order
            currentState.maxOversoldWeth = currentState.maxOversoldWeth.plus(new BigNumber(1));
            // Equivalently, up to 1 wei worth of maker asset will be overbought per order
            currentState.maxOverboughtMakerAsset = currentState.maxOversoldWeth
                .times(makerAssetAmount)
                .dividedToIntegerBy(takerAssetAmount);
        }

        remainingOrdersToFill = BigNumber.min(remainingOrdersToFill.minus(new BigNumber(1)), constants.ZERO_AMOUNT);
    });

    return currentState;
}

function expectBalanceWithin(balance: BigNumber, low: BigNumber, high: BigNumber): void {
    expect(balance).to.be.bignumber.gte(low);
    expect(balance).to.be.bignumber.lte(high);
}

export class ForwarderTestFactory {
    private readonly _forwarderWrapper: ForwarderWrapper;
    private readonly _erc20Wrapper: ERC20Wrapper;
    private readonly _forwarderAddress: string;
    private readonly _makerAddress: string;
    private readonly _takerAddress: string;
    private readonly _orderFeeRecipientAddress: string;
    private readonly _forwarderFeeRecipientAddress: string;
    private readonly _gasPrice: BigNumber;
    private readonly _wethAddress: string;

    public static getPercentageOfValue(value: BigNumber, percentage: BigNumber): BigNumber {
        const numerator = constants.PERCENTAGE_DENOMINATOR.times(percentage).dividedToIntegerBy(100);
        const newValue = value.times(numerator).dividedToIntegerBy(constants.PERCENTAGE_DENOMINATOR);
        return newValue;
    }

    constructor(
        forwarderWrapper: ForwarderWrapper,
        erc20Wrapper: ERC20Wrapper,
        forwarderAddress: string,
        makerAddress: string,
        takerAddress: string,
        orderFeeRecipientAddress: string,
        forwarderFeeRecipientAddress: string,
        gasPrice: BigNumber,
        wethAddress: string,
    ) {
        this._forwarderWrapper = forwarderWrapper;
        this._erc20Wrapper = erc20Wrapper;
        this._forwarderAddress = forwarderAddress;
        this._makerAddress = makerAddress;
        this._takerAddress = takerAddress;
        this._orderFeeRecipientAddress = orderFeeRecipientAddress;
        this._forwarderFeeRecipientAddress = forwarderFeeRecipientAddress;
        this._gasPrice = gasPrice;
        this._wethAddress = wethAddress;
    }

    public async marketBuyTestAsync(
        orders: SignedOrder[],
        fractionalNumberOfOrdersToFill: BigNumber,
        makerAssetAddress: string,
        takerEthBalanceBefore: BigNumber,
        erc20Balances: ERC20BalancesByOwner,
        ethValueAdjustment: BigNumber = constants.ZERO_AMOUNT,
        forwarderFeeOptions: {
            baseFeePercentage: BigNumber;
            forwarderFeeRecipientEthBalanceBefore: BigNumber;
        } = { baseFeePercentage: constants.ZERO_AMOUNT, forwarderFeeRecipientEthBalanceBefore: constants.ZERO_AMOUNT },
    ): Promise<void> {
        const expectedResults = computeExpectedResults(orders, fractionalNumberOfOrdersToFill);
        const ethSpentOnForwarderFee = ForwarderTestFactory.getPercentageOfValue(
            expectedResults.takerAssetFillAmount,
            forwarderFeeOptions.baseFeePercentage,
        );
        const ethValue = expectedResults.takerAssetFillAmount
            .plus(expectedResults.wethFees)
            .plus(ethSpentOnForwarderFee)
            .plus(ethValueAdjustment);
        const feePercentage = ForwarderTestFactory.getPercentageOfValue(constants.PERCENTAGE_DENOMINATOR, forwarderFeeOptions.baseFeePercentage);

        if (ethValueAdjustment.isNegative()) {
            return expectTransactionFailedAsync(
                this._forwarderWrapper.marketBuyOrdersWithEthAsync(
                    orders,
                    expectedResults.makerAssetFillAmount, {
                    value: ethValue,
                    from: this._takerAddress,
                }),
                RevertReason.CompleteFillFailed,
            );
        }

        const tx = await this._forwarderWrapper.marketBuyOrdersWithEthAsync(
            orders,
            expectedResults.makerAssetFillAmount,
            {
                value: ethValue,
                from: this._takerAddress,
            },
            { feePercentage, feeRecipient: this._forwarderFeeRecipientAddress },
        );

        await this._checkResultsAsync(
            tx,
            expectedResults,
            forwarderFeeOptions.forwarderFeeRecipientEthBalanceBefore,
            takerEthBalanceBefore,
            erc20Balances,
            ethSpentOnForwarderFee,
            makerAssetAddress,
        );
    }

    public async marketSellTestAsync(
        orders: SignedOrder[],
        fractionalNumberOfOrdersToFill: BigNumber,
        makerAssetAddress: string,
        takerEthBalanceBefore: BigNumber,
        erc20Balances: ERC20BalancesByOwner,
        forwarderFeeOptions: {
            baseFeePercentage: BigNumber;
            forwarderFeeRecipientEthBalanceBefore: BigNumber;
        } = { baseFeePercentage: constants.ZERO_AMOUNT, forwarderFeeRecipientEthBalanceBefore: constants.ZERO_AMOUNT },
    ): Promise<void> {
        const expectedResults = computeExpectedResults(orders, fractionalNumberOfOrdersToFill);
        const ethSpentOnForwarderFee = ForwarderTestFactory.getPercentageOfValue(
            expectedResults.takerAssetFillAmount,
            forwarderFeeOptions.baseFeePercentage,
        );
        const ethValue = expectedResults.takerAssetFillAmount
            .plus(expectedResults.wethFees)
            .plus(ethSpentOnForwarderFee);
        const feePercentage = ForwarderTestFactory.getPercentageOfValue(constants.PERCENTAGE_DENOMINATOR, forwarderFeeOptions.baseFeePercentage);

        const tx = await this._forwarderWrapper.marketSellOrdersWithEthAsync(
            orders,
            {
                value: ethValue,
                from: this._takerAddress,
            },
            { feePercentage, feeRecipient: this._forwarderFeeRecipientAddress },
        );

        await this._checkResultsAsync(
            tx,
            expectedResults,
            forwarderFeeOptions.forwarderFeeRecipientEthBalanceBefore,
            takerEthBalanceBefore,
            erc20Balances,
            ethSpentOnForwarderFee,
            makerAssetAddress,
        );
    }

    private async _checkResultsAsync(
        tx: TransactionReceiptWithDecodedLogs,
        expectedResults: ForwarderFillState,
        forwarderFeeRecipientEthBalanceBefore: BigNumber,
        takerEthBalanceBefore: BigNumber,
        erc20Balances: ERC20BalancesByOwner,
        ethSpentOnForwarderFee: BigNumber,
        makerAssetAddress: string,
    ): Promise<void> {
        const totalEthSpent = expectedResults.takerAssetFillAmount
            .plus(expectedResults.wethFees)
            .plus(ethSpentOnForwarderFee)
            .plus(this._gasPrice.times(tx.gasUsed));
        const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(this._takerAddress);
        const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(this._forwarderAddress);
        const fowarderFeeRecipientEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(this._forwarderFeeRecipientAddress);
        const newBalances = await this._erc20Wrapper.getBalancesAsync();

        expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
        if (ethSpentOnForwarderFee.gt(0)) {
            expect(fowarderFeeRecipientEthBalanceAfter).to.be.bignumber.equal(
                forwarderFeeRecipientEthBalanceBefore.plus(ethSpentOnForwarderFee),
            );
        }

        expectBalanceWithin(
            newBalances[this._makerAddress][makerAssetAddress],
            erc20Balances[this._makerAddress][makerAssetAddress]
                .minus(expectedResults.makerAssetFillAmount)
                .minus(expectedResults.maxOverboughtMakerAsset),
            erc20Balances[this._makerAddress][makerAssetAddress].minus(expectedResults.makerAssetFillAmount),
        );
        expectBalanceWithin(
            newBalances[this._takerAddress][makerAssetAddress],
            erc20Balances[this._takerAddress][makerAssetAddress]
                .plus(expectedResults.makerAssetFillAmount)
                .minus(expectedResults.percentageFees),
            erc20Balances[this._takerAddress][makerAssetAddress]
                .plus(expectedResults.makerAssetFillAmount)
                .minus(expectedResults.percentageFees)
                .plus(expectedResults.maxOverboughtMakerAsset),
        );
        expect(newBalances[this._orderFeeRecipientAddress][makerAssetAddress]).to.be.bignumber.equal(
            erc20Balances[this._orderFeeRecipientAddress][makerAssetAddress].plus(expectedResults.percentageFees),
        );

        expectBalanceWithin(
            newBalances[this._makerAddress][this._wethAddress],
            erc20Balances[this._makerAddress][this._wethAddress].plus(expectedResults.takerAssetFillAmount),
            erc20Balances[this._makerAddress][this._wethAddress]
                .plus(expectedResults.takerAssetFillAmount)
                .plus(expectedResults.maxOversoldWeth),
        );
        expect(newBalances[this._orderFeeRecipientAddress][this._wethAddress]).to.be.bignumber.equal(
            erc20Balances[this._orderFeeRecipientAddress][this._wethAddress].plus(expectedResults.wethFees),
        );

        expect(newBalances[this._forwarderAddress][this._wethAddress]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        expect(newBalances[this._forwarderAddress][makerAssetAddress]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
    }
}
