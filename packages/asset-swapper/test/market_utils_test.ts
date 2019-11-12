import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { marketUtils } from '../src';
import { constants } from '../src/constants';

import { chaiSetup } from './utils/chai_setup';
import { testOrderFactory } from './utils/test_order_factory';

chaiSetup.configure();
const expect = chai.expect;

// tslint:disable: no-unused-expression
describe('marketUtils', () => {
    describe('#findOrdersThatCoverTakerAssetFillAmount', () => {
        describe('no orders', () => {
            it('returns empty and unchanged remainingFillAmount', async () => {
                const fillAmount = new BigNumber(10);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverTakerAssetFillAmount(
                    [],
                    fillAmount,
                );
                expect(resultOrders).to.be.empty;
                expect(remainingFillAmount).to.be.bignumber.equal(fillAmount);
            });
        });
        describe('orders are completely fillable', () => {
            // generate three signed orders each with 10 units of makerAsset, 30 total
            const takerAssetAmount = new BigNumber(10);
            const inputOrders = testOrderFactory.generateTestSignedOrders(
                {
                    takerAssetAmount,
                },
                3,
            );
            it('returns input orders and zero remainingFillAmount when input exactly matches requested fill amount', async () => {
                // try to fill 20 units of makerAsset
                // include 10 units of slippageBufferAmount
                const fillAmount = new BigNumber(20);
                const slippageBufferAmount = new BigNumber(10);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverTakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                    {
                        slippageBufferAmount,
                    },
                );
                expect(resultOrders).to.be.deep.equal(inputOrders);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('returns input orders and zero remainingFillAmount when input has more than requested fill amount', async () => {
                // try to fill 15 units of makerAsset
                // include 10 units of slippageBufferAmount
                const fillAmount = new BigNumber(15);
                const slippageBufferAmount = new BigNumber(10);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverTakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                    {
                        slippageBufferAmount,
                    },
                );
                expect(resultOrders).to.be.deep.equal(inputOrders);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('returns input orders and non-zero remainingFillAmount when input has less than requested fill amount', async () => {
                // try to fill 30 units of makerAsset
                // include 5 units of slippageBufferAmount
                const fillAmount = new BigNumber(30);
                const slippageBufferAmount = new BigNumber(5);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverTakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                    {
                        slippageBufferAmount,
                    },
                );
                expect(resultOrders).to.be.deep.equal(inputOrders);
                expect(remainingFillAmount).to.be.bignumber.equal(new BigNumber(5));
            });
            it('returns first order and zero remainingFillAmount when requested fill amount is exactly covered by the first order', async () => {
                // try to fill 10 units of makerAsset
                const fillAmount = new BigNumber(10);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverTakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                );
                expect(resultOrders).to.be.deep.equal([inputOrders[0]]);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('returns first two orders and zero remainingFillAmount when requested fill amount is over covered by the first two order', async () => {
                // try to fill 15 units of makerAsset
                const fillAmount = new BigNumber(15);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverTakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                );
                expect(resultOrders).to.be.deep.equal([inputOrders[0], inputOrders[1]]);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
        });
        describe('orders are partially fillable', () => {
            // generate three signed orders each with 10 units of makerAsset, 30 total
            const takerAssetAmount = new BigNumber(10);
            const inputOrders = testOrderFactory.generateTestSignedOrders(
                {
                    takerAssetAmount,
                },
                3,
            );
            // generate remainingFillableMakerAssetAmounts that cover different partial fill scenarios
            // 1. order is completely filled already
            // 2. order is partially fillable
            // 3. order is completely fillable
            const remainingFillableTakerAssetAmounts = [constants.ZERO_AMOUNT, new BigNumber(5), takerAssetAmount];
            it('returns last two orders and non-zero remainingFillAmount when trying to fill original takerAssetAmounts', async () => {
                // try to fill 30 units of takerAsset
                const fillAmount = new BigNumber(30);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverTakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                    {
                        remainingFillableTakerAssetAmounts,
                    },
                );
                expect(resultOrders).to.be.deep.equal([inputOrders[1], inputOrders[2]]);
                expect(remainingFillAmount).to.be.bignumber.equal(new BigNumber(15));
            });
            it('returns last two orders and zero remainingFillAmount when trying to fill exactly takerAssetAmounts remaining', async () => {
                // try to fill 15 units of takerAsset
                const fillAmount = new BigNumber(15);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverTakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                    {
                        remainingFillableTakerAssetAmounts,
                    },
                );
                expect(resultOrders).to.be.deep.equal([inputOrders[1], inputOrders[2]]);
                expect(remainingFillAmount).to.be.bignumber.equal(new BigNumber(0));
            });
        });
    });
    describe('#findOrdersThatCoverMakerAssetFillAmount', () => {
        describe('no orders', () => {
            it('returns empty and unchanged remainingFillAmount', async () => {
                const fillAmount = new BigNumber(10);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
                    [],
                    fillAmount,
                );
                expect(resultOrders).to.be.empty;
                expect(remainingFillAmount).to.be.bignumber.equal(fillAmount);
            });
        });
        describe('orders are completely fillable', () => {
            // generate three signed orders each with 10 units of makerAsset, 30 total
            const makerAssetAmount = new BigNumber(10);
            const inputOrders = testOrderFactory.generateTestSignedOrders(
                {
                    makerAssetAmount,
                },
                3,
            );
            it('returns input orders and zero remainingFillAmount when input exactly matches requested fill amount', async () => {
                // try to fill 20 units of makerAsset
                // include 10 units of slippageBufferAmount
                const fillAmount = new BigNumber(20);
                const slippageBufferAmount = new BigNumber(10);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                    {
                        slippageBufferAmount,
                    },
                );
                expect(resultOrders).to.be.deep.equal(inputOrders);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('returns input orders and zero remainingFillAmount when input has more than requested fill amount', async () => {
                // try to fill 15 units of makerAsset
                // include 10 units of slippageBufferAmount
                const fillAmount = new BigNumber(15);
                const slippageBufferAmount = new BigNumber(10);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                    {
                        slippageBufferAmount,
                    },
                );
                expect(resultOrders).to.be.deep.equal(inputOrders);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('returns input orders and non-zero remainingFillAmount when input has less than requested fill amount', async () => {
                // try to fill 30 units of makerAsset
                // include 5 units of slippageBufferAmount
                const fillAmount = new BigNumber(30);
                const slippageBufferAmount = new BigNumber(5);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                    {
                        slippageBufferAmount,
                    },
                );
                expect(resultOrders).to.be.deep.equal(inputOrders);
                expect(remainingFillAmount).to.be.bignumber.equal(new BigNumber(5));
            });
            it('returns first order and zero remainingFillAmount when requested fill amount is exactly covered by the first order', async () => {
                // try to fill 10 units of makerAsset
                const fillAmount = new BigNumber(10);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
                    inputOrders,
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
                    fillAmount,
                );
                expect(resultOrders).to.be.deep.equal([inputOrders[0], inputOrders[1]]);
                expect(remainingFillAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
        });
        describe('orders are partially fillable', () => {
            // generate three signed orders each with 10 units of makerAsset, 30 total
            const makerAssetAmount = new BigNumber(10);
            const inputOrders = testOrderFactory.generateTestSignedOrders(
                {
                    makerAssetAmount,
                },
                3,
            );
            // generate remainingFillableMakerAssetAmounts that cover different partial fill scenarios
            // 1. order is completely filled already
            // 2. order is partially fillable
            // 3. order is completely fillable
            const remainingFillableMakerAssetAmounts = [constants.ZERO_AMOUNT, new BigNumber(5), makerAssetAmount];
            it('returns last two orders and non-zero remainingFillAmount when trying to fill original makerAssetAmounts', async () => {
                // try to fill 30 units of makerAsset
                const fillAmount = new BigNumber(30);
                const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
                    inputOrders,
                    fillAmount,
                    {
                        remainingFillableMakerAssetAmounts,
                    },
                );
                expect(resultOrders).to.be.deep.equal([inputOrders[1], inputOrders[2]]);
                expect(remainingFillAmount).to.be.bignumber.equal(new BigNumber(15));
            });
        });
    });
    describe('#findFeeOrdersThatCoverFeesForTargetOrders', () => {
        // generate three signed fee orders each with 10 units of ZRX, 30 total
        const zrxAmount = new BigNumber(10);
        const inputFeeOrders = testOrderFactory.generateTestSignedOrders(
            {
                makerAssetAmount: zrxAmount,
            },
            3,
        );
        describe('no target orders', () => {
            it('returns empty and zero remainingFeeAmount', async () => {
                const { resultFeeOrders, remainingFeeAmount } = marketUtils.findFeeOrdersThatCoverFeesForTargetOrders(
                    [],
                    inputFeeOrders,
                );
                expect(resultFeeOrders).to.be.empty;
                expect(remainingFeeAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
        });
        describe('no fee orders', () => {
            // generate three signed orders each with 10 units of makerAsset, 30 total
            // each signed order requires 10 units of takerFee
            const makerAssetAmount = new BigNumber(10);
            const takerFee = new BigNumber(10);
            const inputOrders = testOrderFactory.generateTestSignedOrders(
                {
                    makerAssetAmount,
                    takerFee,
                },
                3,
            );
            // generate remainingFillableMakerAssetAmounts that equal the makerAssetAmount
            const remainingFillableMakerAssetAmounts = [makerAssetAmount, makerAssetAmount, makerAssetAmount];
            it('returns empty and non-zero remainingFeeAmount', async () => {
                const { resultFeeOrders, remainingFeeAmount } = marketUtils.findFeeOrdersThatCoverFeesForTargetOrders(
                    inputOrders,
                    [],
                    {
                        remainingFillableMakerAssetAmounts,
                    },
                );
                expect(resultFeeOrders).to.be.empty;
                expect(remainingFeeAmount).to.be.bignumber.equal(new BigNumber(30));
            });
        });
        describe('target orders have no fees', () => {
            // generate three signed orders each with 10 units of makerAsset, 30 total
            const makerAssetAmount = new BigNumber(10);
            const inputOrders = testOrderFactory.generateTestSignedOrders(
                {
                    makerAssetAmount,
                },
                3,
            );
            it('returns empty and zero remainingFeeAmount', async () => {
                const { resultFeeOrders, remainingFeeAmount } = marketUtils.findFeeOrdersThatCoverFeesForTargetOrders(
                    inputOrders,
                    inputFeeOrders,
                );
                expect(resultFeeOrders).to.be.empty;
                expect(remainingFeeAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
        });
        describe('target orders require fees and are completely fillable', () => {
            // generate three signed orders each with 10 units of makerAsset, 30 total
            // each signed order requires 10 units of takerFee
            const makerAssetAmount = new BigNumber(10);
            const takerFee = new BigNumber(10);
            const inputOrders = testOrderFactory.generateTestSignedOrders(
                {
                    makerAssetAmount,
                    takerFee,
                },
                3,
            );
            it('returns input fee orders and zero remainingFeeAmount', async () => {
                const { resultFeeOrders, remainingFeeAmount } = marketUtils.findFeeOrdersThatCoverFeesForTargetOrders(
                    inputOrders,
                    inputFeeOrders,
                );
                expect(resultFeeOrders).to.be.deep.equal(inputFeeOrders);
                expect(remainingFeeAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
        });
        describe('target orders require fees and are partially fillable', () => {
            // generate three signed orders each with 10 units of makerAsset, 30 total
            // each signed order requires 10 units of takerFee
            const makerAssetAmount = new BigNumber(10);
            const takerFee = new BigNumber(10);
            const inputOrders = testOrderFactory.generateTestSignedOrders(
                {
                    makerAssetAmount,
                    takerFee,
                },
                3,
            );
            // generate remainingFillableMakerAssetAmounts that cover different partial fill scenarios
            // 1. order is completely filled already
            // 2. order is partially fillable
            // 3. order is completely fillable
            const remainingFillableMakerAssetAmounts = [constants.ZERO_AMOUNT, new BigNumber(5), makerAssetAmount];
            it('returns first two input fee orders and zero remainingFeeAmount', async () => {
                const { resultFeeOrders, remainingFeeAmount } = marketUtils.findFeeOrdersThatCoverFeesForTargetOrders(
                    inputOrders,
                    inputFeeOrders,
                    {
                        remainingFillableMakerAssetAmounts,
                    },
                );
                expect(resultFeeOrders).to.be.deep.equal([inputFeeOrders[0], inputFeeOrders[1]]);
                expect(remainingFeeAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
        });
        describe('target orders require more fees than available', () => {
            // generate three signed orders each with 10 units of makerAsset, 30 total
            // each signed order requires 20 units of takerFee
            const makerAssetAmount = new BigNumber(10);
            const takerFee = new BigNumber(20);
            const inputOrders = testOrderFactory.generateTestSignedOrders(
                {
                    makerAssetAmount,
                    takerFee,
                },
                3,
            );
            it('returns input fee orders and non-zero remainingFeeAmount', async () => {
                const { resultFeeOrders, remainingFeeAmount } = marketUtils.findFeeOrdersThatCoverFeesForTargetOrders(
                    inputOrders,
                    inputFeeOrders,
                );
                expect(resultFeeOrders).to.be.deep.equal(inputFeeOrders);
                expect(remainingFeeAmount).to.be.bignumber.equal(new BigNumber(30));
            });
        });
    });
});
