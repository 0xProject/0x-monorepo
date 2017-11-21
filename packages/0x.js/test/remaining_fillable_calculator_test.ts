import 'mocha';
import * as chai from 'chai';
import BigNumber from 'bignumber.js';
import { chaiSetup } from './utils/chai_setup';
import { RemainingFillableCalculator } from '../src/order_watcher/remaining_fillable_calculator';
import { SignedOrder, ECSignature } from '../src/types';
import { TokenUtils } from './utils/token_utils';
import { ZeroEx } from '../src/0x';

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
    let makerFee: BigNumber;
    let isMakerTokenZRX: boolean;
    const makerToken: string = '0x1';
    const takerToken: string = '0x2';
    const decimals: number = 4;
    const zero: BigNumber = new BigNumber(0);
    const zeroAddress = '0x0';
    const signature: ECSignature = { v: 27, r: '', s: ''};
    beforeEach(async () => {
        [makerAmount, takerAmount, makerFee] = [ZeroEx.toBaseUnitAmount(new BigNumber(50), decimals),
                                                ZeroEx.toBaseUnitAmount(new BigNumber(5), decimals),
                                                ZeroEx.toBaseUnitAmount(new BigNumber(1), decimals)];
        [transferrableMakerTokenAmount, transferrableMakerFeeTokenAmount] = [
                                                ZeroEx.toBaseUnitAmount(new BigNumber(50), decimals),
                                                ZeroEx.toBaseUnitAmount(new BigNumber(5), decimals)];
    });
    function buildSignedOrder(): SignedOrder {
        return { ecSignature: signature,
                 exchangeContractAddress: zeroAddress,
                 feeRecipient: zeroAddress,
                 maker: zeroAddress,
                 taker: zeroAddress,
                 makerFee: (makerFee || zero),
                 takerFee: zero,
                 makerTokenAmount: makerAmount,
                 takerTokenAmount: takerAmount,
                 makerTokenAddress: makerToken,
                 takerTokenAddress: takerToken,
                 salt: zero,
                 expirationUnixTimestampSec: zero };
    }
    describe('Maker token is NOT ZRX', () => {
        before(async () => {
            isMakerTokenZRX = false;
        });
        it('calculates the correct amount when unfilled and funds available', () => {
            signedOrder = buildSignedOrder();
            remainingMakerTokenAmount = signedOrder.makerTokenAmount;
            calculator = new RemainingFillableCalculator(signedOrder, isMakerTokenZRX,
                           transferrableMakerTokenAmount, transferrableMakerFeeTokenAmount, remainingMakerTokenAmount);
            expect(calculator.computeRemainingMakerFillable()).to.be.bignumber.equal(remainingMakerTokenAmount);
        });
        it('calculates the correct amount when partially filled and funds available', () => {
            signedOrder = buildSignedOrder();
            remainingMakerTokenAmount = ZeroEx.toBaseUnitAmount(new BigNumber(1), decimals);
            calculator = new RemainingFillableCalculator(signedOrder, isMakerTokenZRX,
                           transferrableMakerTokenAmount, transferrableMakerFeeTokenAmount, remainingMakerTokenAmount);
            expect(calculator.computeRemainingMakerFillable()).to.be.bignumber.equal(remainingMakerTokenAmount);
        });
        it('calculates the amount to be 0 when all fee funds are transferred', () => {
            signedOrder = buildSignedOrder();
            transferrableMakerFeeTokenAmount = zero;
            remainingMakerTokenAmount = signedOrder.makerTokenAmount;
            calculator = new RemainingFillableCalculator(signedOrder, isMakerTokenZRX,
                           transferrableMakerTokenAmount, transferrableMakerFeeTokenAmount, remainingMakerTokenAmount);
            expect(calculator.computeRemainingMakerFillable()).to.be.bignumber.equal(zero);
        });
        it('calculates the correct amount when balance is less than remaining fillable', () => {
            signedOrder = buildSignedOrder();
            const partiallyFilledAmount = ZeroEx.toBaseUnitAmount(new BigNumber(2), decimals);
            remainingMakerTokenAmount = signedOrder.makerTokenAmount.minus(partiallyFilledAmount);
            transferrableMakerTokenAmount = remainingMakerTokenAmount.minus(partiallyFilledAmount);
            calculator = new RemainingFillableCalculator(signedOrder, isMakerTokenZRX,
                           transferrableMakerTokenAmount, transferrableMakerFeeTokenAmount, remainingMakerTokenAmount);
            expect(calculator.computeRemainingMakerFillable()).to.be.bignumber.equal(transferrableMakerTokenAmount);
        });
    });
    describe('Maker Token is ZRX', () => {
        before(async () => {
            isMakerTokenZRX = true;
        });
        it('calculates the correct amount when unfilled and funds available', () => {
            signedOrder = buildSignedOrder();
            transferrableMakerTokenAmount = makerAmount.plus(makerFee);
            transferrableMakerFeeTokenAmount = transferrableMakerTokenAmount;
            remainingMakerTokenAmount = signedOrder.makerTokenAmount;
            calculator = new RemainingFillableCalculator(signedOrder, isMakerTokenZRX,
                           transferrableMakerTokenAmount, transferrableMakerFeeTokenAmount, remainingMakerTokenAmount);
            expect(calculator.computeRemainingMakerFillable()).to.be.bignumber.equal(remainingMakerTokenAmount);
        });
        it('calculates the correct amount when partially filled and funds available', () => {
            signedOrder = buildSignedOrder();
            remainingMakerTokenAmount = ZeroEx.toBaseUnitAmount(new BigNumber(1), decimals);
            calculator = new RemainingFillableCalculator(signedOrder, isMakerTokenZRX,
                           transferrableMakerTokenAmount, transferrableMakerFeeTokenAmount, remainingMakerTokenAmount);
            expect(calculator.computeRemainingMakerFillable()).to.be.bignumber.equal(remainingMakerTokenAmount);
        });
        it('calculates the amount to be 0 when all fee funds are transferred', () => {
            signedOrder = buildSignedOrder();
            transferrableMakerTokenAmount = zero;
            transferrableMakerFeeTokenAmount = zero;
            remainingMakerTokenAmount = signedOrder.makerTokenAmount;
            calculator = new RemainingFillableCalculator(signedOrder, isMakerTokenZRX,
                           transferrableMakerTokenAmount, transferrableMakerFeeTokenAmount, remainingMakerTokenAmount);
            expect(calculator.computeRemainingMakerFillable()).to.be.bignumber.equal(zero);
        });
        it('calculates the correct amount when balance is less than remaining fillable', () => {
            signedOrder = buildSignedOrder();
            const partiallyFilledAmount = ZeroEx.toBaseUnitAmount(new BigNumber(2), decimals);
            remainingMakerTokenAmount = signedOrder.makerTokenAmount.minus(partiallyFilledAmount);
            transferrableMakerTokenAmount = remainingMakerTokenAmount.minus(partiallyFilledAmount);
            transferrableMakerFeeTokenAmount = transferrableMakerTokenAmount;

            const orderToFeeRatio = signedOrder.makerTokenAmount.dividedToIntegerBy(signedOrder.makerFee);
            const expectedFillableAmount = new BigNumber(450950);
            const numberOfFillsInRatio = expectedFillableAmount.dividedToIntegerBy(orderToFeeRatio);
            calculator = new RemainingFillableCalculator(signedOrder, isMakerTokenZRX,
                           transferrableMakerTokenAmount, transferrableMakerFeeTokenAmount, remainingMakerTokenAmount);
            const calculatedFillableAmount = calculator.computeRemainingMakerFillable();
            const calculatedFillableAmountPlusFees = calculatedFillableAmount.plus(numberOfFillsInRatio);
            expect(calculatedFillableAmount).to.be.bignumber.equal(expectedFillableAmount);
            expect(calculatedFillableAmountPlusFees).to.be.bignumber.lessThan(transferrableMakerTokenAmount);
            expect(calculatedFillableAmountPlusFees).to.be.bignumber.lessThan(remainingMakerTokenAmount);
        });
    });
});
