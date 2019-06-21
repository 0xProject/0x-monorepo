import { orderFactory } from '@0x/order-utils/lib/src/order_factory';
import { Web3ProviderEngine } from '@0x/subproviders';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import 'mocha';
import * as TypeMoq from 'typemoq';

import { SwapQuoter } from '../src';
import { constants } from '../src/constants';
import { LiquidityForAssetData, OrderProvider, OrdersAndFillableAmounts } from '../src/types';

import { chaiSetup } from './utils/chai_setup';
import { getFullyFillableSwapQuoteWithNoFees, getSignedOrdersWithNoFees } from './utils/swap_quote';

chaiSetup.configure();
const expect = chai.expect;

const FAKE_TAKER_ASSET_DATA = '0xf47261b00000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c48';
const FAKE_MAKER_ASSET_DATA = '0xf47261b00000000000000000000000009f5B0C7e1623793bF0620569b9749e79DF6D0bC5';
const FAKE_FILLABLE_AMOUNTS = [new BigNumber(5), new BigNumber(1), new BigNumber(4)];
const NULL_ADDRESS = constants.NULL_ADDRESS;

describe('affiliateFeeUtils', () => {
    const signedOrders = getSignedOrdersWithNoFees(
        FAKE_MAKER_ASSET_DATA,
        FAKE_TAKER_ASSET_DATA,
        NULL_ADDRESS,
        NULL_ADDRESS,
        FAKE_FILLABLE_AMOUNTS,
        );
    const swapQuote = getFullyFillableSwapQuoteWithNoFees(FAKE_MAKER_ASSET_DATA, FAKE_TAKER_ASSET_DATA, signedOrders);

    describe('getSwapQuoteWithAffiliateFee', () => {
        it('should return unchanged swapQuote if feePercentage is 0', () => {

        });
    });
});
