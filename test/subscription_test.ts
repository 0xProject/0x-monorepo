import 'mocha';
import * as chai from 'chai';
import * as Sinon from 'sinon';
import {chaiSetup} from './utils/chai_setup';
import * as Web3 from 'web3';
import BigNumber from 'bignumber.js';
import promisify = require('es6-promisify');
import {web3Factory} from './utils/web3_factory';
import {
    ZeroEx,
    ZeroExError,
    Token,
    SubscriptionOpts,
    TokenEvents,
    ContractEvent,
    TransferContractEventArgs,
    ApprovalContractEventArgs,
    TokenContractEventArgs,
    LogWithDecodedArgs,
    LogEvent,
} from '../src';
import {BlockchainLifecycle} from './utils/blockchain_lifecycle';
import {TokenUtils} from './utils/token_utils';
import {DoneCallback, BlockParamLiteral} from '../src/types';

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
    before(async () => {
        web3 = web3Factory.create();
        zeroEx = new ZeroEx(web3.currentProvider);
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
        before(() => {
            const token = tokens[0];
            tokenAddress = token.address;
        });
        afterEach(() => {
            zeroEx.token.unsubscribeAll();
        });
        it('Should receive the Error when an error occurs', (done: DoneCallback) => {
            (async () => {
                const callback = (err: Error, logEvent: LogEvent<ApprovalContractEventArgs>) => {
                    expect(err).to.not.be.undefined();
                    expect(logEvent).to.be.undefined();
                    done();
                };
                Sinon.stub((zeroEx as any)._web3Wrapper, 'getBlockAsync')
                 .throws("JSON RPC error")
                zeroEx.token.subscribe(
                    tokenAddress, TokenEvents.Approval, indexFilterValues, callback);
                await zeroEx.token.setAllowanceAsync(tokenAddress, coinbase, addressWithoutFunds, allowanceAmount);
            })().catch(done);
         });
        it('Should allow unsubscribeAll to be called multiple times', (done: DoneCallback) => {
            (async () => {
                const callback = (err: Error, logEvent: LogEvent<ApprovalContractEventArgs>) => { };
                zeroEx.token.subscribe(
                    tokenAddress, TokenEvents.Approval, indexFilterValues, callback);
                await zeroEx.token.setAllowanceAsync(tokenAddress, coinbase, addressWithoutFunds, allowanceAmount);
                zeroEx.token.unsubscribeAll();
                zeroEx.token.unsubscribeAll();
                done();
            })().catch(done);
         });
    })
  })