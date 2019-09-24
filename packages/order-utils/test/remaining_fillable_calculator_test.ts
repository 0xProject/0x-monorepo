import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import 'mocha';

import { RemainingFillableCalculator } from '../src/remaining_fillable_calculator';

import { chaiSetup } from './utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

describe('RemainingFillableCalculator', () => {
    let calculator: RemainingFillableCalculator;
    let signedOrder: SignedOrder;
    let transferrableMakeAssetAmount: BigNumber;
    let transferrableMakerFeeTokenAmount: BigNumber;
    let remainingMakeAssetAmount: BigNumber;
    let makerAmount: BigNumber;
    let takerAmount: BigNumber;
    let makerFeeAmount: BigNumber;
    let isPercentageFee: boolean;
    const makerAssetData: string = '0x1';
    const takerAssetData: string = '0x2';
    const makerFeeAssetData: string = '0x03';
    const takerFeeAssetData: string = '0x04';
    const decimals: number = 4;
    const zero: BigNumber = new BigNumber(0);
    const chainId: number = 1337;
    const zeroAddress = '0x0';
    const signature: string =
        '0x1B61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc3340349190569279751135161d22529dc25add4f6069af05be04cacbda2ace225403';
    beforeEach(async () => {
        [makerAmount, takerAmount, makerFeeAmount] = [
            Web3Wrapper.toBaseUnitAmount(new BigNumber(50), decimals),
            Web3Wrapper.toBaseUnitAmount(new BigNumber(5), decimals),
            Web3Wrapper.toBaseUnitAmount(new BigNumber(1), decimals),
        ];
        [transferrableMakeAssetAmount, transferrableMakerFeeTokenAmount] = [
            Web3Wrapper.toBaseUnitAmount(new BigNumber(50), decimals),
            Web3Wrapper.toBaseUnitAmount(new BigNumber(5), decimals),
        ];
    });
    function buildSignedOrder(): SignedOrder {
        return {
            signature,
            feeRecipientAddress: zeroAddress,
            senderAddress: zeroAddress,
            makerAddress: zeroAddress,
            takerAddress: zeroAddress,
            makerFee: makerFeeAmount,
            takerFee: zero,
            makerAssetAmount: makerAmount,
            takerAssetAmount: takerAmount,
            makerAssetData,
            takerAssetData,
            makerFeeAssetData,
            takerFeeAssetData,
            salt: zero,
            expirationTimeSeconds: zero,
            domain: {
                verifyingContract: zeroAddress,
                chainId,
            },
        };
    }
    describe('Maker asset is not fee asset', () => {
        before(async () => {
            isPercentageFee = false;
        });
        it('calculates the correct amount when unfilled and funds available', () => {
            signedOrder = buildSignedOrder();
            remainingMakeAssetAmount = signedOrder.makerAssetAmount;
            calculator = new RemainingFillableCalculator(
                signedOrder.makerFee,
                signedOrder.makerAssetAmount,
                isPercentageFee,
                transferrableMakeAssetAmount,
                transferrableMakerFeeTokenAmount,
                remainingMakeAssetAmount,
            );
            expect(calculator.computeRemainingFillable()).to.be.bignumber.equal(remainingMakeAssetAmount);
        });
        it('calculates the correct amount when partially filled and funds available', () => {
            signedOrder = buildSignedOrder();
            remainingMakeAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(1), decimals);
            calculator = new RemainingFillableCalculator(
                signedOrder.makerFee,
                signedOrder.makerAssetAmount,
                isPercentageFee,
                transferrableMakeAssetAmount,
                transferrableMakerFeeTokenAmount,
                remainingMakeAssetAmount,
            );
            expect(calculator.computeRemainingFillable()).to.be.bignumber.equal(remainingMakeAssetAmount);
        });
        it('calculates the amount to be 0 when all fee funds are transferred', () => {
            signedOrder = buildSignedOrder();
            transferrableMakerFeeTokenAmount = zero;
            remainingMakeAssetAmount = signedOrder.makerAssetAmount;
            calculator = new RemainingFillableCalculator(
                signedOrder.makerFee,
                signedOrder.makerAssetAmount,
                isPercentageFee,
                transferrableMakeAssetAmount,
                transferrableMakerFeeTokenAmount,
                remainingMakeAssetAmount,
            );
            expect(calculator.computeRemainingFillable()).to.be.bignumber.equal(zero);
        });
        it('calculates the correct amount when balance is less than remaining fillable', () => {
            signedOrder = buildSignedOrder();
            const partiallyFilledAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(2), decimals);
            remainingMakeAssetAmount = signedOrder.makerAssetAmount.minus(partiallyFilledAmount);
            transferrableMakeAssetAmount = remainingMakeAssetAmount.minus(partiallyFilledAmount);
            calculator = new RemainingFillableCalculator(
                signedOrder.makerFee,
                signedOrder.makerAssetAmount,
                isPercentageFee,
                transferrableMakeAssetAmount,
                transferrableMakerFeeTokenAmount,
                remainingMakeAssetAmount,
            );
            expect(calculator.computeRemainingFillable()).to.be.bignumber.equal(transferrableMakeAssetAmount);
        });
        describe('Order to Fee Ratio is < 1', () => {
            beforeEach(async () => {
                [makerAmount, takerAmount, makerFeeAmount] = [
                    Web3Wrapper.toBaseUnitAmount(new BigNumber(3), decimals),
                    Web3Wrapper.toBaseUnitAmount(new BigNumber(6), decimals),
                    Web3Wrapper.toBaseUnitAmount(new BigNumber(6), decimals),
                ];
            });
            it('calculates the correct amount when funds unavailable', () => {
                signedOrder = buildSignedOrder();
                remainingMakeAssetAmount = signedOrder.makerAssetAmount;
                const transferredAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(2), decimals);
                transferrableMakeAssetAmount = remainingMakeAssetAmount.minus(transferredAmount);
                calculator = new RemainingFillableCalculator(
                    signedOrder.makerFee,
                    signedOrder.makerAssetAmount,
                    isPercentageFee,
                    transferrableMakeAssetAmount,
                    transferrableMakerFeeTokenAmount,
                    remainingMakeAssetAmount,
                );
                expect(calculator.computeRemainingFillable()).to.be.bignumber.equal(transferrableMakeAssetAmount);
            });
        });
        describe('Ratio is not evenly divisible', () => {
            beforeEach(async () => {
                [makerAmount, takerAmount, makerFeeAmount] = [
                    Web3Wrapper.toBaseUnitAmount(new BigNumber(3), decimals),
                    Web3Wrapper.toBaseUnitAmount(new BigNumber(7), decimals),
                    Web3Wrapper.toBaseUnitAmount(new BigNumber(7), decimals),
                ];
            });
            it('calculates the correct amount when funds unavailable', () => {
                signedOrder = buildSignedOrder();
                remainingMakeAssetAmount = signedOrder.makerAssetAmount;
                const transferredAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(2), decimals);
                transferrableMakeAssetAmount = remainingMakeAssetAmount.minus(transferredAmount);
                calculator = new RemainingFillableCalculator(
                    signedOrder.makerFee,
                    signedOrder.makerAssetAmount,
                    isPercentageFee,
                    transferrableMakeAssetAmount,
                    transferrableMakerFeeTokenAmount,
                    remainingMakeAssetAmount,
                );
                const calculatedFillableAmount = calculator.computeRemainingFillable();
                expect(calculatedFillableAmount.isLessThanOrEqualTo(transferrableMakeAssetAmount)).to.be.true();
                expect(calculatedFillableAmount).to.be.bignumber.greaterThan(new BigNumber(0));
                const orderToFeeRatio = signedOrder.makerAssetAmount.dividedBy(signedOrder.makerFee);
                const calculatedFeeAmount = calculatedFillableAmount.dividedBy(orderToFeeRatio);
                expect(calculatedFeeAmount).to.be.bignumber.lessThan(transferrableMakerFeeTokenAmount);
            });
        });
    });
    describe('Maker asset is fee asset', () => {
        before(async () => {
            isPercentageFee = true;
        });
        it('calculates the correct amount when unfilled and funds available', () => {
            signedOrder = buildSignedOrder();
            transferrableMakeAssetAmount = makerAmount.plus(makerFeeAmount);
            transferrableMakerFeeTokenAmount = transferrableMakeAssetAmount;
            remainingMakeAssetAmount = signedOrder.makerAssetAmount;
            calculator = new RemainingFillableCalculator(
                signedOrder.makerFee,
                signedOrder.makerAssetAmount,
                isPercentageFee,
                transferrableMakeAssetAmount,
                transferrableMakerFeeTokenAmount,
                remainingMakeAssetAmount,
            );
            expect(calculator.computeRemainingFillable()).to.be.bignumber.equal(remainingMakeAssetAmount);
        });
        it('calculates the correct amount when partially filled and funds available', () => {
            signedOrder = buildSignedOrder();
            remainingMakeAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(1), decimals);
            calculator = new RemainingFillableCalculator(
                signedOrder.makerFee,
                signedOrder.makerAssetAmount,
                isPercentageFee,
                transferrableMakeAssetAmount,
                transferrableMakerFeeTokenAmount,
                remainingMakeAssetAmount,
            );
            expect(calculator.computeRemainingFillable()).to.be.bignumber.equal(remainingMakeAssetAmount);
        });
        it('calculates the amount to be 0 when all fee funds are transferred', () => {
            signedOrder = buildSignedOrder();
            transferrableMakeAssetAmount = zero;
            transferrableMakerFeeTokenAmount = zero;
            remainingMakeAssetAmount = signedOrder.makerAssetAmount;
            calculator = new RemainingFillableCalculator(
                signedOrder.makerFee,
                signedOrder.makerAssetAmount,
                isPercentageFee,
                transferrableMakeAssetAmount,
                transferrableMakerFeeTokenAmount,
                remainingMakeAssetAmount,
            );
            expect(calculator.computeRemainingFillable()).to.be.bignumber.equal(zero);
        });
        it('calculates the correct amount when balance is less than remaining fillable', () => {
            signedOrder = buildSignedOrder();
            const partiallyFilledAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(2), decimals);
            remainingMakeAssetAmount = signedOrder.makerAssetAmount.minus(partiallyFilledAmount);
            transferrableMakeAssetAmount = remainingMakeAssetAmount.minus(partiallyFilledAmount);
            transferrableMakerFeeTokenAmount = transferrableMakeAssetAmount;

            const orderToFeeRatio = signedOrder.makerAssetAmount.dividedToIntegerBy(signedOrder.makerFee);
            const expectedFillableAmount = new BigNumber(450980);
            calculator = new RemainingFillableCalculator(
                signedOrder.makerFee,
                signedOrder.makerAssetAmount,
                isPercentageFee,
                transferrableMakeAssetAmount,
                transferrableMakerFeeTokenAmount,
                remainingMakeAssetAmount,
            );
            const calculatedFillableAmount = calculator.computeRemainingFillable();
            const numberOfFillsInRatio = calculatedFillableAmount.dividedToIntegerBy(orderToFeeRatio);
            const calculatedFillableAmountPlusFees = calculatedFillableAmount.plus(numberOfFillsInRatio);
            expect(calculatedFillableAmountPlusFees).to.be.bignumber.lessThan(transferrableMakeAssetAmount);
            expect(calculatedFillableAmountPlusFees).to.be.bignumber.lessThan(remainingMakeAssetAmount);
            expect(calculatedFillableAmount).to.be.bignumber.equal(expectedFillableAmount);
            expect(numberOfFillsInRatio.decimalPlaces()).to.be.equal(0);
        });
    });
});
