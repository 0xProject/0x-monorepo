import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';
import 'mocha';
import * as Sinon from 'sinon';
import * as Web3 from 'web3';

import { ApprovalContractEventArgs, DecodedLogEvent, Token, TokenEvents, ZeroEx } from '../src';
import { DoneCallback } from '../src/types';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';
import { assertNodeCallbackError } from './utils/report_callback_errors';
import { web3Factory } from './utils/web3_factory';

chaiSetup.configure();
const blockchainLifecycle = new BlockchainLifecycle(constants.RPC_URL);

describe('SubscriptionTest', () => {
    let web3: Web3;
    let zeroEx: ZeroEx;
    let userAddresses: string[];
    let tokens: Token[];
    let coinbase: string;
    let addressWithoutFunds: string;
    const config = {
        networkId: constants.TESTRPC_NETWORK_ID,
    };
    before(async () => {
        web3 = web3Factory.create();
        zeroEx = new ZeroEx(web3.currentProvider, config);
        userAddresses = await zeroEx.getAvailableAddressesAsync();
        tokens = await zeroEx.tokenRegistry.getTokensAsync();
        coinbase = userAddresses[0];
        addressWithoutFunds = userAddresses[1];
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('#subscribe', () => {
        const indexFilterValues = {};
        let tokenAddress: string;
        const allowanceAmount = new BigNumber(42);
        let stubs: Sinon.SinonStub[] = [];
        before(() => {
            const token = tokens[0];
            tokenAddress = token.address;
        });
        afterEach(() => {
            zeroEx.token.unsubscribeAll();
            _.each(stubs, s => s.restore());
            stubs = [];
        });
        it('Should receive the Error when an error occurs while fetching the block', (done: DoneCallback) => {
            (async () => {
                const errMsg = 'Error fetching block';
                const callback = assertNodeCallbackError(done, errMsg);
                stubs = [Sinon.stub((zeroEx as any)._web3Wrapper, 'getBlockAsync').throws(new Error(errMsg))];
                zeroEx.token.subscribe(tokenAddress, TokenEvents.Approval, indexFilterValues, callback);
                await zeroEx.token.setAllowanceAsync(tokenAddress, coinbase, addressWithoutFunds, allowanceAmount);
            })().catch(done);
        });
        it('Should receive the Error when an error occurs while reconciling the new block', (done: DoneCallback) => {
            (async () => {
                const errMsg = 'Error fetching logs';
                const callback = assertNodeCallbackError(done, errMsg);
                stubs = [Sinon.stub((zeroEx as any)._web3Wrapper, 'getLogsAsync').throws(new Error(errMsg))];
                zeroEx.token.subscribe(tokenAddress, TokenEvents.Approval, indexFilterValues, callback);
                await zeroEx.token.setAllowanceAsync(tokenAddress, coinbase, addressWithoutFunds, allowanceAmount);
            })().catch(done);
        });
        it('Should allow unsubscribeAll to be called successfully after an error', (done: DoneCallback) => {
            (async () => {
                const callback = (err: Error | null, logEvent?: DecodedLogEvent<ApprovalContractEventArgs>) => _.noop;
                zeroEx.token.subscribe(tokenAddress, TokenEvents.Approval, indexFilterValues, callback);
                stubs = [Sinon.stub((zeroEx as any)._web3Wrapper, 'getBlockAsync').throws(new Error('JSON RPC error'))];
                zeroEx.token.unsubscribeAll();
                done();
            })().catch(done);
        });
    });
});
