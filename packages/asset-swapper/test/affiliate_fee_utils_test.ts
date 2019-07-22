import { MarketOperation } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { constants } from '../src/constants';
import { affiliateFeeUtils } from '../src/utils/affiliate_fee_utils';

import { chaiSetup } from './utils/chai_setup';
import { getFullyFillableSwapQuoteWithFees, getFullyFillableSwapQuoteWithNoFees, getPartialSignedOrdersWithFees, getPartialSignedOrdersWithNoFees } from './utils/swap_quote';

chaiSetup.configure();
const expect = chai.expect;

const FAKE_TAKER_ASSET_DATA = '0xf47261b00000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c48';
const FAKE_MAKER_ASSET_DATA = '0xf47261b00000000000000000000000009f5B0C7e1623793bF0620569b9749e79DF6D0bC5';
const NULL_ADDRESS = constants.NULL_ADDRESS;
const FEE_PERCENTAGE = 0.1;
const FILLABLE_AMOUNTS = [new BigNumber(2), new BigNumber(3), new BigNumber(5)];
const FILLABLE_FEE_AMOUNTS = [new BigNumber(1), new BigNumber(1), new BigNumber(1)];
const MARKET_OPERATION = MarketOperation.Sell;

describe('affiliateFeeUtils', () => {
    const fakeFeeOrders = getPartialSignedOrdersWithNoFees(
        FAKE_MAKER_ASSET_DATA,
        FAKE_TAKER_ASSET_DATA,
        NULL_ADDRESS,
        NULL_ADDRESS,
        FILLABLE_FEE_AMOUNTS,
    );
    const fakeOrders = getPartialSignedOrdersWithNoFees(
        FAKE_MAKER_ASSET_DATA,
        FAKE_TAKER_ASSET_DATA,
        NULL_ADDRESS,
        NULL_ADDRESS,
        FILLABLE_AMOUNTS,
    );

    const fakeOrdersWithFees = getPartialSignedOrdersWithFees(
        FAKE_MAKER_ASSET_DATA,
        FAKE_TAKER_ASSET_DATA,
        NULL_ADDRESS,
        NULL_ADDRESS,
        FILLABLE_AMOUNTS,
        FILLABLE_FEE_AMOUNTS,
    );

    const fakeSwapQuote = getFullyFillableSwapQuoteWithNoFees(
        FAKE_MAKER_ASSET_DATA,
        FAKE_TAKER_ASSET_DATA,
        fakeOrders,
        MARKET_OPERATION,
    );

    const fakeSwapQuoteWithFees = getFullyFillableSwapQuoteWithFees(
        FAKE_MAKER_ASSET_DATA,
        FAKE_TAKER_ASSET_DATA,
        fakeOrdersWithFees,
        fakeFeeOrders,
        MARKET_OPERATION,
    );

    describe('getSwapQuoteWithAffiliateFee', () => {
            it('should return unchanged swapQuote if feePercentage is 0', () => {
                const updatedSwapQuote = affiliateFeeUtils.getSwapQuoteWithAffiliateFee(fakeSwapQuote, 0);
                const fakeSwapQuoteWithAffiliateFees = { ...fakeSwapQuote, ...{ feePercentage: 0 }};
                expect(updatedSwapQuote).to.deep.equal(fakeSwapQuoteWithAffiliateFees);
            });
            it('should return correct feeTakerToken and totalTakerToken amounts when provided SwapQuote with no fees', () => {
                const updatedSwapQuote = affiliateFeeUtils.getSwapQuoteWithAffiliateFee(fakeSwapQuote, FEE_PERCENTAGE);
                expect(updatedSwapQuote.bestCaseQuoteInfo.feeTakerTokenAmount).to.deep.equal(new BigNumber(1));
                expect(updatedSwapQuote.bestCaseQuoteInfo.totalTakerTokenAmount).to.deep.equal(new BigNumber(11));
                expect(updatedSwapQuote.worstCaseQuoteInfo.feeTakerTokenAmount).to.deep.equal(new BigNumber(1));
                expect(updatedSwapQuote.worstCaseQuoteInfo.totalTakerTokenAmount).to.deep.equal(new BigNumber(11));
            });
            it('should return correct feeTakerToken and totalTakerToken amounts when provides SwapQuote with fees', () => {
                const updatedSwapQuote = affiliateFeeUtils.getSwapQuoteWithAffiliateFee(fakeSwapQuoteWithFees, FEE_PERCENTAGE);
                expect(updatedSwapQuote.bestCaseQuoteInfo.feeTakerTokenAmount).to.deep.equal(new BigNumber(4));
                expect(updatedSwapQuote.bestCaseQuoteInfo.totalTakerTokenAmount).to.deep.equal(new BigNumber(14));
                expect(updatedSwapQuote.worstCaseQuoteInfo.feeTakerTokenAmount).to.deep.equal(new BigNumber(4));
                expect(updatedSwapQuote.worstCaseQuoteInfo.totalTakerTokenAmount).to.deep.equal(new BigNumber(14));
            });
    });
});
