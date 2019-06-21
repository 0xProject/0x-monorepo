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
import {
    mockAvailableMakerAssetDatas,
    mockAvailableTakerAssetDatas,
    mockedSwapQuoterWithOrdersAndFillableAmounts,
    orderProviderMock,
} from './utils/mocks';

chaiSetup.configure();
const expect = chai.expect;

describe('affiliateFeeUtils', () => {

});
