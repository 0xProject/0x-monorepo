import BigNumber from 'bignumber.js';
import * as chai from 'chai';
import promisify = require('es6-promisify');
import * as _ from 'lodash';
import 'mocha';
import * as Sinon from 'sinon';
import * as Web3 from 'web3';

import {
    ApprovalContractEventArgs,
    DecodedLogEvent,
    Token,
    TokenEvents,
    ZeroEx,
    ZeroExError,
} from '../src';
import {BlockParamLiteral, DoneCallback} from '../src/types';

import {BlockchainLifecycle} from './utils/blockchain_lifecycle';
import {chaiSetup} from './utils/chai_setup';
import {constants} from './utils/constants';
import {TokenUtils} from './utils/token_utils';
import {web3Factory} from './utils/web3_factory';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle();

describe('SubscriptionTest', () => {
    let web3: Web3;
    let zeroEx: ZeroEx;
    let userAddresses: string[];
    let tokens: Token[];
    let tokenUtils: TokenUtils;
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
        tokenUtils = new TokenUtils(tokens);
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
        const shouldThrowOnInsufficientBalanceOrAllowance = true;
        let tokenAddress: string;
        const transferAmount = new BigNumber(42);
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
        it('Should receive the Error when an error occurs', (done: DoneCallback) => {
            (async () => {
                const callback = (err: Error, logEvent: DecodedLogEvent<ApprovalContractEventArgs>) => {
                    expect(err).to.not.be.null();
                    expect(logEvent).to.be.undefined();
                    done();
                };
                stubs = [
                  Sinon.stub((zeroEx as any)._web3Wrapper, 'getBlockAsync')
                   .throws('JSON RPC error'),
                ];
                zeroEx.token.subscribe(
                    tokenAddress, TokenEvents.Approval, indexFilterValues, callback);
                await zeroEx.token.setAllowanceAsync(tokenAddress, coinbase, addressWithoutFunds, allowanceAmount);
            })().catch(done);
         });
        it('Should allow unsubscribeAll to be called successfully after an error', (done: DoneCallback) => {
            (async () => {
                const callback = (err: Error, logEvent: DecodedLogEvent<ApprovalContractEventArgs>) => _.noop;
                zeroEx.token.subscribe(
                    tokenAddress, TokenEvents.Approval, indexFilterValues, callback);
                stubs = [
                  Sinon.stub((zeroEx as any)._web3Wrapper, 'getBlockAsync')
                   .throws('JSON RPC error'),
                ];
                zeroEx.token.unsubscribeAll();
                done();
            })().catch(done);
         });
    });
});
