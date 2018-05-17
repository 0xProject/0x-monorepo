import { LogWithDecodedArgs, SignedOrder, TransactionReceiptWithDecodedLogs, ZeroEx } from '0x.js';
import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import ethUtil = require('ethereumjs-util');
import 'make-promises-safe';
import * as Web3 from 'web3';

import { DummyTokenContract } from '../../src/contract_wrappers/generated/dummy_token';
import {
    ExchangeContract,
    LogCancelContractEventArgs,
    LogErrorContractEventArgs,
    LogFillContractEventArgs,
} from '../../src/contract_wrappers/generated/exchange';
import { MaliciousTokenContract } from '../../src/contract_wrappers/generated/malicious_token';
import { TokenTransferProxyContract } from '../../src/contract_wrappers/generated/token_transfer_proxy';
import { artifacts } from '../../util/artifacts';
import { Balances } from '../../util/balances';
import { constants } from '../../util/constants';
import { crypto } from '../../util/crypto';
import { ExchangeWrapper } from '../../util/exchange_wrapper';
import { OrderFactory } from '../../util/order_factory';
import { BalancesByOwner, ContractName, ExchangeContractErrs } from '../../util/types';
import { chaiSetup } from '../utils/chai_setup';

import { provider, txDefaults, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

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

    let signedOrder: SignedOrder;
    let balances: BalancesByOwner;
    let exWrapper: ExchangeWrapper;
    let dmyBalances: Balances;
    let orderFactory: OrderFactory;

    let zeroEx: ZeroEx;

    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        maker = accounts[0];
        [tokenOwner, taker, feeRecipient] = accounts;
        [rep, dgd, zrx] = await Promise.all([
            DummyTokenContract.deployFrom0xArtifactAsync(
                artifacts.DummyToken,
                provider,
                txDefaults,
                constants.DUMMY_TOKEN_NAME,
                constants.DUMMY_TOKEN_SYMBOL,
                constants.DUMMY_TOKEN_DECIMALS,
                constants.DUMMY_TOKEN_TOTAL_SUPPLY,
            ),
            DummyTokenContract.deployFrom0xArtifactAsync(
                artifacts.DummyToken,
                provider,
                txDefaults,
                constants.DUMMY_TOKEN_NAME,
                constants.DUMMY_TOKEN_SYMBOL,
                constants.DUMMY_TOKEN_DECIMALS,
                constants.DUMMY_TOKEN_TOTAL_SUPPLY,
            ),
            DummyTokenContract.deployFrom0xArtifactAsync(
                artifacts.DummyToken,
                provider,
                txDefaults,
                constants.DUMMY_TOKEN_NAME,
                constants.DUMMY_TOKEN_SYMBOL,
                constants.DUMMY_TOKEN_DECIMALS,
                constants.DUMMY_TOKEN_TOTAL_SUPPLY,
            ),
        ]);
        tokenTransferProxy = await TokenTransferProxyContract.deployFrom0xArtifactAsync(
            artifacts.TokenTransferProxy,
            provider,
            txDefaults,
        );
        exchange = await ExchangeContract.deployFrom0xArtifactAsync(
            artifacts.Exchange,
            provider,
            txDefaults,
            zrx.address,
            tokenTransferProxy.address,
        );
        await tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, { from: accounts[0] });
        zeroEx = new ZeroEx(provider, {
            exchangeContractAddress: exchange.address,
            networkId: constants.TESTRPC_NETWORK_ID,
        });
        exWrapper = new ExchangeWrapper(exchange, zeroEx);

        const defaultOrderParams = {
            exchangeContractAddress: exchange.address,
            maker,
            feeRecipient,
            makerTokenAddress: rep.address,
            takerTokenAddress: dgd.address,
            makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
            takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
            makerFee: ZeroEx.toBaseUnitAmount(new BigNumber(1), 18),
            takerFee: ZeroEx.toBaseUnitAmount(new BigNumber(1), 18),
        };
        orderFactory = new OrderFactory(zeroEx, defaultOrderParams);
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
            signedOrder = await orderFactory.newSignedOrderAsync();
        });

        it('should create an unfillable order', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerTokenAmount: new BigNumber(1001),
                takerTokenAmount: new BigNumber(3),
            });

            const filledTakerTokenAmountBefore = await zeroEx.exchange.getFilledTakerAmountAsync(
                ZeroEx.getOrderHashHex(signedOrder),
            );
            expect(filledTakerTokenAmountBefore).to.be.bignumber.equal(0);

            const fillTakerTokenAmount1 = new BigNumber(2);
            await exWrapper.fillOrderAsync(signedOrder, taker, {
                fillTakerTokenAmount: fillTakerTokenAmount1,
            });

            const filledTakerTokenAmountAfter1 = await zeroEx.exchange.getFilledTakerAmountAsync(
                ZeroEx.getOrderHashHex(signedOrder),
            );
            expect(filledTakerTokenAmountAfter1).to.be.bignumber.equal(fillTakerTokenAmount1);

            const fillTakerTokenAmount2 = new BigNumber(1);
            await exWrapper.fillOrderAsync(signedOrder, taker, {
                fillTakerTokenAmount: fillTakerTokenAmount2,
            });

            const filledTakerTokenAmountAfter2 = await zeroEx.exchange.getFilledTakerAmountAsync(
                ZeroEx.getOrderHashHex(signedOrder),
            );
            expect(filledTakerTokenAmountAfter2).to.be.bignumber.equal(filledTakerTokenAmountAfter1);
        });

        it('should transfer the correct amounts when makerTokenAmount === takerTokenAmount', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
                takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
            });

            const filledTakerTokenAmountBefore = await zeroEx.exchange.getFilledTakerAmountAsync(
                ZeroEx.getOrderHashHex(signedOrder),
            );
            expect(filledTakerTokenAmountBefore).to.be.bignumber.equal(0);

            const fillTakerTokenAmount = signedOrder.takerTokenAmount.div(2);
            await exWrapper.fillOrderAsync(signedOrder, taker, { fillTakerTokenAmount });

            const filledTakerTokenAmountAfter = await zeroEx.exchange.getFilledTakerAmountAsync(
                ZeroEx.getOrderHashHex(signedOrder),
            );
            expect(filledTakerTokenAmountAfter).to.be.bignumber.equal(fillTakerTokenAmount);

            const newBalances = await dmyBalances.getAsync();

            const fillMakerTokenAmount = fillTakerTokenAmount
                .times(signedOrder.makerTokenAmount)
                .dividedToIntegerBy(signedOrder.takerTokenAmount);
            const paidMakerFee = signedOrder.makerFee
                .times(fillMakerTokenAmount)
                .dividedToIntegerBy(signedOrder.makerTokenAmount);
            const paidTakerFee = signedOrder.takerFee
                .times(fillMakerTokenAmount)
                .dividedToIntegerBy(signedOrder.makerTokenAmount);
            expect(newBalances[maker][signedOrder.makerTokenAddress]).to.be.bignumber.equal(
                balances[maker][signedOrder.makerTokenAddress].minus(fillMakerTokenAmount),
            );
            expect(newBalances[maker][signedOrder.takerTokenAddress]).to.be.bignumber.equal(
                balances[maker][signedOrder.takerTokenAddress].add(fillTakerTokenAmount),
            );
            expect(newBalances[maker][zrx.address]).to.be.bignumber.equal(
                balances[maker][zrx.address].minus(paidMakerFee),
            );
            expect(newBalances[taker][signedOrder.takerTokenAddress]).to.be.bignumber.equal(
                balances[taker][signedOrder.takerTokenAddress].minus(fillTakerTokenAmount),
            );
            expect(newBalances[taker][signedOrder.makerTokenAddress]).to.be.bignumber.equal(
                balances[taker][signedOrder.makerTokenAddress].add(fillMakerTokenAmount),
            );
            expect(newBalances[taker][zrx.address]).to.be.bignumber.equal(
                balances[taker][zrx.address].minus(paidTakerFee),
            );
            expect(newBalances[feeRecipient][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipient][zrx.address].add(paidMakerFee.add(paidTakerFee)),
            );
        });

        it('should transfer the correct amounts when makerTokenAmount > takerTokenAmount', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
                takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
            });

            const filledTakerTokenAmountBefore = await zeroEx.exchange.getFilledTakerAmountAsync(
                ZeroEx.getOrderHashHex(signedOrder),
            );
            expect(filledTakerTokenAmountBefore).to.be.bignumber.equal(0);

            const fillTakerTokenAmount = signedOrder.takerTokenAmount.div(2);
            await exWrapper.fillOrderAsync(signedOrder, taker, { fillTakerTokenAmount });

            const filledTakerTokenAmountAfter = await zeroEx.exchange.getFilledTakerAmountAsync(
                ZeroEx.getOrderHashHex(signedOrder),
            );
            expect(filledTakerTokenAmountAfter).to.be.bignumber.equal(fillTakerTokenAmount);

            const newBalances = await dmyBalances.getAsync();

            const fillMakerTokenAmount = fillTakerTokenAmount
                .times(signedOrder.makerTokenAmount)
                .dividedToIntegerBy(signedOrder.takerTokenAmount);
            const paidMakerFee = signedOrder.makerFee
                .times(fillMakerTokenAmount)
                .dividedToIntegerBy(signedOrder.makerTokenAmount);
            const paidTakerFee = signedOrder.takerFee
                .times(fillMakerTokenAmount)
                .dividedToIntegerBy(signedOrder.makerTokenAmount);
            expect(newBalances[maker][signedOrder.makerTokenAddress]).to.be.bignumber.equal(
                balances[maker][signedOrder.makerTokenAddress].minus(fillMakerTokenAmount),
            );
            expect(newBalances[maker][signedOrder.takerTokenAddress]).to.be.bignumber.equal(
                balances[maker][signedOrder.takerTokenAddress].add(fillTakerTokenAmount),
            );
            expect(newBalances[maker][zrx.address]).to.be.bignumber.equal(
                balances[maker][zrx.address].minus(paidMakerFee),
            );
            expect(newBalances[taker][signedOrder.takerTokenAddress]).to.be.bignumber.equal(
                balances[taker][signedOrder.takerTokenAddress].minus(fillTakerTokenAmount),
            );
            expect(newBalances[taker][signedOrder.makerTokenAddress]).to.be.bignumber.equal(
                balances[taker][signedOrder.makerTokenAddress].add(fillMakerTokenAmount),
            );
            expect(newBalances[taker][zrx.address]).to.be.bignumber.equal(
                balances[taker][zrx.address].minus(paidTakerFee),
            );
            expect(newBalances[feeRecipient][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipient][zrx.address].add(paidMakerFee.add(paidTakerFee)),
            );
        });

        it('should transfer the correct amounts when makerTokenAmount < takerTokenAmount', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
                takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
            });

            const filledTakerTokenAmountBefore = await zeroEx.exchange.getFilledTakerAmountAsync(
                ZeroEx.getOrderHashHex(signedOrder),
            );
            expect(filledTakerTokenAmountBefore).to.be.bignumber.equal(0);

            const fillTakerTokenAmount = signedOrder.takerTokenAmount.div(2);
            await exWrapper.fillOrderAsync(signedOrder, taker, { fillTakerTokenAmount });

            const filledTakerTokenAmountAfter = await zeroEx.exchange.getFilledTakerAmountAsync(
                ZeroEx.getOrderHashHex(signedOrder),
            );
            expect(filledTakerTokenAmountAfter).to.be.bignumber.equal(fillTakerTokenAmount);

            const newBalances = await dmyBalances.getAsync();

            const fillMakerTokenAmount = fillTakerTokenAmount
                .times(signedOrder.makerTokenAmount)
                .dividedToIntegerBy(signedOrder.takerTokenAmount);
            const paidMakerFee = signedOrder.makerFee
                .times(fillMakerTokenAmount)
                .dividedToIntegerBy(signedOrder.makerTokenAmount);
            const paidTakerFee = signedOrder.takerFee
                .times(fillMakerTokenAmount)
                .dividedToIntegerBy(signedOrder.makerTokenAmount);
            expect(newBalances[maker][signedOrder.makerTokenAddress]).to.be.bignumber.equal(
                balances[maker][signedOrder.makerTokenAddress].minus(fillMakerTokenAmount),
            );
            expect(newBalances[maker][signedOrder.takerTokenAddress]).to.be.bignumber.equal(
                balances[maker][signedOrder.takerTokenAddress].add(fillTakerTokenAmount),
            );
            expect(newBalances[maker][zrx.address]).to.be.bignumber.equal(
                balances[maker][zrx.address].minus(paidMakerFee),
            );
            expect(newBalances[taker][signedOrder.takerTokenAddress]).to.be.bignumber.equal(
                balances[taker][signedOrder.takerTokenAddress].minus(fillTakerTokenAmount),
            );
            expect(newBalances[taker][signedOrder.makerTokenAddress]).to.be.bignumber.equal(
                balances[taker][signedOrder.makerTokenAddress].add(fillMakerTokenAmount),
            );
            expect(newBalances[taker][zrx.address]).to.be.bignumber.equal(
                balances[taker][zrx.address].minus(paidTakerFee),
            );
            expect(newBalances[feeRecipient][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipient][zrx.address].add(paidMakerFee.add(paidTakerFee)),
            );
        });

        it('should transfer the correct amounts when taker is specified and order is claimed by taker', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                taker,
                makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
                takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
            });

            const filledTakerTokenAmountBefore = await zeroEx.exchange.getFilledTakerAmountAsync(
                ZeroEx.getOrderHashHex(signedOrder),
            );
            expect(filledTakerTokenAmountBefore).to.be.bignumber.equal(0);

            const fillTakerTokenAmount = signedOrder.takerTokenAmount.div(2);
            await exWrapper.fillOrderAsync(signedOrder, taker, { fillTakerTokenAmount });

            const filledTakerTokenAmountAfter = await zeroEx.exchange.getFilledTakerAmountAsync(
                ZeroEx.getOrderHashHex(signedOrder),
            );
            const expectedFillAmountTAfter = fillTakerTokenAmount.add(filledTakerTokenAmountBefore);
            expect(filledTakerTokenAmountAfter).to.be.bignumber.equal(expectedFillAmountTAfter);

            const newBalances = await dmyBalances.getAsync();

            const fillMakerTokenAmount = fillTakerTokenAmount
                .times(signedOrder.makerTokenAmount)
                .dividedToIntegerBy(signedOrder.takerTokenAmount);
            const paidMakerFee = signedOrder.makerFee
                .times(fillMakerTokenAmount)
                .dividedToIntegerBy(signedOrder.makerTokenAmount);
            const paidTakerFee = signedOrder.takerFee
                .times(fillMakerTokenAmount)
                .dividedToIntegerBy(signedOrder.makerTokenAmount);
            expect(newBalances[maker][signedOrder.makerTokenAddress]).to.be.bignumber.equal(
                balances[maker][signedOrder.makerTokenAddress].minus(fillMakerTokenAmount),
            );
            expect(newBalances[maker][signedOrder.takerTokenAddress]).to.be.bignumber.equal(
                balances[maker][signedOrder.takerTokenAddress].add(fillTakerTokenAmount),
            );
            expect(newBalances[maker][zrx.address]).to.be.bignumber.equal(
                balances[maker][zrx.address].minus(paidMakerFee),
            );
            expect(newBalances[taker][signedOrder.takerTokenAddress]).to.be.bignumber.equal(
                balances[taker][signedOrder.takerTokenAddress].minus(fillTakerTokenAmount),
            );
            expect(newBalances[taker][signedOrder.makerTokenAddress]).to.be.bignumber.equal(
                balances[taker][signedOrder.makerTokenAddress].add(fillMakerTokenAmount),
            );
            expect(newBalances[taker][zrx.address]).to.be.bignumber.equal(
                balances[taker][zrx.address].minus(paidTakerFee),
            );
            expect(newBalances[feeRecipient][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipient][zrx.address].add(paidMakerFee.add(paidTakerFee)),
            );
        });

        it('should fill remaining value if fillTakerTokenAmount > remaining takerTokenAmount', async () => {
            const fillTakerTokenAmount = signedOrder.takerTokenAmount.div(2);
            await exWrapper.fillOrderAsync(signedOrder, taker, { fillTakerTokenAmount });

            const res = await exWrapper.fillOrderAsync(signedOrder, taker, {
                fillTakerTokenAmount: signedOrder.takerTokenAmount,
            });
            const log = res.logs[0] as LogWithDecodedArgs<LogFillContractEventArgs>;
            expect(log.args.filledTakerTokenAmount).to.be.bignumber.equal(
                signedOrder.takerTokenAmount.minus(fillTakerTokenAmount),
            );
            const newBalances = await dmyBalances.getAsync();

            expect(newBalances[maker][signedOrder.makerTokenAddress]).to.be.bignumber.equal(
                balances[maker][signedOrder.makerTokenAddress].minus(signedOrder.makerTokenAmount),
            );
            expect(newBalances[maker][signedOrder.takerTokenAddress]).to.be.bignumber.equal(
                balances[maker][signedOrder.takerTokenAddress].add(signedOrder.takerTokenAmount),
            );
            expect(newBalances[maker][zrx.address]).to.be.bignumber.equal(
                balances[maker][zrx.address].minus(signedOrder.makerFee),
            );
            expect(newBalances[taker][signedOrder.takerTokenAddress]).to.be.bignumber.equal(
                balances[taker][signedOrder.takerTokenAddress].minus(signedOrder.takerTokenAmount),
            );
            expect(newBalances[taker][signedOrder.makerTokenAddress]).to.be.bignumber.equal(
                balances[taker][signedOrder.makerTokenAddress].add(signedOrder.makerTokenAmount),
            );
            expect(newBalances[taker][zrx.address]).to.be.bignumber.equal(
                balances[taker][zrx.address].minus(signedOrder.takerFee),
            );
            expect(newBalances[feeRecipient][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipient][zrx.address].add(signedOrder.makerFee.add(signedOrder.takerFee)),
            );
        });

        it('should log 1 event with the correct arguments when order has a feeRecipient', async () => {
            const divisor = 2;
            const res = await exWrapper.fillOrderAsync(signedOrder, taker, {
                fillTakerTokenAmount: signedOrder.takerTokenAmount.div(divisor),
            });
            expect(res.logs).to.have.length(1);

            const logArgs = (res.logs[0] as LogWithDecodedArgs<LogFillContractEventArgs>).args;
            const expectedFilledMakerTokenAmount = signedOrder.makerTokenAmount.div(divisor);
            const expectedFilledTakerTokenAmount = signedOrder.takerTokenAmount.div(divisor);
            const expectedFeeMPaid = signedOrder.makerFee.div(divisor);
            const expectedFeeTPaid = signedOrder.takerFee.div(divisor);
            const tokensHashBuff = crypto.solSHA3([signedOrder.makerTokenAddress, signedOrder.takerTokenAddress]);
            const expectedTokens = ethUtil.bufferToHex(tokensHashBuff);

            expect(signedOrder.maker).to.be.equal(logArgs.maker);
            expect(taker).to.be.equal(logArgs.taker);
            expect(signedOrder.feeRecipient).to.be.equal(logArgs.feeRecipient);
            expect(signedOrder.makerTokenAddress).to.be.equal(logArgs.makerToken);
            expect(signedOrder.takerTokenAddress).to.be.equal(logArgs.takerToken);
            expect(expectedFilledMakerTokenAmount).to.be.bignumber.equal(logArgs.filledMakerTokenAmount);
            expect(expectedFilledTakerTokenAmount).to.be.bignumber.equal(logArgs.filledTakerTokenAmount);
            expect(expectedFeeMPaid).to.be.bignumber.equal(logArgs.paidMakerFee);
            expect(expectedFeeTPaid).to.be.bignumber.equal(logArgs.paidTakerFee);
            expect(expectedTokens).to.be.equal(logArgs.tokens);
            expect(ZeroEx.getOrderHashHex(signedOrder)).to.be.equal(logArgs.orderHash);
        });

        it('should log 1 event with the correct arguments when order has no feeRecipient', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                feeRecipient: ZeroEx.NULL_ADDRESS,
            });
            const divisor = 2;
            const res = await exWrapper.fillOrderAsync(signedOrder, taker, {
                fillTakerTokenAmount: signedOrder.takerTokenAmount.div(divisor),
            });
            expect(res.logs).to.have.length(1);

            const logArgs = (res.logs[0] as LogWithDecodedArgs<LogFillContractEventArgs>).args;
            const expectedFilledMakerTokenAmount = signedOrder.makerTokenAmount.div(divisor);
            const expectedFilledTakerTokenAmount = signedOrder.takerTokenAmount.div(divisor);
            const expectedFeeMPaid = new BigNumber(0);
            const expectedFeeTPaid = new BigNumber(0);
            const tokensHashBuff = crypto.solSHA3([signedOrder.makerTokenAddress, signedOrder.takerTokenAddress]);
            const expectedTokens = ethUtil.bufferToHex(tokensHashBuff);

            expect(signedOrder.maker).to.be.equal(logArgs.maker);
            expect(taker).to.be.equal(logArgs.taker);
            expect(signedOrder.feeRecipient).to.be.equal(logArgs.feeRecipient);
            expect(signedOrder.makerTokenAddress).to.be.equal(logArgs.makerToken);
            expect(signedOrder.takerTokenAddress).to.be.equal(logArgs.takerToken);
            expect(expectedFilledMakerTokenAmount).to.be.bignumber.equal(logArgs.filledMakerTokenAmount);
            expect(expectedFilledTakerTokenAmount).to.be.bignumber.equal(logArgs.filledTakerTokenAmount);
            expect(expectedFeeMPaid).to.be.bignumber.equal(logArgs.paidMakerFee);
            expect(expectedFeeTPaid).to.be.bignumber.equal(logArgs.paidTakerFee);
            expect(expectedTokens).to.be.equal(logArgs.tokens);
            expect(ZeroEx.getOrderHashHex(signedOrder)).to.be.equal(logArgs.orderHash);
        });

        it('should throw when taker is specified and order is claimed by other', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                taker: feeRecipient,
                makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
                takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
            });

            return expect(exWrapper.fillOrderAsync(signedOrder, taker)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if signature is invalid', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(10), 18),
            });

            signedOrder.ecSignature.r = ethUtil.bufferToHex(ethUtil.sha3('invalidR'));
            signedOrder.ecSignature.s = ethUtil.bufferToHex(ethUtil.sha3('invalidS'));
            return expect(exWrapper.fillOrderAsync(signedOrder, taker)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if makerTokenAmount is 0', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerTokenAmount: new BigNumber(0),
            });

            return expect(exWrapper.fillOrderAsync(signedOrder, taker)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if takerTokenAmount is 0', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                takerTokenAmount: new BigNumber(0),
            });

            return expect(exWrapper.fillOrderAsync(signedOrder, taker)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if fillTakerTokenAmount is 0', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync();

            return expect(
                exWrapper.fillOrderAsync(signedOrder, taker, {
                    fillTakerTokenAmount: new BigNumber(0),
                }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should not change balances if maker balances are too low to fill order and \
                shouldThrowOnInsufficientBalanceOrAllowance = false', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18),
            });

            await exWrapper.fillOrderAsync(signedOrder, taker);
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should throw if maker balances are too low to fill order and \
                shouldThrowOnInsufficientBalanceOrAllowance = true', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18),
            });

            return expect(
                exWrapper.fillOrderAsync(signedOrder, taker, {
                    shouldThrowOnInsufficientBalanceOrAllowance: true,
                }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should not change balances if taker balances are too low to fill order and \
                shouldThrowOnInsufficientBalanceOrAllowance = false', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18),
            });

            await exWrapper.fillOrderAsync(signedOrder, taker);
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should throw if taker balances are too low to fill order and \
                shouldThrowOnInsufficientBalanceOrAllowance = true', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18),
            });

            return expect(
                exWrapper.fillOrderAsync(signedOrder, taker, {
                    shouldThrowOnInsufficientBalanceOrAllowance: true,
                }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should not change balances if maker allowances are too low to fill order and \
                shouldThrowOnInsufficientBalanceOrAllowance = false', async () => {
            await rep.approve.sendTransactionAsync(tokenTransferProxy.address, new BigNumber(0), { from: maker });
            await exWrapper.fillOrderAsync(signedOrder, taker);
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
                exWrapper.fillOrderAsync(signedOrder, taker, {
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
            await exWrapper.fillOrderAsync(signedOrder, taker);
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
                exWrapper.fillOrderAsync(signedOrder, taker, {
                    shouldThrowOnInsufficientBalanceOrAllowance: true,
                }),
            ).to.be.rejectedWith(constants.REVERT);
            await dgd.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, {
                from: taker,
            });
        });

        it('should not change balances if makerTokenAddress is ZRX, makerTokenAmount + makerFee > maker balance, \
                and shouldThrowOnInsufficientBalanceOrAllowance = false', async () => {
            const makerZRXBalance = new BigNumber(balances[maker][zrx.address]);
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerTokenAddress: zrx.address,
                makerTokenAmount: makerZRXBalance,
                makerFee: new BigNumber(1),
            });
            await exWrapper.fillOrderAsync(signedOrder, taker);
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should not change balances if makerTokenAddress is ZRX, makerTokenAmount + makerFee > maker allowance, \
                and shouldThrowOnInsufficientBalanceOrAllowance = false', async () => {
            const makerZRXAllowance = await zrx.allowance.callAsync(maker, tokenTransferProxy.address);
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerTokenAddress: zrx.address,
                makerTokenAmount: new BigNumber(makerZRXAllowance),
                makerFee: new BigNumber(1),
            });
            await exWrapper.fillOrderAsync(signedOrder, taker);
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should not change balances if takerTokenAddress is ZRX, takerTokenAmount + takerFee > taker balance, \
                and shouldThrowOnInsufficientBalanceOrAllowance = false', async () => {
            const takerZRXBalance = new BigNumber(balances[taker][zrx.address]);
            signedOrder = await orderFactory.newSignedOrderAsync({
                takerTokenAddress: zrx.address,
                takerTokenAmount: takerZRXBalance,
                takerFee: new BigNumber(1),
            });
            await exWrapper.fillOrderAsync(signedOrder, taker);
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should not change balances if takerTokenAddress is ZRX, takerTokenAmount + takerFee > taker allowance, \
                and shouldThrowOnInsufficientBalanceOrAllowance = false', async () => {
            const takerZRXAllowance = await zrx.allowance.callAsync(taker, tokenTransferProxy.address);
            signedOrder = await orderFactory.newSignedOrderAsync({
                takerTokenAddress: zrx.address,
                takerTokenAmount: new BigNumber(takerZRXAllowance),
                takerFee: new BigNumber(1),
            });
            await exWrapper.fillOrderAsync(signedOrder, taker);
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should throw if getBalance or getAllowance attempts to change state and \
                shouldThrowOnInsufficientBalanceOrAllowance = false', async () => {
            const maliciousToken = await MaliciousTokenContract.deployFrom0xArtifactAsync(
                artifacts.MaliciousToken,
                provider,
                txDefaults,
            );
            await maliciousToken.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, {
                from: taker,
            });

            signedOrder = await orderFactory.newSignedOrderAsync({
                takerTokenAddress: maliciousToken.address,
            });

            return expect(
                exWrapper.fillOrderAsync(signedOrder, taker, {
                    shouldThrowOnInsufficientBalanceOrAllowance: false,
                }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should not change balances if an order is expired', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                expirationUnixTimestampSec: new BigNumber(Math.floor((Date.now() - 10000) / 1000)),
            });
            await exWrapper.fillOrderAsync(signedOrder, taker);

            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should log an error event if an order is expired', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                expirationUnixTimestampSec: new BigNumber(Math.floor((Date.now() - 10000) / 1000)),
            });

            const res = await exWrapper.fillOrderAsync(signedOrder, taker);
            expect(res.logs).to.have.length(1);
            const log = res.logs[0] as LogWithDecodedArgs<LogErrorContractEventArgs>;
            const errCode = log.args.errorId;
            expect(errCode).to.be.equal(ExchangeContractErrs.ERROR_ORDER_EXPIRED);
        });

        it('should log an error event if no value is filled', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({});
            await exWrapper.fillOrderAsync(signedOrder, taker);

            const res = await exWrapper.fillOrderAsync(signedOrder, taker);
            expect(res.logs).to.have.length(1);
            const log = res.logs[0] as LogWithDecodedArgs<LogErrorContractEventArgs>;
            const errCode = log.args.errorId;
            expect(errCode).to.be.equal(ExchangeContractErrs.ERROR_ORDER_FULLY_FILLED_OR_CANCELLED);
        });
    });

    describe('cancelOrder', () => {
        beforeEach(async () => {
            balances = await dmyBalances.getAsync();
            signedOrder = await orderFactory.newSignedOrderAsync();
        });

        it('should throw if not sent by maker', async () => {
            return expect(exWrapper.cancelOrderAsync(signedOrder, taker)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if makerTokenAmount is 0', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerTokenAmount: new BigNumber(0),
            });

            return expect(exWrapper.cancelOrderAsync(signedOrder, maker)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if takerTokenAmount is 0', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                takerTokenAmount: new BigNumber(0),
            });

            return expect(exWrapper.cancelOrderAsync(signedOrder, maker)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if cancelTakerTokenAmount is 0', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync();

            return expect(
                exWrapper.cancelOrderAsync(signedOrder, maker, {
                    cancelTakerTokenAmount: new BigNumber(0),
                }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should be able to cancel a full order', async () => {
            await exWrapper.cancelOrderAsync(signedOrder, maker);
            await exWrapper.fillOrderAsync(signedOrder, taker, {
                fillTakerTokenAmount: signedOrder.takerTokenAmount.div(2),
            });

            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should be able to cancel part of an order', async () => {
            const cancelTakerTokenAmount = signedOrder.takerTokenAmount.div(2);
            await exWrapper.cancelOrderAsync(signedOrder, maker, {
                cancelTakerTokenAmount,
            });

            const res = await exWrapper.fillOrderAsync(signedOrder, taker, {
                fillTakerTokenAmount: signedOrder.takerTokenAmount,
            });
            const log = res.logs[0] as LogWithDecodedArgs<LogFillContractEventArgs>;
            expect(log.args.filledTakerTokenAmount).to.be.bignumber.equal(
                signedOrder.takerTokenAmount.minus(cancelTakerTokenAmount),
            );

            const newBalances = await dmyBalances.getAsync();
            const cancelMakerTokenAmount = cancelTakerTokenAmount
                .times(signedOrder.makerTokenAmount)
                .dividedToIntegerBy(signedOrder.takerTokenAmount);
            const paidMakerFee = signedOrder.makerFee
                .times(cancelMakerTokenAmount)
                .dividedToIntegerBy(signedOrder.makerTokenAmount);
            const paidTakerFee = signedOrder.takerFee
                .times(cancelMakerTokenAmount)
                .dividedToIntegerBy(signedOrder.makerTokenAmount);
            expect(newBalances[maker][signedOrder.makerTokenAddress]).to.be.bignumber.equal(
                balances[maker][signedOrder.makerTokenAddress].minus(cancelMakerTokenAmount),
            );
            expect(newBalances[maker][signedOrder.takerTokenAddress]).to.be.bignumber.equal(
                balances[maker][signedOrder.takerTokenAddress].add(cancelTakerTokenAmount),
            );
            expect(newBalances[maker][zrx.address]).to.be.bignumber.equal(
                balances[maker][zrx.address].minus(paidMakerFee),
            );
            expect(newBalances[taker][signedOrder.takerTokenAddress]).to.be.bignumber.equal(
                balances[taker][signedOrder.takerTokenAddress].minus(cancelTakerTokenAmount),
            );
            expect(newBalances[taker][signedOrder.makerTokenAddress]).to.be.bignumber.equal(
                balances[taker][signedOrder.makerTokenAddress].add(cancelMakerTokenAmount),
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
            const res = await exWrapper.cancelOrderAsync(signedOrder, maker, {
                cancelTakerTokenAmount: signedOrder.takerTokenAmount.div(divisor),
            });
            expect(res.logs).to.have.length(1);

            const log = res.logs[0] as LogWithDecodedArgs<LogCancelContractEventArgs>;
            const logArgs = log.args;
            const expectedCancelledMakerTokenAmount = signedOrder.makerTokenAmount.div(divisor);
            const expectedCancelledTakerTokenAmount = signedOrder.takerTokenAmount.div(divisor);
            const tokensHashBuff = crypto.solSHA3([signedOrder.makerTokenAddress, signedOrder.takerTokenAddress]);
            const expectedTokens = ethUtil.bufferToHex(tokensHashBuff);

            expect(signedOrder.maker).to.be.equal(logArgs.maker);
            expect(signedOrder.feeRecipient).to.be.equal(logArgs.feeRecipient);
            expect(signedOrder.makerTokenAddress).to.be.equal(logArgs.makerToken);
            expect(signedOrder.takerTokenAddress).to.be.equal(logArgs.takerToken);
            expect(expectedCancelledMakerTokenAmount).to.be.bignumber.equal(logArgs.cancelledMakerTokenAmount);
            expect(expectedCancelledTakerTokenAmount).to.be.bignumber.equal(logArgs.cancelledTakerTokenAmount);
            expect(expectedTokens).to.be.equal(logArgs.tokens);
            expect(ZeroEx.getOrderHashHex(signedOrder)).to.be.equal(logArgs.orderHash);
        });

        it('should not log events if no value is cancelled', async () => {
            await exWrapper.cancelOrderAsync(signedOrder, maker);

            const res = await exWrapper.cancelOrderAsync(signedOrder, maker);
            expect(res.logs).to.have.length(1);
            const log = res.logs[0] as LogWithDecodedArgs<LogErrorContractEventArgs>;
            const errCode = log.args.errorId;
            expect(errCode).to.be.equal(ExchangeContractErrs.ERROR_ORDER_FULLY_FILLED_OR_CANCELLED);
        });

        it('should not log events if order is expired', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                expirationUnixTimestampSec: new BigNumber(Math.floor((Date.now() - 10000) / 1000)),
            });

            const res = await exWrapper.cancelOrderAsync(signedOrder, maker);
            expect(res.logs).to.have.length(1);
            const log = res.logs[0] as LogWithDecodedArgs<LogErrorContractEventArgs>;
            const errCode = log.args.errorId;
            expect(errCode).to.be.equal(ExchangeContractErrs.ERROR_ORDER_EXPIRED);
        });
    });
}); // tslint:disable-line:max-file-line-count
