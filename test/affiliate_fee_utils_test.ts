// import { SignedOrder } from '@0x/types';
// import { BigNumber } from '@0x/utils';
// import * as chai from 'chai';
// import 'mocha';
// import * as TypeMoq from 'typemoq';

// import { constants } from '../src/constants';
// import { } from '../src/types';
// import { affiliateFeeUtils } from '../src/utils/affiliate_fee_utils';

// import { chaiSetup } from './utils/chai_setup';
// import { getDummySwapQuotesWithNoFees } from './utils/swap_quote';

// chaiSetup.configure();
// const expect = chai.expect;

// const FAKE_TAKER_ASSET_DATA = '0xf47261b00000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c48';
// const FAKE_MAKER_ASSET_DATA = '0xf47261b00000000000000000000000009f5B0C7e1623793bF0620569b9749e79DF6D0bC5';
// const NULL_ADDRESS = constants.NULL_ADDRESS;
// const FEE_PERCENTAGE = 0.05;

// describe('affiliateFeeUtils', () => {
//     const dummySwapQuotes = getDummySwapQuotesWithNoFees(FAKE_MAKER_ASSET_DATA, FAKE_TAKER_ASSET_DATA, NULL_ADDRESS);

//     describe('getSwapQuoteWithAffiliateFee', () => {
//         it('should return unchanged swapQuote if feePercentage is 0', () => {
//             const updatedSwapQuote = affiliateFeeUtils.getSwapQuoteWithAffiliateFee(dummySwapQuotes.fullyFilled, 0);
//             expect(updatedSwapQuote).to.deep.equal(dummySwapQuotes.fullyFilled);
//         });
//         it('should return correct feeTakerToken and totalTakerToken amounts when provides SwapQuote with no fees', () => {
//             const updatedSwapQuote = affiliateFeeUtils.getSwapQuoteWithAffiliateFee(dummySwapQuotes.partiallyFilled, FEE_PERCENTAGE);

//         });
//         it('should return correct feeTakerToken and totalTakerToken amounts when provides SwapQuote with fees', () => {

//         });
//     });
// });
