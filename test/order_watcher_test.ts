import 'mocha';
import * as chai from 'chai';
import * as _ from 'lodash';
import * as Sinon from 'sinon';
import * as Web3 from 'web3';
import BigNumber from 'bignumber.js';
import {chaiSetup} from './utils/chai_setup';
import {web3Factory} from './utils/web3_factory';
import {Web3Wrapper} from '../src/web3_wrapper';
import {OrderStateWatcher} from '../src/mempool/order_state_watcher';
import {
    Token,
    ZeroEx,
    LogEvent,
    DecodedLogEvent,
    OrderState,
    OrderStateValid,
} from '../src';
import {TokenUtils} from './utils/token_utils';
import {FillScenarios} from './utils/fill_scenarios';
import {DoneCallback} from '../src/types';

chaiSetup.configure();
const expect = chai.expect;

describe('EventWatcher', () => {
    let web3: Web3;
    let stubs: Sinon.SinonStub[] = [];
    let zeroEx: ZeroEx;
    let tokens: Token[];
    let tokenUtils: TokenUtils;
    let fillScenarios: FillScenarios;
    let userAddresses: string[];
    let zrxTokenAddress: string;
    let exchangeContractAddress: string;
    let makerToken: Token;
    let takerToken: Token;
    let maker: string;
    let taker: string;
    let web3Wrapper: Web3Wrapper;
    const fillableAmount = new BigNumber(5);
    const fakeLog = {
        address: '0xcdb594a32b1cc3479d8746279712c39d18a07fc0',
        blockHash: '0x2d5cec6e3239d40993b74008f684af82b69f238697832e4c4d58e0ba5a2fa99e',
        blockNumber: '0x34',
        data: '0x0000000000000000000000000000000000000000000000000000000000000028',
        logIndex: '0x00',
        topics: [
            '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
            '0x0000000000000000000000006ecbe1db9ef729cbe972c83fb886247691fb6beb',
            '0x000000000000000000000000871dd7c2b4b25e1aa18728e9d5f2af4c4e431f5c',
        ],
        transactionHash: '0xa550fbe937985c383ed7ed077cf6011960a3c2d38ea39dea209426546f0e95cb',
        transactionIndex: '0x00',
        type: 'mined',
    };
    before(async () => {
        web3 = web3Factory.create();
        zeroEx = new ZeroEx(web3.currentProvider);
        exchangeContractAddress = await zeroEx.exchange.getContractAddressAsync();
        userAddresses = await zeroEx.getAvailableAddressesAsync();
        [, maker, taker] = userAddresses;
        tokens = await zeroEx.tokenRegistry.getTokensAsync();
        tokenUtils = new TokenUtils(tokens);
        zrxTokenAddress = tokenUtils.getProtocolTokenOrThrow().address;
        fillScenarios = new FillScenarios(zeroEx, userAddresses, tokens, zrxTokenAddress, exchangeContractAddress);
        [makerToken, takerToken] = tokenUtils.getNonProtocolTokens();
        web3Wrapper = (zeroEx as any)._web3Wrapper;
    });
    beforeEach(() => {
        const getLogsStub = Sinon.stub(web3Wrapper, 'getLogsAsync');
        getLogsStub.onCall(0).returns([fakeLog]);
    });
    afterEach(() => {
        // clean up any stubs after the test has completed
        _.each(stubs, s => s.restore());
        stubs = [];
        zeroEx.orderStateWatcher.unsubscribe();
    });
    it('should receive OrderState when order state is changed', (done: DoneCallback) => {
        (async () => {
            const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerToken.address, takerToken.address, maker, taker, fillableAmount,
            );
            const orderHash = ZeroEx.getOrderHashHex(signedOrder);
            zeroEx.orderStateWatcher.addOrder(signedOrder);
            const callback = (orderState: OrderState) => {
                expect(orderState.isValid).to.be.true();
                expect(orderState.orderHash).to.be.equal(orderHash);
                const orderRelevantState = (orderState as OrderStateValid).orderRelevantState;
                expect(orderRelevantState.makerBalance).to.be.bignumber.equal(fillableAmount);
                expect(orderRelevantState.makerProxyAllowance).to.be.bignumber.equal(fillableAmount);
                expect(orderRelevantState.makerFeeBalance).to.be.bignumber.equal(0);
                expect(orderRelevantState.makerFeeProxyAllowance).to.be.bignumber.equal(0);
                expect(orderRelevantState.filledTakerTokenAmount).to.be.bignumber.equal(0);
                expect(orderRelevantState.canceledTakerTokenAmount).to.be.bignumber.equal(0);
                done();
            };
            zeroEx.orderStateWatcher.subscribe(callback);
        })().catch(done);
    });
});
