import {
    LogCancelContractEventArgs,
    LogErrorContractEventArgs,
    LogFillContractEventArgs,
    LogWithDecodedArgs,
    TransactionReceiptWithDecodedLogs,
    ZeroEx,
} from '0x.js';
import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import ethUtil = require('ethereumjs-util');
import * as Web3 from 'web3';

import { DummyTokenContract } from '../../src/contract_wrappers/generated/dummy_token';
import { ExchangeContract } from '../../src/contract_wrappers/generated/exchange';
import { TokenTransferProxyContract } from '../../src/contract_wrappers/generated/token_transfer_proxy';
import { Balances } from '../../util/balances';
import { constants } from '../../util/constants';
import { crypto } from '../../util/crypto';
import { ExchangeWrapper } from '../../util/exchange_wrapper';
import { Order } from '../../util/order';
import { OrderFactory } from '../../util/order_factory';
import { BalancesByOwner, ContractName, ExchangeContractErrs } from '../../util/types';
import { chaiSetup } from '../utils/chai_setup';
import { deployer } from '../utils/deployer';

chaiSetup.configure();
const expect = chai.expect;
const web3 = web3Factory.create();
const web3Wrapper = new Web3Wrapper(web3.currentProvider);
const blockchainLifecycle = new BlockchainLifecycle();

describe('Exchange', () => {
    let maker: string;
    let tokenOwner: string;
    let taker: string;
    let feeRecipient: string;
    const INITIAL_BALANCE = ZeroEx.toBaseUnitAmount(new BigNumber(10000), 18);
    const INITIAL_ALLOWANCE = ZeroEx.toBaseUnitAmount(new BigNumber(10000), 18);

    let rep: DummyTokenContract;
    let dgd: DummyTokenContract;
    let zrx: DummyTokenContract;
    let exchange: ExchangeContract;
    let tokenTransferProxy: TokenTransferProxyContract;

    let order: Order;
    let balances: BalancesByOwner;
    let exWrapper: ExchangeWrapper;
    let dmyBalances: Balances;
    let orderFactory: OrderFactory;

    let zeroEx: ZeroEx;

    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        maker = accounts[0];
        [tokenOwner, taker, feeRecipient] = accounts;
        const [repInstance, dgdInstance, zrxInstance] = await Promise.all([
            deployer.deployAsync(ContractName.DummyToken),
            deployer.deployAsync(ContractName.DummyToken),
            deployer.deployAsync(ContractName.DummyToken),
        ]);
        rep = new DummyTokenContract(repInstance);
        dgd = new DummyTokenContract(dgdInstance);
        zrx = new DummyTokenContract(zrxInstance);
        const tokenTransferProxyInstance = await deployer.deployAsync(ContractName.TokenTransferProxy);
        tokenTransferProxy = new TokenTransferProxyContract(tokenTransferProxyInstance);
        const exchangeInstance = await deployer.deployAsync(ContractName.Exchange, [
            zrx.address,
            tokenTransferProxy.address,
        ]);
        exchange = new ExchangeContract(exchangeInstance);
        await tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, { from: accounts[0] });
        zeroEx = new ZeroEx(web3.currentProvider, {
            exchangeContractAddress: exchange.address,
            networkId: constants.TESTRPC_NETWORK_ID,
        });
        exWrapper = new ExchangeWrapper(exchange, zeroEx);

        const defaultOrderParams = {
            exchangeContractAddress: exchange.address,
            maker,
            feeRecipient,
            makerToken: rep.address,
            takerToken: dgd.address,
            makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
            takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
            makerFee: ZeroEx.toBaseUnitAmount(new BigNumber(1), 18),
            takerFee: ZeroEx.toBaseUnitAmount(new BigNumber(1), 18),
        };
        orderFactory = new OrderFactory(web3Wrapper, defaultOrderParams);
        dmyBalances = new Balances([rep, dgd, zrx], [maker, taker, feeRecipient]);
        await Promise.all([
            rep.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, {
                from: maker,
            }),
            rep.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, {
                from: taker,
            }),
            rep.setBalance.sendTransactionAsync(maker, INITIAL_BALANCE, { from: tokenOwner }),
            rep.setBalance.sendTransactionAsync(taker, INITIAL_BALANCE, { from: tokenOwner }),
            dgd.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, {
                from: maker,
            }),
            dgd.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, {
                from: taker,
            }),
            dgd.setBalance.sendTransactionAsync(maker, INITIAL_BALANCE, { from: tokenOwner }),
            dgd.setBalance.sendTransactionAsync(taker, INITIAL_BALANCE, { from: tokenOwner }),
            zrx.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, {
                from: maker,
            }),
            zrx.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, {
                from: taker,
            }),
            zrx.setBalance.sendTransactionAsync(maker, INITIAL_BALANCE, { from: tokenOwner }),
            zrx.setBalance.sendTransactionAsync(taker, INITIAL_BALANCE, { from: tokenOwner }),
        ]);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('internal functions', () => {
        it('should include transferViaTokenTransferProxy', () => {
            expect((exchange as any).transferViaTokenTransferProxy).to.be.undefined();
        });

        it('should include isTransferable', () => {
            expect((exchange as any).isTransferable).to.be.undefined();
        });

        it('should include getBalance', () => {
            expect((exchange as any).getBalance).to.be.undefined();
        });

        it('should include getAllowance', () => {
            expect((exchange as any).getAllowance).to.be.undefined();
        });
    });

    describe('fillOrder', () => {
        beforeEach(async () => {
            balances = await dmyBalances.getAsync();
            order = await orderFactory.newSignedOrderAsync();
        });

        it('should create an unfillable order', async () => {
            order = await orderFactory.newSignedOrderAsync({
                makerTokenAmount: new BigNumber(1001),
                takerTokenAmount: new BigNumber(3),
            });

            const filledTakerTokenAmountBefore = await zeroEx.exchange.getFilledTakerAmountAsync(
                order.getOrderHashHex(),
            );
            expect(filledTakerTokenAmountBefore).to.be.bignumber.equal(0);

            const fillTakerTokenAmount1 = new BigNumber(2);
            await exWrapper.fillOrderAsync(order, taker, {
                fillTakerTokenAmount: fillTakerTokenAmount1,
            });

            const filledTakerTokenAmountAfter1 = await zeroEx.exchange.getFilledTakerAmountAsync(
                order.getOrderHashHex(),
            );
            expect(filledTakerTokenAmountAfter1).to.be.bignumber.equal(fillTakerTokenAmount1);

            const fillTakerTokenAmount2 = new BigNumber(1);
            await exWrapper.fillOrderAsync(order, taker, {
                fillTakerTokenAmount: fillTakerTokenAmount2,
            });

            const filledTakerTokenAmountAfter2 = await zeroEx.exchange.getFilledTakerAmountAsync(
                order.getOrderHashHex(),
            );
            expect(filledTakerTokenAmountAfter2).to.be.bignumber.equal(filledTakerTokenAmountAfter1);
        });

        it('should transfer the correct amounts when makerTokenAmount === takerTokenAmount', async () => {
            order = await orderFactory.newSignedOrderAsync({
                makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
                takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
            });

            const filledTakerTokenAmountBefore = await zeroEx.exchange.getFilledTakerAmountAsync(
                order.getOrderHashHex(),
            );
            expect(filledTakerTokenAmountBefore).to.be.bignumber.equal(0);

            const fillTakerTokenAmount = order.params.takerTokenAmount.div(2);
            await exWrapper.fillOrderAsync(order, taker, { fillTakerTokenAmount });

            const filledTakerTokenAmountAfter = await zeroEx.exchange.getFilledTakerAmountAsync(
                order.getOrderHashHex(),
            );
            expect(filledTakerTokenAmountAfter).to.be.bignumber.equal(fillTakerTokenAmount);

            const newBalances = await dmyBalances.getAsync();

            const fillMakerTokenAmount = fillTakerTokenAmount
                .times(order.params.makerTokenAmount)
                .dividedToIntegerBy(order.params.takerTokenAmount);
            const paidMakerFee = order.params.makerFee
                .times(fillMakerTokenAmount)
                .dividedToIntegerBy(order.params.makerTokenAmount);
            const paidTakerFee = order.params.takerFee
                .times(fillMakerTokenAmount)
                .dividedToIntegerBy(order.params.makerTokenAmount);
            expect(newBalances[maker][order.params.makerToken]).to.be.bignumber.equal(
                balances[maker][order.params.makerToken].minus(fillMakerTokenAmount),
            );
            expect(newBalances[maker][order.params.takerToken]).to.be.bignumber.equal(
                balances[maker][order.params.takerToken].add(fillTakerTokenAmount),
            );
            expect(newBalances[maker][zrx.address]).to.be.bignumber.equal(
                balances[maker][zrx.address].minus(paidMakerFee),
            );
            expect(newBalances[taker][order.params.takerToken]).to.be.bignumber.equal(
                balances[taker][order.params.takerToken].minus(fillTakerTokenAmount),
            );
            expect(newBalances[taker][order.params.makerToken]).to.be.bignumber.equal(
                balances[taker][order.params.makerToken].add(fillMakerTokenAmount),
            );
            expect(newBalances[taker][zrx.address]).to.be.bignumber.equal(
                balances[taker][zrx.address].minus(paidTakerFee),
            );
            expect(newBalances[feeRecipient][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipient][zrx.address].add(paidMakerFee.add(paidTakerFee)),
            );
        });

        it('should transfer the correct amounts when makerTokenAmount > takerTokenAmount', async () => {
            order = await orderFactory.newSignedOrderAsync({
                makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
                takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
            });

            const filledTakerTokenAmountBefore = await zeroEx.exchange.getFilledTakerAmountAsync(
                order.getOrderHashHex(),
            );
            expect(filledTakerTokenAmountBefore).to.be.bignumber.equal(0);

            const fillTakerTokenAmount = order.params.takerTokenAmount.div(2);
            await exWrapper.fillOrderAsync(order, taker, { fillTakerTokenAmount });

            const filledTakerTokenAmountAfter = await zeroEx.exchange.getFilledTakerAmountAsync(
                order.getOrderHashHex(),
            );
            expect(filledTakerTokenAmountAfter).to.be.bignumber.equal(fillTakerTokenAmount);

            const newBalances = await dmyBalances.getAsync();

            const fillMakerTokenAmount = fillTakerTokenAmount
                .times(order.params.makerTokenAmount)
                .dividedToIntegerBy(order.params.takerTokenAmount);
            const paidMakerFee = order.params.makerFee
                .times(fillMakerTokenAmount)
                .dividedToIntegerBy(order.params.makerTokenAmount);
            const paidTakerFee = order.params.takerFee
                .times(fillMakerTokenAmount)
                .dividedToIntegerBy(order.params.makerTokenAmount);
            expect(newBalances[maker][order.params.makerToken]).to.be.bignumber.equal(
                balances[maker][order.params.makerToken].minus(fillMakerTokenAmount),
            );
            expect(newBalances[maker][order.params.takerToken]).to.be.bignumber.equal(
                balances[maker][order.params.takerToken].add(fillTakerTokenAmount),
            );
            expect(newBalances[maker][zrx.address]).to.be.bignumber.equal(
                balances[maker][zrx.address].minus(paidMakerFee),
            );
            expect(newBalances[taker][order.params.takerToken]).to.be.bignumber.equal(
                balances[taker][order.params.takerToken].minus(fillTakerTokenAmount),
            );
            expect(newBalances[taker][order.params.makerToken]).to.be.bignumber.equal(
                balances[taker][order.params.makerToken].add(fillMakerTokenAmount),
            );
            expect(newBalances[taker][zrx.address]).to.be.bignumber.equal(
                balances[taker][zrx.address].minus(paidTakerFee),
            );
            expect(newBalances[feeRecipient][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipient][zrx.address].add(paidMakerFee.add(paidTakerFee)),
            );
        });

        it('should transfer the correct amounts when makerTokenAmount < takerTokenAmount', async () => {
            order = await orderFactory.newSignedOrderAsync({
                makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
                takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
            });

            const filledTakerTokenAmountBefore = await zeroEx.exchange.getFilledTakerAmountAsync(
                order.getOrderHashHex(),
            );
            expect(filledTakerTokenAmountBefore).to.be.bignumber.equal(0);

            const fillTakerTokenAmount = order.params.takerTokenAmount.div(2);
            await exWrapper.fillOrderAsync(order, taker, { fillTakerTokenAmount });

            const filledTakerTokenAmountAfter = await zeroEx.exchange.getFilledTakerAmountAsync(
                order.getOrderHashHex(),
            );
            expect(filledTakerTokenAmountAfter).to.be.bignumber.equal(fillTakerTokenAmount);

            const newBalances = await dmyBalances.getAsync();

            const fillMakerTokenAmount = fillTakerTokenAmount
                .times(order.params.makerTokenAmount)
                .dividedToIntegerBy(order.params.takerTokenAmount);
            const paidMakerFee = order.params.makerFee
                .times(fillMakerTokenAmount)
                .dividedToIntegerBy(order.params.makerTokenAmount);
            const paidTakerFee = order.params.takerFee
                .times(fillMakerTokenAmount)
                .dividedToIntegerBy(order.params.makerTokenAmount);
            expect(newBalances[maker][order.params.makerToken]).to.be.bignumber.equal(
                balances[maker][order.params.makerToken].minus(fillMakerTokenAmount),
            );
            expect(newBalances[maker][order.params.takerToken]).to.be.bignumber.equal(
                balances[maker][order.params.takerToken].add(fillTakerTokenAmount),
            );
            expect(newBalances[maker][zrx.address]).to.be.bignumber.equal(
                balances[maker][zrx.address].minus(paidMakerFee),
            );
            expect(newBalances[taker][order.params.takerToken]).to.be.bignumber.equal(
                balances[taker][order.params.takerToken].minus(fillTakerTokenAmount),
            );
            expect(newBalances[taker][order.params.makerToken]).to.be.bignumber.equal(
                balances[taker][order.params.makerToken].add(fillMakerTokenAmount),
            );
            expect(newBalances[taker][zrx.address]).to.be.bignumber.equal(
                balances[taker][zrx.address].minus(paidTakerFee),
            );
            expect(newBalances[feeRecipient][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipient][zrx.address].add(paidMakerFee.add(paidTakerFee)),
            );
        });

        it('should transfer the correct amounts when taker is specified and order is claimed by taker', async () => {
            order = await orderFactory.newSignedOrderAsync({
                taker,
                makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
                takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
            });

            const filledTakerTokenAmountBefore = await zeroEx.exchange.getFilledTakerAmountAsync(
                order.getOrderHashHex(),
            );
            expect(filledTakerTokenAmountBefore).to.be.bignumber.equal(0);

            const fillTakerTokenAmount = order.params.takerTokenAmount.div(2);
            await exWrapper.fillOrderAsync(order, taker, { fillTakerTokenAmount });

            const filledTakerTokenAmountAfter = await zeroEx.exchange.getFilledTakerAmountAsync(
                order.getOrderHashHex(),
            );
            const expectedFillAmountTAfter = fillTakerTokenAmount.add(filledTakerTokenAmountBefore);
            expect(filledTakerTokenAmountAfter).to.be.bignumber.equal(expectedFillAmountTAfter);

            const newBalances = await dmyBalances.getAsync();

            const fillMakerTokenAmount = fillTakerTokenAmount
                .times(order.params.makerTokenAmount)
                .dividedToIntegerBy(order.params.takerTokenAmount);
            const paidMakerFee = order.params.makerFee
                .times(fillMakerTokenAmount)
                .dividedToIntegerBy(order.params.makerTokenAmount);
            const paidTakerFee = order.params.takerFee
                .times(fillMakerTokenAmount)
                .dividedToIntegerBy(order.params.makerTokenAmount);
            expect(newBalances[maker][order.params.makerToken]).to.be.bignumber.equal(
                balances[maker][order.params.makerToken].minus(fillMakerTokenAmount),
            );
            expect(newBalances[maker][order.params.takerToken]).to.be.bignumber.equal(
                balances[maker][order.params.takerToken].add(fillTakerTokenAmount),
            );
            expect(newBalances[maker][zrx.address]).to.be.bignumber.equal(
                balances[maker][zrx.address].minus(paidMakerFee),
            );
            expect(newBalances[taker][order.params.takerToken]).to.be.bignumber.equal(
                balances[taker][order.params.takerToken].minus(fillTakerTokenAmount),
            );
            expect(newBalances[taker][order.params.makerToken]).to.be.bignumber.equal(
                balances[taker][order.params.makerToken].add(fillMakerTokenAmount),
            );
            expect(newBalances[taker][zrx.address]).to.be.bignumber.equal(
                balances[taker][zrx.address].minus(paidTakerFee),
            );
            expect(newBalances[feeRecipient][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipient][zrx.address].add(paidMakerFee.add(paidTakerFee)),
            );
        });

        it('should fill remaining value if fillTakerTokenAmount > remaining takerTokenAmount', async () => {
            const fillTakerTokenAmount = order.params.takerTokenAmount.div(2);
            await exWrapper.fillOrderAsync(order, taker, { fillTakerTokenAmount });

            const res = await exWrapper.fillOrderAsync(order, taker, {
                fillTakerTokenAmount: order.params.takerTokenAmount,
            });
            const log = res.logs[0] as LogWithDecodedArgs<LogFillContractEventArgs>;
            expect(log.args.filledTakerTokenAmount).to.be.bignumber.equal(
                order.params.takerTokenAmount.minus(fillTakerTokenAmount),
            );
            const newBalances = await dmyBalances.getAsync();

            expect(newBalances[maker][order.params.makerToken]).to.be.bignumber.equal(
                balances[maker][order.params.makerToken].minus(order.params.makerTokenAmount),
            );
            expect(newBalances[maker][order.params.takerToken]).to.be.bignumber.equal(
                balances[maker][order.params.takerToken].add(order.params.takerTokenAmount),
            );
            expect(newBalances[maker][zrx.address]).to.be.bignumber.equal(
                balances[maker][zrx.address].minus(order.params.makerFee),
            );
            expect(newBalances[taker][order.params.takerToken]).to.be.bignumber.equal(
                balances[taker][order.params.takerToken].minus(order.params.takerTokenAmount),
            );
            expect(newBalances[taker][order.params.makerToken]).to.be.bignumber.equal(
                balances[taker][order.params.makerToken].add(order.params.makerTokenAmount),
            );
            expect(newBalances[taker][zrx.address]).to.be.bignumber.equal(
                balances[taker][zrx.address].minus(order.params.takerFee),
            );
            expect(newBalances[feeRecipient][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipient][zrx.address].add(order.params.makerFee.add(order.params.takerFee)),
            );
        });

        it('should log 1 event with the correct arguments when order has a feeRecipient', async () => {
            const divisor = 2;
            const res = await exWrapper.fillOrderAsync(order, taker, {
                fillTakerTokenAmount: order.params.takerTokenAmount.div(divisor),
            });
            expect(res.logs).to.have.length(1);

            const logArgs = (res.logs[0] as LogWithDecodedArgs<LogFillContractEventArgs>).args;
            const expectedFilledMakerTokenAmount = order.params.makerTokenAmount.div(divisor);
            const expectedFilledTakerTokenAmount = order.params.takerTokenAmount.div(divisor);
            const expectedFeeMPaid = order.params.makerFee.div(divisor);
            const expectedFeeTPaid = order.params.takerFee.div(divisor);
            const tokensHashBuff = crypto.solSHA3([order.params.makerToken, order.params.takerToken]);
            const expectedTokens = ethUtil.bufferToHex(tokensHashBuff);

            expect(order.params.maker).to.be.equal(logArgs.maker);
            expect(taker).to.be.equal(logArgs.taker);
            expect(order.params.feeRecipient).to.be.equal(logArgs.feeRecipient);
            expect(order.params.makerToken).to.be.equal(logArgs.makerToken);
            expect(order.params.takerToken).to.be.equal(logArgs.takerToken);
            expect(expectedFilledMakerTokenAmount).to.be.bignumber.equal(logArgs.filledMakerTokenAmount);
            expect(expectedFilledTakerTokenAmount).to.be.bignumber.equal(logArgs.filledTakerTokenAmount);
            expect(expectedFeeMPaid).to.be.bignumber.equal(logArgs.paidMakerFee);
            expect(expectedFeeTPaid).to.be.bignumber.equal(logArgs.paidTakerFee);
            expect(expectedTokens).to.be.equal(logArgs.tokens);
            expect(order.getOrderHashHex()).to.be.equal(logArgs.orderHash);
        });

        it('should log 1 event with the correct arguments when order has no feeRecipient', async () => {
            order = await orderFactory.newSignedOrderAsync({
                feeRecipient: ZeroEx.NULL_ADDRESS,
            });
            const divisor = 2;
            const res = await exWrapper.fillOrderAsync(order, taker, {
                fillTakerTokenAmount: order.params.takerTokenAmount.div(divisor),
            });
            expect(res.logs).to.have.length(1);

            const logArgs = (res.logs[0] as LogWithDecodedArgs<LogFillContractEventArgs>).args;
            const expectedFilledMakerTokenAmount = order.params.makerTokenAmount.div(divisor);
            const expectedFilledTakerTokenAmount = order.params.takerTokenAmount.div(divisor);
            const expectedFeeMPaid = new BigNumber(0);
            const expectedFeeTPaid = new BigNumber(0);
            const tokensHashBuff = crypto.solSHA3([order.params.makerToken, order.params.takerToken]);
            const expectedTokens = ethUtil.bufferToHex(tokensHashBuff);

            expect(order.params.maker).to.be.equal(logArgs.maker);
            expect(taker).to.be.equal(logArgs.taker);
            expect(order.params.feeRecipient).to.be.equal(logArgs.feeRecipient);
            expect(order.params.makerToken).to.be.equal(logArgs.makerToken);
            expect(order.params.takerToken).to.be.equal(logArgs.takerToken);
            expect(expectedFilledMakerTokenAmount).to.be.bignumber.equal(logArgs.filledMakerTokenAmount);
            expect(expectedFilledTakerTokenAmount).to.be.bignumber.equal(logArgs.filledTakerTokenAmount);
            expect(expectedFeeMPaid).to.be.bignumber.equal(logArgs.paidMakerFee);
            expect(expectedFeeTPaid).to.be.bignumber.equal(logArgs.paidTakerFee);
            expect(expectedTokens).to.be.equal(logArgs.tokens);
            expect(order.getOrderHashHex()).to.be.equal(logArgs.orderHash);
        });

        it('should throw when taker is specified and order is claimed by other', async () => {
            order = await orderFactory.newSignedOrderAsync({
                taker: feeRecipient,
                makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
                takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
            });

            return expect(exWrapper.fillOrderAsync(order, taker)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if signature is invalid', async () => {
            order = await orderFactory.newSignedOrderAsync({
                makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(10), 18),
            });

            order.params.r = ethUtil.bufferToHex(ethUtil.sha3('invalidR'));
            order.params.s = ethUtil.bufferToHex(ethUtil.sha3('invalidS'));
            return expect(exWrapper.fillOrderAsync(order, taker)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if makerTokenAmount is 0', async () => {
            order = await orderFactory.newSignedOrderAsync({
                makerTokenAmount: new BigNumber(0),
            });

            return expect(exWrapper.fillOrderAsync(order, taker)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if takerTokenAmount is 0', async () => {
            order = await orderFactory.newSignedOrderAsync({
                takerTokenAmount: new BigNumber(0),
            });

            return expect(exWrapper.fillOrderAsync(order, taker)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if fillTakerTokenAmount is 0', async () => {
            order = await orderFactory.newSignedOrderAsync();

            return expect(
                exWrapper.fillOrderAsync(order, taker, {
                    fillTakerTokenAmount: new BigNumber(0),
                }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should not change balances if maker balances are too low to fill order and \
                shouldThrowOnInsufficientBalanceOrAllowance = false', async () => {
            order = await orderFactory.newSignedOrderAsync({
                makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18),
            });

            await exWrapper.fillOrderAsync(order, taker);
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should throw if maker balances are too low to fill order and \
                shouldThrowOnInsufficientBalanceOrAllowance = true', async () => {
            order = await orderFactory.newSignedOrderAsync({
                makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18),
            });

            return expect(
                exWrapper.fillOrderAsync(order, taker, {
                    shouldThrowOnInsufficientBalanceOrAllowance: true,
                }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should not change balances if taker balances are too low to fill order and \
                shouldThrowOnInsufficientBalanceOrAllowance = false', async () => {
            order = await orderFactory.newSignedOrderAsync({
                takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18),
            });

            await exWrapper.fillOrderAsync(order, taker);
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should throw if taker balances are too low to fill order and \
                shouldThrowOnInsufficientBalanceOrAllowance = true', async () => {
            order = await orderFactory.newSignedOrderAsync({
                takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18),
            });

            return expect(
                exWrapper.fillOrderAsync(order, taker, {
                    shouldThrowOnInsufficientBalanceOrAllowance: true,
                }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should not change balances if maker allowances are too low to fill order and \
                shouldThrowOnInsufficientBalanceOrAllowance = false', async () => {
            await rep.approve.sendTransactionAsync(tokenTransferProxy.address, new BigNumber(0), { from: maker });
            await exWrapper.fillOrderAsync(order, taker);
            await rep.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, {
                from: maker,
            });

            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should throw if maker allowances are too low to fill order and \
                shouldThrowOnInsufficientBalanceOrAllowance = true', async () => {
            await rep.approve.sendTransactionAsync(tokenTransferProxy.address, new BigNumber(0), { from: maker });
            expect(
                exWrapper.fillOrderAsync(order, taker, {
                    shouldThrowOnInsufficientBalanceOrAllowance: true,
                }),
            ).to.be.rejectedWith(constants.REVERT);
            await rep.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, {
                from: maker,
            });
        });

        it('should not change balances if taker allowances are too low to fill order and \
                shouldThrowOnInsufficientBalanceOrAllowance = false', async () => {
            await dgd.approve.sendTransactionAsync(tokenTransferProxy.address, new BigNumber(0), { from: taker });
            await exWrapper.fillOrderAsync(order, taker);
            await dgd.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, {
                from: taker,
            });

            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should throw if taker allowances are too low to fill order and \
                shouldThrowOnInsufficientBalanceOrAllowance = true', async () => {
            await dgd.approve.sendTransactionAsync(tokenTransferProxy.address, new BigNumber(0), { from: taker });
            expect(
                exWrapper.fillOrderAsync(order, taker, {
                    shouldThrowOnInsufficientBalanceOrAllowance: true,
                }),
            ).to.be.rejectedWith(constants.REVERT);
            await dgd.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, {
                from: taker,
            });
        });

        it('should not change balances if makerToken is ZRX, makerTokenAmount + makerFee > maker balance, \
                and shouldThrowOnInsufficientBalanceOrAllowance = false', async () => {
            const makerZRXBalance = new BigNumber(balances[maker][zrx.address]);
            order = await orderFactory.newSignedOrderAsync({
                makerToken: zrx.address,
                makerTokenAmount: makerZRXBalance,
                makerFee: new BigNumber(1),
            });
            await exWrapper.fillOrderAsync(order, taker);
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should not change balances if makerToken is ZRX, makerTokenAmount + makerFee > maker allowance, \
                and shouldThrowOnInsufficientBalanceOrAllowance = false', async () => {
            const makerZRXAllowance = await zrx.allowance(maker, tokenTransferProxy.address);
            order = await orderFactory.newSignedOrderAsync({
                makerToken: zrx.address,
                makerTokenAmount: new BigNumber(makerZRXAllowance),
                makerFee: new BigNumber(1),
            });
            await exWrapper.fillOrderAsync(order, taker);
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should not change balances if takerToken is ZRX, takerTokenAmount + takerFee > taker balance, \
                and shouldThrowOnInsufficientBalanceOrAllowance = false', async () => {
            const takerZRXBalance = new BigNumber(balances[taker][zrx.address]);
            order = await orderFactory.newSignedOrderAsync({
                takerToken: zrx.address,
                takerTokenAmount: takerZRXBalance,
                takerFee: new BigNumber(1),
            });
            await exWrapper.fillOrderAsync(order, taker);
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should not change balances if takerToken is ZRX, takerTokenAmount + takerFee > taker allowance, \
                and shouldThrowOnInsufficientBalanceOrAllowance = false', async () => {
            const takerZRXAllowance = await zrx.allowance(taker, tokenTransferProxy.address);
            order = await orderFactory.newSignedOrderAsync({
                takerToken: zrx.address,
                takerTokenAmount: new BigNumber(takerZRXAllowance),
                takerFee: new BigNumber(1),
            });
            await exWrapper.fillOrderAsync(order, taker);
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should throw if getBalance or getAllowance attempts to change state and \
                shouldThrowOnInsufficientBalanceOrAllowance = false', async () => {
            const maliciousToken = await deployer.deployAsync(ContractName.MaliciousToken);
            await maliciousToken.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, {
                from: taker,
            });

            order = await orderFactory.newSignedOrderAsync({
                takerToken: maliciousToken.address,
            });

            return expect(
                exWrapper.fillOrderAsync(order, taker, {
                    shouldThrowOnInsufficientBalanceOrAllowance: false,
                }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should not change balances if an order is expired', async () => {
            order = await orderFactory.newSignedOrderAsync({
                expirationTimestampInSec: new BigNumber(Math.floor((Date.now() - 10000) / 1000)),
            });
            await exWrapper.fillOrderAsync(order, taker);

            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should log an error event if an order is expired', async () => {
            order = await orderFactory.newSignedOrderAsync({
                expirationTimestampInSec: new BigNumber(Math.floor((Date.now() - 10000) / 1000)),
            });

            const res = await exWrapper.fillOrderAsync(order, taker);
            expect(res.logs).to.have.length(1);
            const log = res.logs[0] as LogWithDecodedArgs<LogErrorContractEventArgs>;
            const errCode = log.args.errorId.toNumber();
            expect(errCode).to.be.equal(ExchangeContractErrs.ERROR_ORDER_EXPIRED);
        });

        it('should log an error event if no value is filled', async () => {
            order = await orderFactory.newSignedOrderAsync({});
            await exWrapper.fillOrderAsync(order, taker);

            const res = await exWrapper.fillOrderAsync(order, taker);
            expect(res.logs).to.have.length(1);
            const log = res.logs[0] as LogWithDecodedArgs<LogErrorContractEventArgs>;
            const errCode = log.args.errorId.toNumber();
            expect(errCode).to.be.equal(ExchangeContractErrs.ERROR_ORDER_FULLY_FILLED_OR_CANCELLED);
        });
    });

    describe('cancelOrder', () => {
        beforeEach(async () => {
            balances = await dmyBalances.getAsync();
            order = await orderFactory.newSignedOrderAsync();
        });

        it('should throw if not sent by maker', async () => {
            return expect(exWrapper.cancelOrderAsync(order, taker)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if makerTokenAmount is 0', async () => {
            order = await orderFactory.newSignedOrderAsync({
                makerTokenAmount: new BigNumber(0),
            });

            return expect(exWrapper.cancelOrderAsync(order, maker)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if takerTokenAmount is 0', async () => {
            order = await orderFactory.newSignedOrderAsync({
                takerTokenAmount: new BigNumber(0),
            });

            return expect(exWrapper.cancelOrderAsync(order, maker)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if cancelTakerTokenAmount is 0', async () => {
            order = await orderFactory.newSignedOrderAsync();

            return expect(
                exWrapper.cancelOrderAsync(order, maker, {
                    cancelTakerTokenAmount: new BigNumber(0),
                }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should be able to cancel a full order', async () => {
            await exWrapper.cancelOrderAsync(order, maker);
            await exWrapper.fillOrderAsync(order, taker, {
                fillTakerTokenAmount: order.params.takerTokenAmount.div(2),
            });

            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should be able to cancel part of an order', async () => {
            const cancelTakerTokenAmount = order.params.takerTokenAmount.div(2);
            await exWrapper.cancelOrderAsync(order, maker, {
                cancelTakerTokenAmount,
            });

            const res = await exWrapper.fillOrderAsync(order, taker, {
                fillTakerTokenAmount: order.params.takerTokenAmount,
            });
            const log = res.logs[0] as LogWithDecodedArgs<LogFillContractEventArgs>;
            expect(log.args.filledTakerTokenAmount).to.be.bignumber.equal(
                order.params.takerTokenAmount.minus(cancelTakerTokenAmount),
            );

            const newBalances = await dmyBalances.getAsync();
            const cancelMakerTokenAmount = cancelTakerTokenAmount
                .times(order.params.makerTokenAmount)
                .dividedToIntegerBy(order.params.takerTokenAmount);
            const paidMakerFee = order.params.makerFee
                .times(cancelMakerTokenAmount)
                .dividedToIntegerBy(order.params.makerTokenAmount);
            const paidTakerFee = order.params.takerFee
                .times(cancelMakerTokenAmount)
                .dividedToIntegerBy(order.params.makerTokenAmount);
            expect(newBalances[maker][order.params.makerToken]).to.be.bignumber.equal(
                balances[maker][order.params.makerToken].minus(cancelMakerTokenAmount),
            );
            expect(newBalances[maker][order.params.takerToken]).to.be.bignumber.equal(
                balances[maker][order.params.takerToken].add(cancelTakerTokenAmount),
            );
            expect(newBalances[maker][zrx.address]).to.be.bignumber.equal(
                balances[maker][zrx.address].minus(paidMakerFee),
            );
            expect(newBalances[taker][order.params.takerToken]).to.be.bignumber.equal(
                balances[taker][order.params.takerToken].minus(cancelTakerTokenAmount),
            );
            expect(newBalances[taker][order.params.makerToken]).to.be.bignumber.equal(
                balances[taker][order.params.makerToken].add(cancelMakerTokenAmount),
            );
            expect(newBalances[taker][zrx.address]).to.be.bignumber.equal(
                balances[taker][zrx.address].minus(paidTakerFee),
            );
            expect(newBalances[feeRecipient][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipient][zrx.address].add(paidMakerFee.add(paidTakerFee)),
            );
        });

        it('should log 1 event with correct arguments', async () => {
            const divisor = 2;
            const res = await exWrapper.cancelOrderAsync(order, maker, {
                cancelTakerTokenAmount: order.params.takerTokenAmount.div(divisor),
            });
            expect(res.logs).to.have.length(1);

            const log = res.logs[0] as LogWithDecodedArgs<LogCancelContractEventArgs>;
            const logArgs = log.args;
            const expectedCancelledMakerTokenAmount = order.params.makerTokenAmount.div(divisor);
            const expectedCancelledTakerTokenAmount = order.params.takerTokenAmount.div(divisor);
            const tokensHashBuff = crypto.solSHA3([order.params.makerToken, order.params.takerToken]);
            const expectedTokens = ethUtil.bufferToHex(tokensHashBuff);

            expect(order.params.maker).to.be.equal(logArgs.maker);
            expect(order.params.feeRecipient).to.be.equal(logArgs.feeRecipient);
            expect(order.params.makerToken).to.be.equal(logArgs.makerToken);
            expect(order.params.takerToken).to.be.equal(logArgs.takerToken);
            expect(expectedCancelledMakerTokenAmount).to.be.bignumber.equal(logArgs.cancelledMakerTokenAmount);
            expect(expectedCancelledTakerTokenAmount).to.be.bignumber.equal(logArgs.cancelledTakerTokenAmount);
            expect(expectedTokens).to.be.equal(logArgs.tokens);
            expect(order.getOrderHashHex()).to.be.equal(logArgs.orderHash);
        });

        it('should not log events if no value is cancelled', async () => {
            await exWrapper.cancelOrderAsync(order, maker);

            const res = await exWrapper.cancelOrderAsync(order, maker);
            expect(res.logs).to.have.length(1);
            const log = res.logs[0] as LogWithDecodedArgs<LogErrorContractEventArgs>;
            const errCode = log.args.errorId.toNumber();
            expect(errCode).to.be.equal(ExchangeContractErrs.ERROR_ORDER_FULLY_FILLED_OR_CANCELLED);
        });

        it('should not log events if order is expired', async () => {
            order = await orderFactory.newSignedOrderAsync({
                expirationTimestampInSec: new BigNumber(Math.floor((Date.now() - 10000) / 1000)),
            });

            const res = await exWrapper.cancelOrderAsync(order, maker);
            expect(res.logs).to.have.length(1);
            const log = res.logs[0] as LogWithDecodedArgs<LogErrorContractEventArgs>;
            const errCode = log.args.errorId.toNumber();
            expect(errCode).to.be.equal(ExchangeContractErrs.ERROR_ORDER_EXPIRED);
        });
    });
}); // tslint:disable-line:max-file-line-count
