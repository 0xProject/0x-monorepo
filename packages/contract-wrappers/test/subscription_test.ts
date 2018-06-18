import { BlockchainLifecycle, callbackErrorReporter } from '@0xproject/dev-utils';
import { DoneCallback } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';
import 'make-promises-safe';
import 'mocha';
import * as Sinon from 'sinon';

import { ApprovalContractEventArgs, ContractWrappers, DecodedLogEvent, Token, TokenEvents } from '../src';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('SubscriptionTest', () => {
    let contractWrappers: ContractWrappers;
    let userAddresses: string[];
    let tokens: Token[];
    let coinbase: string;
    let addressWithoutFunds: string;
    const config = {
        networkId: constants.TESTRPC_NETWORK_ID,
    };
    before(async () => {
        contractWrappers = new ContractWrappers(provider, config);
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
        tokens = await contractWrappers.tokenRegistry.getTokensAsync();
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
            contractWrappers.token.unsubscribeAll();
            _.each(stubs, s => s.restore());
            stubs = [];
        });
        it('Should receive the Error when an error occurs while fetching the block', (done: DoneCallback) => {
            (async () => {
                const errMsg = 'Error fetching block';
                const callback = callbackErrorReporter.assertNodeCallbackError(done, errMsg);
                stubs = [Sinon.stub((contractWrappers as any)._web3Wrapper, 'getBlockAsync').throws(new Error(errMsg))];
                contractWrappers.token.subscribe(tokenAddress, TokenEvents.Approval, indexFilterValues, callback);
                await contractWrappers.token.setAllowanceAsync(
                    tokenAddress,
                    coinbase,
                    addressWithoutFunds,
                    allowanceAmount,
                );
            })().catch(done);
        });
        it('Should receive the Error when an error occurs while reconciling the new block', (done: DoneCallback) => {
            (async () => {
                const errMsg = 'Error fetching logs';
                const callback = callbackErrorReporter.assertNodeCallbackError(done, errMsg);
                stubs = [Sinon.stub((contractWrappers as any)._web3Wrapper, 'getLogsAsync').throws(new Error(errMsg))];
                contractWrappers.token.subscribe(tokenAddress, TokenEvents.Approval, indexFilterValues, callback);
                await contractWrappers.token.setAllowanceAsync(
                    tokenAddress,
                    coinbase,
                    addressWithoutFunds,
                    allowanceAmount,
                );
            })().catch(done);
        });
        it('Should allow unsubscribeAll to be called successfully after an error', (done: DoneCallback) => {
            (async () => {
                const callback = (err: Error | null, logEvent?: DecodedLogEvent<ApprovalContractEventArgs>) => _.noop;
                contractWrappers.token.subscribe(tokenAddress, TokenEvents.Approval, indexFilterValues, callback);
                stubs = [
                    Sinon.stub((contractWrappers as any)._web3Wrapper, 'getBlockAsync').throws(
                        new Error('JSON RPC error'),
                    ),
                ];
                contractWrappers.token.unsubscribeAll();
                done();
            })().catch(done);
        });
    });
});
