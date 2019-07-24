import { ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { DummyERC721TokenContract } from '@0x/contracts-erc721';
import {
    chaiSetup,
    constants,
    ERC20BalancesByOwner,
    expectTransactionFailedAsync,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { RevertReason, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { ForwarderWrapper } from './forwarder_wrapper';

chaiSetup.configure();
const expect = chai.expect;

// Necessary bookkeeping to validate Forwarder results
interface ForwarderFillState {
    takerAssetFillAmount: BigNumber;
    makerAssetFillAmount: BigNumber;
    wethFees: BigNumber;
    percentageFees: BigNumber;
    maxOversoldWeth: BigNumber;
    maxOverboughtMakerAsset: BigNumber;
}

// Simulates filling some orders via the Forwarder contract. For example, if
// orders = [A, B, C, D] and fractionalNumberOfOrdersToFill = 2.3, then
// we simulate A and B being completely filled, and 0.3 * C being filled.
function computeExpectedResults(orders: SignedOrder[], fractionalNumberOfOrdersToFill: BigNumber): ForwarderFillState {
    const currentState = {
        takerAssetFillAmount: constants.ZERO_AMOUNT,
        makerAssetFillAmount: constants.ZERO_AMOUNT,
        wethFees: constants.ZERO_AMOUNT,
        percentageFees: constants.ZERO_AMOUNT,
        maxOversoldWeth: constants.ZERO_AMOUNT,
        maxOverboughtMakerAsset: constants.ZERO_AMOUNT,
    };
    let remainingOrdersToFill = fractionalNumberOfOrdersToFill;

    _.forEach(
        orders,
        (order: SignedOrder): void => {
            if (remainingOrdersToFill.isEqualTo(constants.ZERO_AMOUNT)) {
                return;
            }

            let makerAssetAmount;
            let takerAssetAmount;
            let takerFee;
            if (remainingOrdersToFill.isLessThan(new BigNumber(1))) {
                const [partialFillNumerator, partialFillDenominator] = remainingOrdersToFill.toFraction();
                makerAssetAmount = order.makerAssetAmount
                    .times(partialFillNumerator)
                    .dividedToIntegerBy(partialFillDenominator);
                takerAssetAmount = order.takerAssetAmount
                    .times(partialFillNumerator)
                    .dividedToIntegerBy(partialFillDenominator);
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
                // Up to 1 wei worth of WETH will be oversold per order due to rounding
                currentState.maxOversoldWeth = currentState.maxOversoldWeth.plus(new BigNumber(1));
                // Equivalently, up to 1 wei worth of maker asset will be overbought per order
                currentState.maxOverboughtMakerAsset = currentState.maxOversoldWeth
                    .times(makerAssetAmount)
                    .dividedToIntegerBy(takerAssetAmount);
            }

            remainingOrdersToFill = BigNumber.max(remainingOrdersToFill.minus(new BigNumber(1)), constants.ZERO_AMOUNT);
        },
    );

    return currentState;
}

// Since bignumber is not compatible with chai's within
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
    private readonly _wethAddress: string;
    private readonly _gasPrice: BigNumber;

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
        wethAddress: string,
        gasPrice: BigNumber,
    ) {
        this._forwarderWrapper = forwarderWrapper;
        this._erc20Wrapper = erc20Wrapper;
        this._forwarderAddress = forwarderAddress;
        this._makerAddress = makerAddress;
        this._takerAddress = takerAddress;
        this._orderFeeRecipientAddress = orderFeeRecipientAddress;
        this._forwarderFeeRecipientAddress = forwarderFeeRecipientAddress;
        this._wethAddress = wethAddress;
        this._gasPrice = gasPrice;
    }

    public async marketBuyTestAsync(
        orders: SignedOrder[],
        fractionalNumberOfOrdersToFill: BigNumber,
        makerAssetContract: DummyERC20TokenContract | DummyERC721TokenContract,
        options: {
            ethValueAdjustment?: BigNumber; // Used to provided insufficient/excess ETH
            forwarderFeePercentage?: BigNumber;
            makerAssetId?: BigNumber;
            revertReason?: RevertReason;
        } = {},
    ): Promise<void> {
        const ethValueAdjustment = options.ethValueAdjustment || constants.ZERO_AMOUNT;
        const forwarderFeePercentage = options.forwarderFeePercentage || constants.ZERO_AMOUNT;

        const erc20Balances = await this._erc20Wrapper.getBalancesAsync();
        const takerEthBalanceBefore = await web3Wrapper.getBalanceInWeiAsync(this._takerAddress);
        const forwarderFeeRecipientEthBalanceBefore = await web3Wrapper.getBalanceInWeiAsync(
            this._forwarderFeeRecipientAddress,
        );

        const expectedResults = computeExpectedResults(orders, fractionalNumberOfOrdersToFill);
        const ethSpentOnForwarderFee = ForwarderTestFactory.getPercentageOfValue(
            expectedResults.takerAssetFillAmount,
            forwarderFeePercentage,
        );
        const feePercentage = ForwarderTestFactory.getPercentageOfValue(
            constants.PERCENTAGE_DENOMINATOR,
            forwarderFeePercentage,
        );

        const ethValue = expectedResults.takerAssetFillAmount
            .plus(expectedResults.wethFees)
            .plus(expectedResults.maxOversoldWeth)
            .plus(ethSpentOnForwarderFee)
            .plus(ethValueAdjustment);

        if (options.revertReason !== undefined) {
            await expectTransactionFailedAsync(
                this._forwarderWrapper.marketBuyOrdersWithEthAsync(
                    orders,
                    expectedResults.makerAssetFillAmount,
                    {
                        value: ethValue,
                        from: this._takerAddress,
                    },
                    { feePercentage, feeRecipient: this._forwarderFeeRecipientAddress },
                ),
                options.revertReason,
            );
            return;
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

        await this._checkResultsAsync(tx, expectedResults, takerEthBalanceBefore, erc20Balances, makerAssetContract, {
            forwarderFeePercentage,
            forwarderFeeRecipientEthBalanceBefore,
            makerAssetId: options.makerAssetId,
        });
    }

    public async marketSellTestAsync(
        orders: SignedOrder[],
        fractionalNumberOfOrdersToFill: BigNumber,
        makerAssetContract: DummyERC20TokenContract,
        options: {
            forwarderFeePercentage?: BigNumber;
            revertReason?: RevertReason;
        } = {},
    ): Promise<void> {
        const forwarderFeePercentage = options.forwarderFeePercentage || constants.ZERO_AMOUNT;

        const erc20Balances = await this._erc20Wrapper.getBalancesAsync();
        const takerEthBalanceBefore = await web3Wrapper.getBalanceInWeiAsync(this._takerAddress);
        const forwarderFeeRecipientEthBalanceBefore = await web3Wrapper.getBalanceInWeiAsync(
            this._forwarderFeeRecipientAddress,
        );

        const expectedResults = computeExpectedResults(orders, fractionalNumberOfOrdersToFill);
        const ethSpentOnForwarderFee = ForwarderTestFactory.getPercentageOfValue(
            expectedResults.takerAssetFillAmount,
            forwarderFeePercentage,
        );
        const feePercentage = ForwarderTestFactory.getPercentageOfValue(
            constants.PERCENTAGE_DENOMINATOR,
            forwarderFeePercentage,
        );

        const ethValue = expectedResults.takerAssetFillAmount
            .plus(expectedResults.wethFees)
            .plus(expectedResults.maxOversoldWeth)
            .plus(ethSpentOnForwarderFee);

        if (options.revertReason !== undefined) {
            await expectTransactionFailedAsync(
                this._forwarderWrapper.marketSellOrdersWithEthAsync(
                    orders,
                    {
                        value: ethValue,
                        from: this._takerAddress,
                    },
                    { feePercentage, feeRecipient: this._forwarderFeeRecipientAddress },
                ),
                options.revertReason,
            );
            return;
        }

        const tx = await this._forwarderWrapper.marketSellOrdersWithEthAsync(
            orders,
            {
                value: ethValue,
                from: this._takerAddress,
            },
            { feePercentage, feeRecipient: this._forwarderFeeRecipientAddress },
        );

        await this._checkResultsAsync(tx, expectedResults, takerEthBalanceBefore, erc20Balances, makerAssetContract, {
            forwarderFeePercentage,
            forwarderFeeRecipientEthBalanceBefore,
        });
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
        );
        expect(newBalances[this._orderFeeRecipientAddress][makerAssetAddress]).to.be.bignumber.equal(
            oldBalances[this._orderFeeRecipientAddress][makerAssetAddress].plus(expectedResults.percentageFees),
        );
        expect(newBalances[this._forwarderAddress][makerAssetAddress]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
    }

    private async _checkResultsAsync(
        tx: TransactionReceiptWithDecodedLogs,
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
        const ethSpentOnForwarderFee = ForwarderTestFactory.getPercentageOfValue(
            expectedResults.takerAssetFillAmount,
            options.forwarderFeePercentage || constants.ZERO_AMOUNT,
        );
        const totalEthSpent = expectedResults.takerAssetFillAmount
            .plus(expectedResults.wethFees)
            .plus(ethSpentOnForwarderFee)
            .plus(this._gasPrice.times(tx.gasUsed));

        const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(this._takerAddress);
        const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(this._forwarderAddress);
        const newBalances = await this._erc20Wrapper.getBalancesAsync();

        expectBalanceWithin(
            takerEthBalanceAfter,
            takerEthBalanceBefore.minus(totalEthSpent).minus(expectedResults.maxOversoldWeth),
            takerEthBalanceBefore.minus(totalEthSpent),
        );
        if (options.forwarderFeeRecipientEthBalanceBefore !== undefined) {
            const fowarderFeeRecipientEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(
                this._forwarderFeeRecipientAddress,
            );
            expect(fowarderFeeRecipientEthBalanceAfter).to.be.bignumber.equal(
                options.forwarderFeeRecipientEthBalanceBefore.plus(ethSpentOnForwarderFee),
            );
        }

        if (makerAssetContract instanceof DummyERC20TokenContract) {
            this._checkErc20Balances(erc20Balances, newBalances, expectedResults, makerAssetContract);
        } else if (options.makerAssetId !== undefined) {
            const newOwner = await makerAssetContract.ownerOf.callAsync(options.makerAssetId);
            expect(newOwner).to.be.bignumber.equal(this._takerAddress);
        }

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
        expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
    }
}
