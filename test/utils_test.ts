import { orderFactory } from '@0x/order-utils/lib/src/order_factory';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import 'mocha';

import { constants } from '../src/constants';
import { utils } from '../src/utils/utils';

import { chaiSetup } from './utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

const TOKEN_DECIMALS = 18;
const WETH_DECIMALS = constants.ETHER_TOKEN_DECIMALS;

const baseUnitAmount = (unitAmount: number, decimals = TOKEN_DECIMALS): BigNumber => {
    return Web3Wrapper.toBaseUnitAmount(new BigNumber(unitAmount), decimals);
};

// tslint:disable:custom-no-magic-numbers
describe('utils', () => {
    // orders
    const sellTwoTokensFor1Weth: SignedOrder = orderFactory.createSignedOrderFromPartial({
        makerAssetAmount: baseUnitAmount(2),
        takerAssetAmount: baseUnitAmount(1, WETH_DECIMALS),
    });
    const sellTenTokensFor10Weth: SignedOrder = orderFactory.createSignedOrderFromPartial({
        makerAssetAmount: baseUnitAmount(10),
        takerAssetAmount: baseUnitAmount(10, WETH_DECIMALS),
    });
    const sellTwoTokensFor1WethWithTwoTokenFee: SignedOrder = orderFactory.createSignedOrderFromPartial({
        makerAssetAmount: baseUnitAmount(2),
        takerAssetAmount: baseUnitAmount(1, WETH_DECIMALS),
        takerFee: baseUnitAmount(2),
    });
    const sellTenTokensFor1WethWithFourTokenFee: SignedOrder = orderFactory.createSignedOrderFromPartial({
        makerAssetAmount: baseUnitAmount(2),
        takerAssetAmount: baseUnitAmount(1, WETH_DECIMALS),
        takerFee: baseUnitAmount(4),
    });
    describe('isFeeOrdersRequiredToFillOrders', async () => {
        it('should return true if ordersAndFillableAmounts is completed unfilled and has fees', () => {
            const ordersAndFillableAmounts = {
                orders: [sellTwoTokensFor1WethWithTwoTokenFee, sellTenTokensFor1WethWithFourTokenFee],
                remainingFillableMakerAssetAmounts: [baseUnitAmount(1), baseUnitAmount(10)],
            };
            const isFeeOrdersRequired = utils.isFeeOrdersRequiredToFillOrders(ordersAndFillableAmounts);
            expect(isFeeOrdersRequired).to.equal(true);
        });
        it('should return true if ordersAndFillableAmounts is partially unfilled and has fees', () => {
            const ordersAndFillableAmounts = {
                orders: [sellTwoTokensFor1WethWithTwoTokenFee, sellTenTokensFor1WethWithFourTokenFee],
                remainingFillableMakerAssetAmounts: [baseUnitAmount(0), baseUnitAmount(5)],
            };
            const isFeeOrdersRequired = utils.isFeeOrdersRequiredToFillOrders(ordersAndFillableAmounts);
            expect(isFeeOrdersRequired).to.equal(true);
        });
        it('should return false if ordersAndFillableAmounts is completed filled and has fees', () => {
            const ordersAndFillableAmounts = {
                orders: [sellTwoTokensFor1WethWithTwoTokenFee, sellTenTokensFor1WethWithFourTokenFee],
                remainingFillableMakerAssetAmounts: [baseUnitAmount(0), baseUnitAmount(0)],
            };
            const isFeeOrdersRequired = utils.isFeeOrdersRequiredToFillOrders(ordersAndFillableAmounts);
            expect(isFeeOrdersRequired).to.equal(false);
        });
        it('should return false if ordersAndFillableAmounts is completely unfilled and doesn\'t have fees', () => {
            const ordersAndFillableAmounts = {
                orders: [sellTwoTokensFor1Weth, sellTenTokensFor10Weth],
                remainingFillableMakerAssetAmounts: [baseUnitAmount(1), baseUnitAmount(10)],
            };
            const isFeeOrdersRequired = utils.isFeeOrdersRequiredToFillOrders(ordersAndFillableAmounts);
            expect(isFeeOrdersRequired).to.equal(false);
        });
    });
});
