import * as chai from 'chai';
import * as _ from 'lodash';
import 'mocha';

import { constants } from '../src/constants';
import { marketUtils } from '../src/utils/market_utils';

import { chaiSetup } from './utils/chai_setup';
import { testOrders } from './utils/test_orders';
import { baseUnitAmount } from './utils/utils';

chaiSetup.configure();
const expect = chai.expect;

// tslint:disable:custom-no-magic-numbers
// tslint:disable: no-unused-expression
describe('marketUtils', () => {
    describe('#findOrdersThatCoverTakerAssetFillAmount', () => {
        describe('no orders', () => {
            it('returns empty and unchanged remainingFillAmount', async () => {
                const fillAmount = baseUnitAmount(9);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverTakerAssetFillAmount(
                    [],
                    fillAmount,
                );
                expect(resultOrders).to.be.empty;
                expect(remainingFillAmount).to.be.bignumber.equal(fillAmount);
            });
        });
        describe('orders do not have fees', () => {
            const inputOrders = testOrders.PRUNED_SIGNED_ORDERS_FEELESS;
            it('returns input orders and zero remainingFillAmount when input exactly matches requested fill amount', async () => {
                const fillAmount = baseUnitAmount(5);
                const slippageBufferAmount = baseUnitAmount(4);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverTakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                    slippageBufferAmount,
                );
                expect(resultOrders).to.be.deep.equal(inputOrders);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('returns input orders and zero remainingFillAmount when input has more than requested fill amount', async () => {
                const fillAmount = baseUnitAmount(6);
                const slippageBufferAmount = baseUnitAmount(3);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverTakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                    slippageBufferAmount,
                );
                expect(resultOrders).to.be.deep.equal(inputOrders);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('returns input orders and non-zero remainingFillAmount when input has less than requested fill amount', async () => {
                const fillAmount = baseUnitAmount(10);
                const slippageBufferAmount = baseUnitAmount(2);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverTakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                    slippageBufferAmount,
                );
                expect(resultOrders).to.be.deep.equal(inputOrders);
                expect(remainingFillAmount).to.be.bignumber.equal(baseUnitAmount(3));
            });
            it('returns first order and zero remainingFillAmount when requested fill amount is exactly covered by the first order', async () => {
                const fillAmount = baseUnitAmount(1);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverTakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                );
                expect(resultOrders).to.be.deep.equal([inputOrders[0]]);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('returns first two orders and zero remainingFillAmount when requested fill amount is over covered by the first two order', async () => {
                const fillAmount = baseUnitAmount(6);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverTakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                );
                expect(resultOrders).to.be.deep.equal([inputOrders[0], inputOrders[1]]);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
        });
        describe('orders have fees in takerAsset', () => {
            const inputOrders = testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_TAKER_ASSET;
            it('returns input orders and zero remainingFillAmount when input exactly matches requested fill amount', async () => {
                const fillAmount = baseUnitAmount(10);
                const slippageBufferAmount = baseUnitAmount(5);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverTakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                    slippageBufferAmount,
                );
                expect(resultOrders).to.be.deep.equal(inputOrders);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('returns input orders and zero remainingFillAmount when input has more than requested fill amount', async () => {
                const fillAmount = baseUnitAmount(6);
                const slippageBufferAmount = baseUnitAmount(6);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverTakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                    slippageBufferAmount,
                );
                expect(resultOrders).to.be.deep.equal(inputOrders);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('returns input orders and non-zero remainingFillAmount when input has less than requested fill amount', async () => {
                const fillAmount = baseUnitAmount(10);
                const slippageBufferAmount = baseUnitAmount(6);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverTakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                    slippageBufferAmount,
                );
                expect(resultOrders).to.be.deep.equal(inputOrders);
                expect(remainingFillAmount).to.be.bignumber.equal(baseUnitAmount(1));
            });
            it('returns first order and zero remainingFillAmount when requested fill amount is exactly covered by the first order', async () => {
                const fillAmount = baseUnitAmount(4);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverTakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                );
                expect(resultOrders).to.be.deep.equal([inputOrders[0]]);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('returns first two orders and zero remainingFillAmount when requested fill amount is over covered by the first two order', async () => {
                const fillAmount = baseUnitAmount(9);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverTakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                );
                expect(resultOrders).to.be.deep.equal([inputOrders[0], inputOrders[1]]);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
        });
        describe('orders are feeless or have fees in takerAsset', () => {
            const inputOrders = _.concat(
                testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_TAKER_ASSET,
                testOrders.PRUNED_SIGNED_ORDERS_FEELESS,
            );
            it('returns input orders and zero remainingFillAmount when input exactly matches requested fill amount', async () => {
                const fillAmount = baseUnitAmount(20);
                const slippageBufferAmount = baseUnitAmount(4);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverTakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                    slippageBufferAmount,
                );
                expect(resultOrders).to.be.deep.equal(inputOrders);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('returns input orders and zero remainingFillAmount when input has more than requested fill amount', async () => {
                const fillAmount = baseUnitAmount(10);
                const slippageBufferAmount = baseUnitAmount(12);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverTakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                    slippageBufferAmount,
                );
                expect(resultOrders).to.be.deep.equal(inputOrders);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('returns input orders and non-zero remainingFillAmount when input has less than requested fill amount', async () => {
                const fillAmount = baseUnitAmount(20);
                const slippageBufferAmount = baseUnitAmount(6);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverTakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                    slippageBufferAmount,
                );
                expect(resultOrders).to.be.deep.equal(inputOrders);
                expect(remainingFillAmount).to.be.bignumber.equal(baseUnitAmount(2));
            });
            it('returns first order and zero remainingFillAmount when requested fill amount is exactly covered by the first order', async () => {
                const fillAmount = baseUnitAmount(4);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverTakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                );
                expect(resultOrders).to.be.deep.equal([inputOrders[0]]);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('returns first four orders and zero remainingFillAmount when requested fill amount is over covered by the first two order', async () => {
                const fillAmount = baseUnitAmount(16);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverTakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                );
                expect(resultOrders).to.be.deep.equal([inputOrders[0], inputOrders[1], inputOrders[2], inputOrders[3]]);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
        });
    });
    describe('#findOrdersThatCoverMakerAssetFillAmount', () => {
        describe('no orders', () => {
            it('returns empty and unchanged remainingFillAmount', async () => {
                const fillAmount = baseUnitAmount(9);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
                    [],
                    fillAmount,
                );
                expect(resultOrders).to.be.empty;
                expect(remainingFillAmount).to.be.bignumber.equal(fillAmount);
            });
        });
        describe('orders do not have fees', () => {
            const inputOrders = testOrders.PRUNED_SIGNED_ORDERS_FEELESS;
            it('returns input orders and zero remainingFillAmount when input exactly matches requested fill amount', async () => {
                const fillAmount = baseUnitAmount(6);
                const slippageBufferAmount = baseUnitAmount(4);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                    slippageBufferAmount,
                );
                expect(resultOrders).to.be.deep.equal(inputOrders);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('returns input orders and zero remainingFillAmount when input has more than requested fill amount', async () => {
                const fillAmount = baseUnitAmount(6);
                const slippageBufferAmount = baseUnitAmount(3);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                    slippageBufferAmount,
                );
                expect(resultOrders).to.be.deep.equal(inputOrders);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('returns input orders and non-zero remainingFillAmount when input has less than requested fill amount', async () => {
                const fillAmount = baseUnitAmount(10);
                const slippageBufferAmount = baseUnitAmount(2);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                    slippageBufferAmount,
                );
                expect(resultOrders).to.be.deep.equal(inputOrders);
                expect(remainingFillAmount).to.be.bignumber.equal(baseUnitAmount(2));
            });
            it('returns first order and zero remainingFillAmount when requested fill amount is exactly covered by the first order', async () => {
                const fillAmount = baseUnitAmount(6);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                );
                expect(resultOrders).to.be.deep.equal([inputOrders[0]]);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('returns first two orders and zero remainingFillAmount when requested fill amount is over covered by the first two order', async () => {
                const fillAmount = baseUnitAmount(8);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                );
                expect(resultOrders).to.be.deep.equal([inputOrders[0], inputOrders[1]]);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
        });
        describe('orders have fees in makerAsset', () => {
            const inputOrders = testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_MAKER_ASSET;
            it('returns input orders and zero remainingFillAmount when input exactly matches requested fill amount', async () => {
                const fillAmount = baseUnitAmount(2);
                const slippageBufferAmount = baseUnitAmount(3);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                    slippageBufferAmount,
                );
                expect(resultOrders).to.be.deep.equal(inputOrders);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('returns input orders and zero remainingFillAmount when input has more than requested fill amount', async () => {
                const fillAmount = baseUnitAmount(4);
                const slippageBufferAmount = baseUnitAmount(0.5);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                    slippageBufferAmount,
                );
                expect(resultOrders).to.be.deep.equal(inputOrders);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('returns input orders and non-zero remainingFillAmount when input has less than requested fill amount', async () => {
                const fillAmount = baseUnitAmount(3);
                const slippageBufferAmount = baseUnitAmount(3);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                    slippageBufferAmount,
                );
                expect(resultOrders).to.be.deep.equal(inputOrders);
                expect(remainingFillAmount).to.be.bignumber.equal(baseUnitAmount(1));
            });
            it('returns first order and zero remainingFillAmount when requested fill amount is exactly covered by the first order', async () => {
                const fillAmount = baseUnitAmount(1);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                );
                expect(resultOrders).to.be.deep.equal([inputOrders[0]]);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('returns first two orders and zero remainingFillAmount when requested fill amount is over covered by the first two order', async () => {
                const fillAmount = baseUnitAmount(2);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                );
                expect(resultOrders).to.be.deep.equal([inputOrders[0], inputOrders[1]]);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
        });
        describe('orders are feeless or have fees in makerAsset', () => {
            const inputOrders = _.concat(
                testOrders.PRUNED_SIGNED_ORDERS_FEE_IN_MAKER_ASSET,
                testOrders.PRUNED_SIGNED_ORDERS_FEELESS,
            );
            it('returns input orders and zero remainingFillAmount when input exactly matches requested fill amount', async () => {
                const fillAmount = baseUnitAmount(12);
                const slippageBufferAmount = baseUnitAmount(3);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                    slippageBufferAmount,
                );
                expect(resultOrders).to.be.deep.equal(inputOrders);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('returns input orders and zero remainingFillAmount when input has more than requested fill amount', async () => {
                const fillAmount = baseUnitAmount(12);
                const slippageBufferAmount = baseUnitAmount(2);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                    slippageBufferAmount,
                );
                expect(resultOrders).to.be.deep.equal(inputOrders);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('returns input orders and non-zero remainingFillAmount when input has less than requested fill amount', async () => {
                const fillAmount = baseUnitAmount(14);
                const slippageBufferAmount = baseUnitAmount(4);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                    slippageBufferAmount,
                );
                expect(resultOrders).to.be.deep.equal(inputOrders);
                expect(remainingFillAmount).to.be.bignumber.equal(baseUnitAmount(3));
            });
            it('returns first order and zero remainingFillAmount when requested fill amount is exactly covered by the first order', async () => {
                const fillAmount = baseUnitAmount(1);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                );
                expect(resultOrders).to.be.deep.equal([inputOrders[0]]);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('returns first four orders and zero remainingFillAmount when requested fill amount is over covered by the first two order', async () => {
                const fillAmount = baseUnitAmount(11);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                );
                expect(resultOrders).to.be.deep.equal([inputOrders[0], inputOrders[1], inputOrders[2], inputOrders[3]]);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
        });
    });
});
