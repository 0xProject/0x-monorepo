import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import 'mocha';

import { constants, marketUtils } from '../src';

import { chaiSetup } from './utils/chai_setup';
import { testOrderFactory } from './utils/test_order_factory';

chaiSetup.configure();
const expect = chai.expect;

// tslint:disable: no-unused-expression
describe('marketUtils', () => {
    describe.only('#findOrdersThatCoverMakerAssetFillAmount', () => {
        describe('no orders', () => {
            it('returns empty and unchanged remainingFillAmount', async () => {
                const fillAmount = new BigNumber(10);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
                    [],
                    [],
                    fillAmount,
                );
                expect(resultOrders).to.be.empty;
                expect(remainingFillAmount).to.be.bignumber.equal(fillAmount);
            });
        });
        describe('orders are all completely fillable', () => {
            // generate three signed orders each with 10 units of makerAsset, 30 total
            const testOrderCount = 3;
            const makerAssetAmount = new BigNumber(10);
            const inputOrders = testOrderFactory.generateTestSignedOrders(
                {
                    makerAssetAmount,
                },
                testOrderCount,
            );
            // generate remainingFillableMakerAssetAmounts that equal the makerAssetAmount
            const remainingFillableMakerAssetAmounts = [makerAssetAmount, makerAssetAmount, makerAssetAmount];
            it('returns input orders and zero remainingFillAmount when input exactly matches requested fill amount', async () => {
                // try to fill 30 units of makerAsset
                const fillAmount = new BigNumber(30);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
                    inputOrders,
                    remainingFillableMakerAssetAmounts,
                    fillAmount,
                );
                expect(resultOrders).to.be.deep.equal(inputOrders);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('returns input orders and zero remainingFillAmount when input has more than requested fill amount', async () => {
                // try to fill 25 units of makerAsset
                const fillAmount = new BigNumber(25);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
                    inputOrders,
                    remainingFillableMakerAssetAmounts,
                    fillAmount,
                );
                expect(resultOrders).to.be.deep.equal(inputOrders);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('returns input orders and non-zero remainingFillAmount when input has less than requested fill amount', async () => {
                // try to fill 35 units of makerAsset
                const fillAmount = new BigNumber(35);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
                    inputOrders,
                    remainingFillableMakerAssetAmounts,
                    fillAmount,
                );
                expect(resultOrders).to.be.deep.equal(inputOrders);
                expect(remainingFillAmount).to.be.bignumber.equal(new BigNumber(5));
            });
            it('returns first order and zero remainingFillAmount when requested fill amount is exactly covered by the first order', async () => {
                // try to fill 10 units of makerAsset
                const fillAmount = new BigNumber(10);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
                    inputOrders,
                    remainingFillableMakerAssetAmounts,
                    fillAmount,
                );
                expect(resultOrders).to.be.deep.equal([inputOrders[0]]);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('returns first two orders and zero remainingFillAmount when requested fill amount is over covered by the first two order', async () => {
                // try to fill 15 units of makerAsset
                const fillAmount = new BigNumber(15);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
                    inputOrders,
                    remainingFillableMakerAssetAmounts,
                    fillAmount,
                );
                expect(resultOrders).to.be.deep.equal([inputOrders[0], inputOrders[1]]);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
        });
        describe('orders are partially fillable', () => {
            // generate three signed orders each with 10 units of makerAsset, 30 total
            const testOrderCount = 3;
            const makerAssetAmount = new BigNumber(10);
            const inputOrders = testOrderFactory.generateTestSignedOrders(
                {
                    makerAssetAmount,
                },
                testOrderCount,
            );
            // generate remainingFillableMakerAssetAmounts that cover different partial fill scenarios
            // 1. order is completely filled already
            // 2. order is partially fillable
            // 3. order is completely fillable
            const remainingFillableMakerAssetAmounts = [constants.ZERO_AMOUNT, new BigNumber(5), makerAssetAmount];
            it('returns last 2 orders and non-zero remainingFillAmount when trying to fill original makerAssetAmounts', async () => {
                // try to fill 30 units of makerAsset
                const fillAmount = new BigNumber(30);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
                    inputOrders,
                    remainingFillableMakerAssetAmounts,
                    fillAmount,
                );
                expect(resultOrders).to.be.deep.equal([inputOrders[1], inputOrders[2]]);
                expect(remainingFillAmount).to.be.bignumber.equal(new BigNumber(15));
            });
        });
    });
    describe('#findFeeOrdersThatCoverFeesForTargetOrders', () => {});
});
