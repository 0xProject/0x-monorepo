import { BlockchainLifecycle, callbackErrorReporter } from '@0xproject/dev-utils';
import { FillScenarios } from '@0xproject/fill-scenarios';
import { assetDataUtils, orderHashUtils } from '@0xproject/order-utils';
import { DoneCallback, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import { BlockParamLiteral } from 'ethereum-types';
import 'mocha';

import {
    ContractWrappers,
    DecodedLogEvent,
    ExchangeCancelEventArgs,
    ExchangeEvents,
    ExchangeFillEventArgs,
    OrderStatus,
} from '../src';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';
import { tokenUtils } from './utils/token_utils';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('ForwarderWrapper', () => {
    let contractWrappers: ContractWrappers;
    let forwarderContractAddress: string;
    let userAddresses: string[];
    const config = {
        networkId: constants.TESTRPC_NETWORK_ID,
        blockPollingIntervalMs: 0,
    };
    before(async () => {
        await blockchainLifecycle.startAsync();
        contractWrappers = new ContractWrappers(provider, config);
        forwarderContractAddress = contractWrappers.exchange.getContractAddress();
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    // describe('#fillOrderAsync', () => {
    //     it('should fill a valid order', async () => {
    //         // txHash = await contractWrappers.exchange.fillOrderAsync(signedOrder, takerTokenFillAmount, takerAddress);
    //         // await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
    //     });
    // });
});
