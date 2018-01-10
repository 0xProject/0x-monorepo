import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import 'mocha';

import { ZeroEx } from '../src/0x';
import { RemainingFillableCalculator } from '../src/order_watcher/remaining_fillable_calculator';
import { ECSignature, SignedOrder } from '../src/types';

import { chaiSetup } from './utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

describe('RemainingFillableCalculator', () => {
    let calculator: RemainingFillableCalculator;
    let signedOrder: SignedOrder;
    let transferrableMakerTokenAmount: BigNumber;
    let transferrableMakerFeeTokenAmount: BigNumber;
    let remainingMakerTokenAmount: BigNumber;
    let makerAmount: BigNumber;
    let takerAmount: BigNumber;
    let makerFeeAmount: BigNumber;
    let isMakerTokenZRX: boolean;
    const makerToken: string = '0x1';
    const takerToken: string = '0x2';
    const decimals: number = 4;
    const zero: BigNumber = new BigNumber(0);
    const zeroAddress = '0x0';
    const signature: ECSignature = { v: 27, r: '', s: '' };
    beforeEach(async () => {
        [makerAmount, takerAmount, makerFeeAmount] = [
            ZeroEx.toBaseUnitAmount(new BigNumber(50), decimals),
            ZeroEx.toBaseUnitAmount(new BigNumber(5), decimals),
            ZeroEx.toBaseUnitAmount(new BigNumber(1), decimals),
        ];
        [transferrableMakerTokenAmount, transferrableMakerFeeTokenAmount] = [
            ZeroEx.toBaseUnitAmount(new BigNumber(50), decimals),
            ZeroEx.toBaseUnitAmount(new BigNumber(5), decimals),
        ];
    });
    function buildSignedOrder(): SignedOrder {
        return {
            ecSignature: signature,
            exchangeContractAddress: zeroAddress,
            feeRecipient: zeroAddress,
            maker: zeroAddress,
            taker: zeroAddress,
            makerFee: makerFeeAmount,
            takerFee: zero,
            makerTokenAmount: makerAmount,
            takerTokenAmount: takerAmount,
            makerTokenAddress: makerToken,
            takerTokenAddress: takerToken,
            salt: zero,
            expirationUnixTimestampSec: zero,
        };
    }
    describe('Maker token is NOT ZRX', () => {
        before(async () => {
            isMakerTokenZRX = false;
        });
        it('calculates the correct amount when unfilled and funds available', () => {
            signedOrder = buildSignedOrder();
            remainingMakerTokenAmount = signedOrder.makerTokenAmount;
            calculator = new RemainingFillableCalculator(
                signedOrder,
                isMakerTokenZRX,
                transferrableMakerTokenAmount,
                transferrableMakerFeeTokenAmount,
                remainingMakerTokenAmount,
            );
            expect(calculator.computeRemainingMakerFillable()).to.be.bignumber.equal(remainingMakerTokenAmount);
        });
        it('calculates the correct amount when partially filled and funds available', () => {
            signedOrder = buildSignedOrder();
            remainingMakerTokenAmount = ZeroEx.toBaseUnitAmount(new BigNumber(1), decimals);
            calculator = new RemainingFillableCalculator(
                signedOrder,
                isMakerTokenZRX,
                transferrableMakerTokenAmount,
                transferrableMakerFeeTokenAmount,
                remainingMakerTokenAmount,
            );
            expect(calculator.computeRemainingMakerFillable()).to.be.bignumber.equal(remainingMakerTokenAmount);
        });
        it('calculates the amount to be 0 when all fee funds are transferred', () => {
            signedOrder = buildSignedOrder();
            transferrableMakerFeeTokenAmount = zero;
            remainingMakerTokenAmount = signedOrder.makerTokenAmount;
            calculator = new RemainingFillableCalculator(
                signedOrder,
                isMakerTokenZRX,
                transferrableMakerTokenAmount,
                transferrableMakerFeeTokenAmount,
                remainingMakerTokenAmount,
            );
            expect(calculator.computeRemainingMakerFillable()).to.be.bignumber.equal(zero);
        });
        it('calculates the correct amount when balance is less than remaining fillable', () => {
            signedOrder = buildSignedOrder();
            const partiallyFilledAmount = ZeroEx.toBaseUnitAmount(new BigNumber(2), decimals);
            remainingMakerTokenAmount = signedOrder.makerTokenAmount.minus(partiallyFilledAmount);
            transferrableMakerTokenAmount = remainingMakerTokenAmount.minus(partiallyFilledAmount);
            calculator = new RemainingFillableCalculator(
                signedOrder,
                isMakerTokenZRX,
                transferrableMakerTokenAmount,
                transferrableMakerFeeTokenAmount,
                remainingMakerTokenAmount,
            );
            expect(calculator.computeRemainingMakerFillable()).to.be.bignumber.equal(transferrableMakerTokenAmount);
        });
        describe('Order to Fee Ratio is < 1', () => {
            beforeEach(async () => {
                [makerAmount, takerAmount, makerFeeAmount] = [
                    ZeroEx.toBaseUnitAmount(new BigNumber(3), decimals),
                    ZeroEx.toBaseUnitAmount(new BigNumber(6), decimals),
                    ZeroEx.toBaseUnitAmount(new BigNumber(6), decimals),
                ];
            });
            it('calculates the correct amount when funds unavailable', () => {
                signedOrder = buildSignedOrder();
                remainingMakerTokenAmount = signedOrder.makerTokenAmount;
                const transferredAmount = ZeroEx.toBaseUnitAmount(new BigNumber(2), decimals);
                transferrableMakerTokenAmount = remainingMakerTokenAmount.minus(transferredAmount);
                calculator = new RemainingFillableCalculator(
                    signedOrder,
                    isMakerTokenZRX,
                    transferrableMakerTokenAmount,
                    transferrableMakerFeeTokenAmount,
                    remainingMakerTokenAmount,
                );
                expect(calculator.computeRemainingMakerFillable()).to.be.bignumber.equal(transferrableMakerTokenAmount);
            });
        });
        describe('Ratio is not evenly divisble', () => {
            beforeEach(async () => {
                [makerAmount, takerAmount, makerFeeAmount] = [
                    ZeroEx.toBaseUnitAmount(new BigNumber(3), decimals),
                    ZeroEx.toBaseUnitAmount(new BigNumber(7), decimals),
                    ZeroEx.toBaseUnitAmount(new BigNumber(7), decimals),
                ];
            });
            it('calculates the correct amount when funds unavailable', () => {
                signedOrder = buildSignedOrder();
                remainingMakerTokenAmount = signedOrder.makerTokenAmount;
                const transferredAmount = ZeroEx.toBaseUnitAmount(new BigNumber(2), decimals);
                transferrableMakerTokenAmount = remainingMakerTokenAmount.minus(transferredAmount);
                calculator = new RemainingFillableCalculator(
                    signedOrder,
                    isMakerTokenZRX,
                    transferrableMakerTokenAmount,
                    transferrableMakerFeeTokenAmount,
                    remainingMakerTokenAmount,
                );
                const calculatedFillableAmount = calculator.computeRemainingMakerFillable();
                expect(calculatedFillableAmount.lessThanOrEqualTo(transferrableMakerTokenAmount)).to.be.true();
                expect(calculatedFillableAmount).to.be.bignumber.greaterThan(new BigNumber(0));
                const orderToFeeRatio = signedOrder.makerTokenAmount.dividedBy(signedOrder.makerFee);
                const calculatedFeeAmount = calculatedFillableAmount.dividedBy(orderToFeeRatio);
                expect(calculatedFeeAmount).to.be.bignumber.lessThan(transferrableMakerFeeTokenAmount);
            });
        });
    });
    describe('Maker Token is ZRX', () => {
        before(async () => {
            isMakerTokenZRX = true;
        });
        it('calculates the correct amount when unfilled and funds available', () => {
            signedOrder = buildSignedOrder();
            transferrableMakerTokenAmount = makerAmount.plus(makerFeeAmount);
            transferrableMakerFeeTokenAmount = transferrableMakerTokenAmount;
            remainingMakerTokenAmount = signedOrder.makerTokenAmount;
            calculator = new RemainingFillableCalculator(
                signedOrder,
                isMakerTokenZRX,
                transferrableMakerTokenAmount,
                transferrableMakerFeeTokenAmount,
                remainingMakerTokenAmount,
            );
            expect(calculator.computeRemainingMakerFillable()).to.be.bignumber.equal(remainingMakerTokenAmount);
        });
        it('calculates the correct amount when partially filled and funds available', () => {
            signedOrder = buildSignedOrder();
            remainingMakerTokenAmount = ZeroEx.toBaseUnitAmount(new BigNumber(1), decimals);
            calculator = new RemainingFillableCalculator(
                signedOrder,
                isMakerTokenZRX,
                transferrableMakerTokenAmount,
                transferrableMakerFeeTokenAmount,
                remainingMakerTokenAmount,
            );
            expect(calculator.computeRemainingMakerFillable()).to.be.bignumber.equal(remainingMakerTokenAmount);
        });
        it('calculates the amount to be 0 when all fee funds are transferred', () => {
            signedOrder = buildSignedOrder();
            transferrableMakerTokenAmount = zero;
            transferrableMakerFeeTokenAmount = zero;
            remainingMakerTokenAmount = signedOrder.makerTokenAmount;
            calculator = new RemainingFillableCalculator(
                signedOrder,
                isMakerTokenZRX,
                transferrableMakerTokenAmount,
                transferrableMakerFeeTokenAmount,
                remainingMakerTokenAmount,
            );
            expect(calculator.computeRemainingMakerFillable()).to.be.bignumber.equal(zero);
        });
        it('calculates the correct amount when balance is less than remaining fillable', () => {
            signedOrder = buildSignedOrder();
            const partiallyFilledAmount = ZeroEx.toBaseUnitAmount(new BigNumber(2), decimals);
            remainingMakerTokenAmount = signedOrder.makerTokenAmount.minus(partiallyFilledAmount);
            transferrableMakerTokenAmount = remainingMakerTokenAmount.minus(partiallyFilledAmount);
            transferrableMakerFeeTokenAmount = transferrableMakerTokenAmount;

            const orderToFeeRatio = signedOrder.makerTokenAmount.dividedToIntegerBy(signedOrder.makerFee);
            const expectedFillableAmount = new BigNumber(450980);
            calculator = new RemainingFillableCalculator(
                signedOrder,
                isMakerTokenZRX,
                transferrableMakerTokenAmount,
                transferrableMakerFeeTokenAmount,
                remainingMakerTokenAmount,
            );
            const calculatedFillableAmount = calculator.computeRemainingMakerFillable();
            const numberOfFillsInRatio = calculatedFillableAmount.dividedToIntegerBy(orderToFeeRatio);
            const calculatedFillableAmountPlusFees = calculatedFillableAmount.plus(numberOfFillsInRatio);
            expect(calculatedFillableAmountPlusFees).to.be.bignumber.lessThan(transferrableMakerTokenAmount);
            expect(calculatedFillableAmountPlusFees).to.be.bignumber.lessThan(remainingMakerTokenAmount);
            expect(calculatedFillableAmount).to.be.bignumber.equal(expectedFillableAmount);
            expect(numberOfFillsInRatio.decimalPlaces()).to.be.equal(0);
        });
    });
});
