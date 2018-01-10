import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import * as _ from 'lodash';
import 'mocha';
import * as Web3 from 'web3';

import {
    BlockRange,
    DecodedLogEvent,
    ExchangeContractErrs,
    ExchangeEvents,
    LogCancelContractEventArgs,
    LogFillContractEventArgs,
    OrderCancellationRequest,
    OrderFillRequest,
    SignedOrder,
    Token,
    ZeroEx,
} from '../src';
import { BlockParamLiteral, DoneCallback } from '../src/types';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';
import { FillScenarios } from './utils/fill_scenarios';
import { reportNodeCallbackErrors } from './utils/report_callback_errors';
import { TokenUtils } from './utils/token_utils';
import { web3Factory } from './utils/web3_factory';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(constants.RPC_URL);

const NON_EXISTENT_ORDER_HASH = '0x79370342234e7acd6bbeac335bd3bb1d368383294b64b8160a00f4060e4d3777';

describe('ExchangeWrapper', () => {
    let web3: Web3;
    let zeroEx: ZeroEx;
    let tokenUtils: TokenUtils;
    let tokens: Token[];
    let userAddresses: string[];
    let zrxTokenAddress: string;
    let fillScenarios: FillScenarios;
    let exchangeContractAddress: string;
    const config = {
        networkId: constants.TESTRPC_NETWORK_ID,
    };
    before(async () => {
        web3 = web3Factory.create();
        zeroEx = new ZeroEx(web3.currentProvider, config);
        exchangeContractAddress = zeroEx.exchange.getContractAddress();
        userAddresses = await zeroEx.getAvailableAddressesAsync();
        tokens = await zeroEx.tokenRegistry.getTokensAsync();
        tokenUtils = new TokenUtils(tokens);
        zrxTokenAddress = tokenUtils.getProtocolTokenOrThrow().address;
        fillScenarios = new FillScenarios(zeroEx, userAddresses, tokens, zrxTokenAddress, exchangeContractAddress);
        await fillScenarios.initTokenBalancesAsync();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('fillOrKill order(s)', () => {
        let makerTokenAddress: string;
        let takerTokenAddress: string;
        let coinbase: string;
        let makerAddress: string;
        let takerAddress: string;
        let feeRecipient: string;
        const takerTokenFillAmount = new BigNumber(5);
        before(async () => {
            [coinbase, makerAddress, takerAddress, feeRecipient] = userAddresses;
            tokens = await zeroEx.tokenRegistry.getTokensAsync();
            const [makerToken, takerToken] = tokenUtils.getDummyTokens();
            makerTokenAddress = makerToken.address;
            takerTokenAddress = takerToken.address;
        });
        describe('#batchFillOrKillAsync', () => {
            it('successfully batch fillOrKill', async () => {
                const fillableAmount = new BigNumber(5);
                const partialFillTakerAmount = new BigNumber(2);
                const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerTokenAddress,
                    takerTokenAddress,
                    makerAddress,
                    takerAddress,
                    fillableAmount,
                );
                const anotherSignedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerTokenAddress,
                    takerTokenAddress,
                    makerAddress,
                    takerAddress,
                    fillableAmount,
                );
                const orderFillRequests = [
                    {
                        signedOrder,
                        takerTokenFillAmount: partialFillTakerAmount,
                    },
                    {
                        signedOrder: anotherSignedOrder,
                        takerTokenFillAmount: partialFillTakerAmount,
                    },
                ];
                await zeroEx.exchange.batchFillOrKillAsync(orderFillRequests, takerAddress);
            });
            describe('order transaction options', () => {
                let signedOrder: SignedOrder;
                let orderFillRequests: OrderFillRequest[];
                const fillableAmount = new BigNumber(5);
                beforeEach(async () => {
                    signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                        makerTokenAddress,
                        takerTokenAddress,
                        makerAddress,
                        takerAddress,
                        fillableAmount,
                    );
                    orderFillRequests = [
                        {
                            signedOrder,
                            takerTokenFillAmount: new BigNumber(0),
                        },
                    ];
                });
                it('should validate when orderTransactionOptions are not present', async () => {
                    return expect(
                        zeroEx.exchange.batchFillOrKillAsync(orderFillRequests, takerAddress),
                    ).to.be.rejectedWith(ExchangeContractErrs.OrderFillAmountZero);
                });
                it('should validate when orderTransactionOptions specify to validate', async () => {
                    return expect(
                        zeroEx.exchange.batchFillOrKillAsync(orderFillRequests, takerAddress, {
                            shouldValidate: true,
                        }),
                    ).to.be.rejectedWith(ExchangeContractErrs.OrderFillAmountZero);
                });
                it('should not validate when orderTransactionOptions specify not to validate', async () => {
                    return expect(
                        zeroEx.exchange.batchFillOrKillAsync(orderFillRequests, takerAddress, {
                            shouldValidate: false,
                        }),
                    ).to.not.be.rejectedWith(ExchangeContractErrs.OrderFillAmountZero);
                });
            });
        });
        describe('#fillOrKillOrderAsync', () => {
            let signedOrder: SignedOrder;
            const fillableAmount = new BigNumber(5);
            beforeEach(async () => {
                signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerTokenAddress,
                    takerTokenAddress,
                    makerAddress,
                    takerAddress,
                    fillableAmount,
                );
            });
            describe('successful fills', () => {
                it('should fill a valid order', async () => {
                    expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, makerAddress)).to.be.bignumber.equal(
                        fillableAmount,
                    );
                    expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, makerAddress)).to.be.bignumber.equal(
                        0,
                    );
                    expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, takerAddress)).to.be.bignumber.equal(
                        0,
                    );
                    expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, takerAddress)).to.be.bignumber.equal(
                        fillableAmount,
                    );
                    await zeroEx.exchange.fillOrKillOrderAsync(signedOrder, takerTokenFillAmount, takerAddress);
                    expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, makerAddress)).to.be.bignumber.equal(
                        fillableAmount.minus(takerTokenFillAmount),
                    );
                    expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, makerAddress)).to.be.bignumber.equal(
                        takerTokenFillAmount,
                    );
                    expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, takerAddress)).to.be.bignumber.equal(
                        takerTokenFillAmount,
                    );
                    expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, takerAddress)).to.be.bignumber.equal(
                        fillableAmount.minus(takerTokenFillAmount),
                    );
                });
                it('should partially fill a valid order', async () => {
                    const partialFillAmount = new BigNumber(3);
                    await zeroEx.exchange.fillOrKillOrderAsync(signedOrder, partialFillAmount, takerAddress);
                    expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, makerAddress)).to.be.bignumber.equal(
                        fillableAmount.minus(partialFillAmount),
                    );
                    expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, makerAddress)).to.be.bignumber.equal(
                        partialFillAmount,
                    );
                    expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, takerAddress)).to.be.bignumber.equal(
                        partialFillAmount,
                    );
                    expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, takerAddress)).to.be.bignumber.equal(
                        fillableAmount.minus(partialFillAmount),
                    );
                });
            });
            describe('order transaction options', () => {
                const emptyFillableAmount = new BigNumber(0);
                it('should validate when orderTransactionOptions are not present', async () => {
                    return expect(
                        zeroEx.exchange.fillOrKillOrderAsync(signedOrder, emptyFillableAmount, takerAddress),
                    ).to.be.rejectedWith(ExchangeContractErrs.OrderFillAmountZero);
                });
                it('should validate when orderTransactionOptions specify to validate', async () => {
                    return expect(
                        zeroEx.exchange.fillOrKillOrderAsync(signedOrder, emptyFillableAmount, takerAddress, {
                            shouldValidate: true,
                        }),
                    ).to.be.rejectedWith(ExchangeContractErrs.OrderFillAmountZero);
                });
                it('should not validate when orderTransactionOptions specify not to validate', async () => {
                    return expect(
                        zeroEx.exchange.fillOrKillOrderAsync(signedOrder, emptyFillableAmount, takerAddress, {
                            shouldValidate: false,
                        }),
                    ).to.not.be.rejectedWith(ExchangeContractErrs.OrderFillAmountZero);
                });
            });
        });
    });
    describe('fill order(s)', () => {
        let makerTokenAddress: string;
        let takerTokenAddress: string;
        let coinbase: string;
        let makerAddress: string;
        let takerAddress: string;
        let feeRecipient: string;
        const fillableAmount = new BigNumber(5);
        const takerTokenFillAmount = new BigNumber(5);
        const shouldThrowOnInsufficientBalanceOrAllowance = true;
        before(async () => {
            [coinbase, makerAddress, takerAddress, feeRecipient] = userAddresses;
            tokens = await zeroEx.tokenRegistry.getTokensAsync();
            const [makerToken, takerToken] = tokenUtils.getDummyTokens();
            makerTokenAddress = makerToken.address;
            takerTokenAddress = takerToken.address;
        });
        describe('#fillOrderAsync', () => {
            describe('successful fills', () => {
                it('should fill a valid order', async () => {
                    const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                        makerTokenAddress,
                        takerTokenAddress,
                        makerAddress,
                        takerAddress,
                        fillableAmount,
                    );
                    expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, makerAddress)).to.be.bignumber.equal(
                        fillableAmount,
                    );
                    expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, makerAddress)).to.be.bignumber.equal(
                        0,
                    );
                    expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, takerAddress)).to.be.bignumber.equal(
                        0,
                    );
                    expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, takerAddress)).to.be.bignumber.equal(
                        fillableAmount,
                    );
                    const txHash = await zeroEx.exchange.fillOrderAsync(
                        signedOrder,
                        takerTokenFillAmount,
                        shouldThrowOnInsufficientBalanceOrAllowance,
                        takerAddress,
                    );
                    await zeroEx.awaitTransactionMinedAsync(txHash);
                    expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, makerAddress)).to.be.bignumber.equal(
                        fillableAmount.minus(takerTokenFillAmount),
                    );
                    expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, makerAddress)).to.be.bignumber.equal(
                        takerTokenFillAmount,
                    );
                    expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, takerAddress)).to.be.bignumber.equal(
                        takerTokenFillAmount,
                    );
                    expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, takerAddress)).to.be.bignumber.equal(
                        fillableAmount.minus(takerTokenFillAmount),
                    );
                });
                it('should partially fill the valid order', async () => {
                    const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                        makerTokenAddress,
                        takerTokenAddress,
                        makerAddress,
                        takerAddress,
                        fillableAmount,
                    );
                    const partialFillAmount = new BigNumber(3);
                    const txHash = await zeroEx.exchange.fillOrderAsync(
                        signedOrder,
                        partialFillAmount,
                        shouldThrowOnInsufficientBalanceOrAllowance,
                        takerAddress,
                    );
                    await zeroEx.awaitTransactionMinedAsync(txHash);
                    expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, makerAddress)).to.be.bignumber.equal(
                        fillableAmount.minus(partialFillAmount),
                    );
                    expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, makerAddress)).to.be.bignumber.equal(
                        partialFillAmount,
                    );
                    expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, takerAddress)).to.be.bignumber.equal(
                        partialFillAmount,
                    );
                    expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, takerAddress)).to.be.bignumber.equal(
                        fillableAmount.minus(partialFillAmount),
                    );
                });
                it('should fill the valid orders with fees', async () => {
                    const makerFee = new BigNumber(1);
                    const takerFee = new BigNumber(2);
                    const signedOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
                        makerTokenAddress,
                        takerTokenAddress,
                        makerFee,
                        takerFee,
                        makerAddress,
                        takerAddress,
                        fillableAmount,
                        feeRecipient,
                    );
                    const txHash = await zeroEx.exchange.fillOrderAsync(
                        signedOrder,
                        takerTokenFillAmount,
                        shouldThrowOnInsufficientBalanceOrAllowance,
                        takerAddress,
                    );
                    await zeroEx.awaitTransactionMinedAsync(txHash);
                    expect(await zeroEx.token.getBalanceAsync(zrxTokenAddress, feeRecipient)).to.be.bignumber.equal(
                        makerFee.plus(takerFee),
                    );
                });
            });
            describe('order transaction options', () => {
                let signedOrder: SignedOrder;
                const emptyFillTakerAmount = new BigNumber(0);
                beforeEach(async () => {
                    signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                        makerTokenAddress,
                        takerTokenAddress,
                        makerAddress,
                        takerAddress,
                        fillableAmount,
                    );
                });
                it('should validate when orderTransactionOptions are not present', async () => {
                    return expect(
                        zeroEx.exchange.fillOrderAsync(
                            signedOrder,
                            emptyFillTakerAmount,
                            shouldThrowOnInsufficientBalanceOrAllowance,
                            takerAddress,
                        ),
                    ).to.be.rejectedWith(ExchangeContractErrs.OrderFillAmountZero);
                });
                it('should validate when orderTransactionOptions specify to validate', async () => {
                    return expect(
                        zeroEx.exchange.fillOrderAsync(
                            signedOrder,
                            emptyFillTakerAmount,
                            shouldThrowOnInsufficientBalanceOrAllowance,
                            takerAddress,
                            {
                                shouldValidate: true,
                            },
                        ),
                    ).to.be.rejectedWith(ExchangeContractErrs.OrderFillAmountZero);
                });
                it('should not validate when orderTransactionOptions specify not to validate', async () => {
                    return expect(
                        zeroEx.exchange.fillOrderAsync(
                            signedOrder,
                            emptyFillTakerAmount,
                            shouldThrowOnInsufficientBalanceOrAllowance,
                            takerAddress,
                            {
                                shouldValidate: false,
                            },
                        ),
                    ).to.not.be.rejectedWith(ExchangeContractErrs.OrderFillAmountZero);
                });
            });
        });
        describe('#batchFillOrdersAsync', () => {
            let signedOrder: SignedOrder;
            let signedOrderHashHex: string;
            let anotherSignedOrder: SignedOrder;
            let anotherOrderHashHex: string;
            let orderFillBatch: OrderFillRequest[];
            beforeEach(async () => {
                signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerTokenAddress,
                    takerTokenAddress,
                    makerAddress,
                    takerAddress,
                    fillableAmount,
                );
                signedOrderHashHex = ZeroEx.getOrderHashHex(signedOrder);
                anotherSignedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerTokenAddress,
                    takerTokenAddress,
                    makerAddress,
                    takerAddress,
                    fillableAmount,
                );
                anotherOrderHashHex = ZeroEx.getOrderHashHex(anotherSignedOrder);
            });
            describe('successful batch fills', () => {
                beforeEach(() => {
                    orderFillBatch = [
                        {
                            signedOrder,
                            takerTokenFillAmount,
                        },
                        {
                            signedOrder: anotherSignedOrder,
                            takerTokenFillAmount,
                        },
                    ];
                });
                it('should throw if a batch is empty', async () => {
                    return expect(
                        zeroEx.exchange.batchFillOrdersAsync(
                            [],
                            shouldThrowOnInsufficientBalanceOrAllowance,
                            takerAddress,
                        ),
                    ).to.be.rejectedWith(ExchangeContractErrs.BatchOrdersMustHaveAtLeastOneItem);
                });
                it('should successfully fill multiple orders', async () => {
                    const txHash = await zeroEx.exchange.batchFillOrdersAsync(
                        orderFillBatch,
                        shouldThrowOnInsufficientBalanceOrAllowance,
                        takerAddress,
                    );
                    await zeroEx.awaitTransactionMinedAsync(txHash);
                    const filledAmount = await zeroEx.exchange.getFilledTakerAmountAsync(signedOrderHashHex);
                    const anotherFilledAmount = await zeroEx.exchange.getFilledTakerAmountAsync(anotherOrderHashHex);
                    expect(filledAmount).to.be.bignumber.equal(takerTokenFillAmount);
                    expect(anotherFilledAmount).to.be.bignumber.equal(takerTokenFillAmount);
                });
            });
            describe('order transaction options', () => {
                beforeEach(async () => {
                    const emptyFillTakerAmount = new BigNumber(0);
                    orderFillBatch = [
                        {
                            signedOrder,
                            takerTokenFillAmount: emptyFillTakerAmount,
                        },
                        {
                            signedOrder: anotherSignedOrder,
                            takerTokenFillAmount: emptyFillTakerAmount,
                        },
                    ];
                });
                it('should validate when orderTransactionOptions are not present', async () => {
                    return expect(
                        zeroEx.exchange.batchFillOrdersAsync(
                            orderFillBatch,
                            shouldThrowOnInsufficientBalanceOrAllowance,
                            takerAddress,
                        ),
                    ).to.be.rejectedWith(ExchangeContractErrs.OrderFillAmountZero);
                });
                it('should validate when orderTransactionOptions specify to validate', async () => {
                    return expect(
                        zeroEx.exchange.batchFillOrdersAsync(
                            orderFillBatch,
                            shouldThrowOnInsufficientBalanceOrAllowance,
                            takerAddress,
                            {
                                shouldValidate: true,
                            },
                        ),
                    ).to.be.rejectedWith(ExchangeContractErrs.OrderFillAmountZero);
                });
                it('should not validate when orderTransactionOptions specify not to validate', async () => {
                    return expect(
                        zeroEx.exchange.batchFillOrdersAsync(
                            orderFillBatch,
                            shouldThrowOnInsufficientBalanceOrAllowance,
                            takerAddress,
                            {
                                shouldValidate: false,
                            },
                        ),
                    ).to.not.be.rejectedWith(ExchangeContractErrs.OrderFillAmountZero);
                });
            });
        });
        describe('#fillOrdersUpTo', () => {
            let signedOrder: SignedOrder;
            let signedOrderHashHex: string;
            let anotherSignedOrder: SignedOrder;
            let anotherOrderHashHex: string;
            let signedOrders: SignedOrder[];
            const fillUpToAmount = fillableAmount.plus(fillableAmount).minus(1);
            beforeEach(async () => {
                signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerTokenAddress,
                    takerTokenAddress,
                    makerAddress,
                    takerAddress,
                    fillableAmount,
                );
                signedOrderHashHex = ZeroEx.getOrderHashHex(signedOrder);
                anotherSignedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerTokenAddress,
                    takerTokenAddress,
                    makerAddress,
                    takerAddress,
                    fillableAmount,
                );
                anotherOrderHashHex = ZeroEx.getOrderHashHex(anotherSignedOrder);
                signedOrders = [signedOrder, anotherSignedOrder];
            });
            describe('successful batch fills', () => {
                it('should throw if a batch is empty', async () => {
                    return expect(
                        zeroEx.exchange.fillOrdersUpToAsync(
                            [],
                            fillUpToAmount,
                            shouldThrowOnInsufficientBalanceOrAllowance,
                            takerAddress,
                        ),
                    ).to.be.rejectedWith(ExchangeContractErrs.BatchOrdersMustHaveAtLeastOneItem);
                });
                it('should successfully fill up to specified amount', async () => {
                    const txHash = await zeroEx.exchange.fillOrdersUpToAsync(
                        signedOrders,
                        fillUpToAmount,
                        shouldThrowOnInsufficientBalanceOrAllowance,
                        takerAddress,
                    );
                    await zeroEx.awaitTransactionMinedAsync(txHash);
                    const filledAmount = await zeroEx.exchange.getFilledTakerAmountAsync(signedOrderHashHex);
                    const anotherFilledAmount = await zeroEx.exchange.getFilledTakerAmountAsync(anotherOrderHashHex);
                    expect(filledAmount).to.be.bignumber.equal(fillableAmount);
                    const remainingFillAmount = fillableAmount.minus(1);
                    expect(anotherFilledAmount).to.be.bignumber.equal(remainingFillAmount);
                });
            });
            describe('order transaction options', () => {
                const emptyFillUpToAmount = new BigNumber(0);
                it('should validate when orderTransactionOptions are not present', async () => {
                    return expect(
                        zeroEx.exchange.fillOrdersUpToAsync(
                            signedOrders,
                            emptyFillUpToAmount,
                            shouldThrowOnInsufficientBalanceOrAllowance,
                            takerAddress,
                        ),
                    ).to.be.rejectedWith(ExchangeContractErrs.OrderFillAmountZero);
                });
                it('should validate when orderTransactionOptions specify to validate', async () => {
                    return expect(
                        zeroEx.exchange.fillOrdersUpToAsync(
                            signedOrders,
                            emptyFillUpToAmount,
                            shouldThrowOnInsufficientBalanceOrAllowance,
                            takerAddress,
                            {
                                shouldValidate: true,
                            },
                        ),
                    ).to.be.rejectedWith(ExchangeContractErrs.OrderFillAmountZero);
                });
                it('should not validate when orderTransactionOptions specify not to validate', async () => {
                    return expect(
                        zeroEx.exchange.fillOrdersUpToAsync(
                            signedOrders,
                            emptyFillUpToAmount,
                            shouldThrowOnInsufficientBalanceOrAllowance,
                            takerAddress,
                            {
                                shouldValidate: false,
                            },
                        ),
                    ).to.not.be.rejectedWith(ExchangeContractErrs.OrderFillAmountZero);
                });
            });
        });
    });
    describe('cancel order(s)', () => {
        let makerTokenAddress: string;
        let takerTokenAddress: string;
        let coinbase: string;
        let makerAddress: string;
        let takerAddress: string;
        const fillableAmount = new BigNumber(5);
        let signedOrder: SignedOrder;
        let orderHashHex: string;
        const cancelAmount = new BigNumber(3);
        beforeEach(async () => {
            [coinbase, makerAddress, takerAddress] = userAddresses;
            const [makerToken, takerToken] = tokenUtils.getDummyTokens();
            makerTokenAddress = makerToken.address;
            takerTokenAddress = takerToken.address;
            signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress,
                takerTokenAddress,
                makerAddress,
                takerAddress,
                fillableAmount,
            );
            orderHashHex = ZeroEx.getOrderHashHex(signedOrder);
        });
        describe('#cancelOrderAsync', () => {
            describe('successful cancels', () => {
                it('should cancel an order', async () => {
                    const txHash = await zeroEx.exchange.cancelOrderAsync(signedOrder, cancelAmount);
                    await zeroEx.awaitTransactionMinedAsync(txHash);
                    const cancelledAmount = await zeroEx.exchange.getCancelledTakerAmountAsync(orderHashHex);
                    expect(cancelledAmount).to.be.bignumber.equal(cancelAmount);
                });
            });
            describe('order transaction options', () => {
                const emptyCancelTakerTokenAmount = new BigNumber(0);
                it('should validate when orderTransactionOptions are not present', async () => {
                    return expect(
                        zeroEx.exchange.cancelOrderAsync(signedOrder, emptyCancelTakerTokenAmount),
                    ).to.be.rejectedWith(ExchangeContractErrs.OrderCancelAmountZero);
                });
                it('should validate when orderTransactionOptions specify to validate', async () => {
                    return expect(
                        zeroEx.exchange.cancelOrderAsync(signedOrder, emptyCancelTakerTokenAmount, {
                            shouldValidate: true,
                        }),
                    ).to.be.rejectedWith(ExchangeContractErrs.OrderCancelAmountZero);
                });
                it('should not validate when orderTransactionOptions specify not to validate', async () => {
                    return expect(
                        zeroEx.exchange.cancelOrderAsync(signedOrder, emptyCancelTakerTokenAmount, {
                            shouldValidate: false,
                        }),
                    ).to.not.be.rejectedWith(ExchangeContractErrs.OrderCancelAmountZero);
                });
            });
        });
        describe('#batchCancelOrdersAsync', () => {
            let anotherSignedOrder: SignedOrder;
            let anotherOrderHashHex: string;
            let cancelBatch: OrderCancellationRequest[];
            beforeEach(async () => {
                anotherSignedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerTokenAddress,
                    takerTokenAddress,
                    makerAddress,
                    takerAddress,
                    fillableAmount,
                );
                anotherOrderHashHex = ZeroEx.getOrderHashHex(anotherSignedOrder);
                cancelBatch = [
                    {
                        order: signedOrder,
                        takerTokenCancelAmount: cancelAmount,
                    },
                    {
                        order: anotherSignedOrder,
                        takerTokenCancelAmount: cancelAmount,
                    },
                ];
            });
            describe('failed batch cancels', () => {
                it('should throw when orders have different makers', async () => {
                    const signedOrderWithDifferentMaker = await fillScenarios.createFillableSignedOrderAsync(
                        makerTokenAddress,
                        takerTokenAddress,
                        takerAddress,
                        takerAddress,
                        fillableAmount,
                    );
                    return expect(
                        zeroEx.exchange.batchCancelOrdersAsync([
                            cancelBatch[0],
                            {
                                order: signedOrderWithDifferentMaker,
                                takerTokenCancelAmount: cancelAmount,
                            },
                        ]),
                    ).to.be.rejectedWith(ExchangeContractErrs.MultipleMakersInSingleCancelBatchDisallowed);
                });
            });
            describe('successful batch cancels', () => {
                it('should cancel a batch of orders', async () => {
                    await zeroEx.exchange.batchCancelOrdersAsync(cancelBatch);
                    const cancelledAmount = await zeroEx.exchange.getCancelledTakerAmountAsync(orderHashHex);
                    const anotherCancelledAmount = await zeroEx.exchange.getCancelledTakerAmountAsync(
                        anotherOrderHashHex,
                    );
                    expect(cancelledAmount).to.be.bignumber.equal(cancelAmount);
                    expect(anotherCancelledAmount).to.be.bignumber.equal(cancelAmount);
                });
            });
            describe('order transaction options', () => {
                beforeEach(async () => {
                    const emptyTakerTokenCancelAmount = new BigNumber(0);
                    cancelBatch = [
                        {
                            order: signedOrder,
                            takerTokenCancelAmount: emptyTakerTokenCancelAmount,
                        },
                        {
                            order: anotherSignedOrder,
                            takerTokenCancelAmount: emptyTakerTokenCancelAmount,
                        },
                    ];
                });
                it('should validate when orderTransactionOptions are not present', async () => {
                    return expect(zeroEx.exchange.batchCancelOrdersAsync(cancelBatch)).to.be.rejectedWith(
                        ExchangeContractErrs.OrderCancelAmountZero,
                    );
                });
                it('should validate when orderTransactionOptions specify to validate', async () => {
                    return expect(
                        zeroEx.exchange.batchCancelOrdersAsync(cancelBatch, {
                            shouldValidate: true,
                        }),
                    ).to.be.rejectedWith(ExchangeContractErrs.OrderCancelAmountZero);
                });
                it('should not validate when orderTransactionOptions specify not to validate', async () => {
                    return expect(
                        zeroEx.exchange.batchCancelOrdersAsync(cancelBatch, {
                            shouldValidate: false,
                        }),
                    ).to.not.be.rejectedWith(ExchangeContractErrs.OrderCancelAmountZero);
                });
            });
        });
    });
    describe('tests that require partially filled order', () => {
        let makerTokenAddress: string;
        let takerTokenAddress: string;
        let takerAddress: string;
        let fillableAmount: BigNumber;
        let partialFillAmount: BigNumber;
        let signedOrder: SignedOrder;
        let orderHash: string;
        before(() => {
            takerAddress = userAddresses[1];
            tokenUtils = new TokenUtils(tokens);
            const [makerToken, takerToken] = tokenUtils.getDummyTokens();
            makerTokenAddress = makerToken.address;
            takerTokenAddress = takerToken.address;
        });
        beforeEach(async () => {
            fillableAmount = new BigNumber(5);
            partialFillAmount = new BigNumber(2);
            signedOrder = await fillScenarios.createPartiallyFilledSignedOrderAsync(
                makerTokenAddress,
                takerTokenAddress,
                takerAddress,
                fillableAmount,
                partialFillAmount,
            );
            orderHash = ZeroEx.getOrderHashHex(signedOrder);
        });
        describe('#getUnavailableTakerAmountAsync', () => {
            it('should throw if passed an invalid orderHash', async () => {
                const invalidOrderHashHex = '0x123';
                return expect(zeroEx.exchange.getUnavailableTakerAmountAsync(invalidOrderHashHex)).to.be.rejected();
            });
            it('should return zero if passed a valid but non-existent orderHash', async () => {
                const unavailableValueT = await zeroEx.exchange.getUnavailableTakerAmountAsync(NON_EXISTENT_ORDER_HASH);
                expect(unavailableValueT).to.be.bignumber.equal(0);
            });
            it('should return the unavailableValueT for a valid and partially filled orderHash', async () => {
                const unavailableValueT = await zeroEx.exchange.getUnavailableTakerAmountAsync(orderHash);
                expect(unavailableValueT).to.be.bignumber.equal(partialFillAmount);
            });
        });
        describe('#getFilledTakerAmountAsync', () => {
            it('should throw if passed an invalid orderHash', async () => {
                const invalidOrderHashHex = '0x123';
                return expect(zeroEx.exchange.getFilledTakerAmountAsync(invalidOrderHashHex)).to.be.rejected();
            });
            it('should return zero if passed a valid but non-existent orderHash', async () => {
                const filledValueT = await zeroEx.exchange.getFilledTakerAmountAsync(NON_EXISTENT_ORDER_HASH);
                expect(filledValueT).to.be.bignumber.equal(0);
            });
            it('should return the filledValueT for a valid and partially filled orderHash', async () => {
                const filledValueT = await zeroEx.exchange.getFilledTakerAmountAsync(orderHash);
                expect(filledValueT).to.be.bignumber.equal(partialFillAmount);
            });
        });
        describe('#getCancelledTakerAmountAsync', () => {
            it('should throw if passed an invalid orderHash', async () => {
                const invalidOrderHashHex = '0x123';
                return expect(zeroEx.exchange.getCancelledTakerAmountAsync(invalidOrderHashHex)).to.be.rejected();
            });
            it('should return zero if passed a valid but non-existent orderHash', async () => {
                const cancelledValueT = await zeroEx.exchange.getCancelledTakerAmountAsync(NON_EXISTENT_ORDER_HASH);
                expect(cancelledValueT).to.be.bignumber.equal(0);
            });
            it('should return the cancelledValueT for a valid and partially filled orderHash', async () => {
                const cancelledValueT = await zeroEx.exchange.getCancelledTakerAmountAsync(orderHash);
                expect(cancelledValueT).to.be.bignumber.equal(0);
            });
            it('should return the cancelledValueT for a valid and cancelled orderHash', async () => {
                const cancelAmount = fillableAmount.minus(partialFillAmount);
                await zeroEx.exchange.cancelOrderAsync(signedOrder, cancelAmount);
                const cancelledValueT = await zeroEx.exchange.getCancelledTakerAmountAsync(orderHash);
                expect(cancelledValueT).to.be.bignumber.equal(cancelAmount);
            });
        });
    });
    describe('#subscribe', () => {
        const indexFilterValues = {};
        const shouldThrowOnInsufficientBalanceOrAllowance = true;
        let makerTokenAddress: string;
        let takerTokenAddress: string;
        let coinbase: string;
        let takerAddress: string;
        let makerAddress: string;
        let fillableAmount: BigNumber;
        let signedOrder: SignedOrder;
        const takerTokenFillAmountInBaseUnits = new BigNumber(1);
        const cancelTakerAmountInBaseUnits = new BigNumber(1);
        before(() => {
            [coinbase, makerAddress, takerAddress] = userAddresses;
            const [makerToken, takerToken] = tokenUtils.getDummyTokens();
            makerTokenAddress = makerToken.address;
            takerTokenAddress = takerToken.address;
        });
        beforeEach(async () => {
            fillableAmount = new BigNumber(5);
            signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress,
                takerTokenAddress,
                makerAddress,
                takerAddress,
                fillableAmount,
            );
        });
        afterEach(async () => {
            zeroEx.exchange.unsubscribeAll();
        });
        // Hack: Mocha does not allow a test to be both async and have a `done` callback
        // Since we need to await the receipt of the event in the `subscribe` callback,
        // we do need both. A hack is to make the top-level a sync fn w/ a done callback and then
        // wrap the rest of the test in an async block
        // Source: https://github.com/mochajs/mocha/issues/2407
        it('Should receive the LogFill event when an order is filled', (done: DoneCallback) => {
            (async () => {
                const callback = reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<LogFillContractEventArgs>) => {
                        expect(logEvent.log.event).to.be.equal(ExchangeEvents.LogFill);
                    },
                );
                zeroEx.exchange.subscribe(ExchangeEvents.LogFill, indexFilterValues, callback);
                await zeroEx.exchange.fillOrderAsync(
                    signedOrder,
                    takerTokenFillAmountInBaseUnits,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    takerAddress,
                );
            })().catch(done);
        });
        it('Should receive the LogCancel event when an order is cancelled', (done: DoneCallback) => {
            (async () => {
                const callback = reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<LogCancelContractEventArgs>) => {
                        expect(logEvent.log.event).to.be.equal(ExchangeEvents.LogCancel);
                    },
                );
                zeroEx.exchange.subscribe(ExchangeEvents.LogCancel, indexFilterValues, callback);
                await zeroEx.exchange.cancelOrderAsync(signedOrder, cancelTakerAmountInBaseUnits);
            })().catch(done);
        });
        it('Outstanding subscriptions are cancelled when zeroEx.setProvider called', (done: DoneCallback) => {
            (async () => {
                const callbackNeverToBeCalled = reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<LogFillContractEventArgs>) => {
                        done(new Error('Expected this subscription to have been cancelled'));
                    },
                );
                zeroEx.exchange.subscribe(ExchangeEvents.LogFill, indexFilterValues, callbackNeverToBeCalled);

                const newProvider = web3Factory.getRpcProvider();
                zeroEx.setProvider(newProvider, constants.TESTRPC_NETWORK_ID);

                const callback = reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<LogFillContractEventArgs>) => {
                        expect(logEvent.log.event).to.be.equal(ExchangeEvents.LogFill);
                    },
                );
                zeroEx.exchange.subscribe(ExchangeEvents.LogFill, indexFilterValues, callback);
                await zeroEx.exchange.fillOrderAsync(
                    signedOrder,
                    takerTokenFillAmountInBaseUnits,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    takerAddress,
                );
            })().catch(done);
        });
        it('Should cancel subscription when unsubscribe called', (done: DoneCallback) => {
            (async () => {
                const callbackNeverToBeCalled = reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<LogFillContractEventArgs>) => {
                        done(new Error('Expected this subscription to have been cancelled'));
                    },
                );
                const subscriptionToken = zeroEx.exchange.subscribe(
                    ExchangeEvents.LogFill,
                    indexFilterValues,
                    callbackNeverToBeCalled,
                );
                zeroEx.exchange.unsubscribe(subscriptionToken);
                await zeroEx.exchange.fillOrderAsync(
                    signedOrder,
                    takerTokenFillAmountInBaseUnits,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    takerAddress,
                );
                done();
            })().catch(done);
        });
    });
    describe('#getOrderHashHexUsingContractCallAsync', () => {
        let makerTokenAddress: string;
        let takerTokenAddress: string;
        let makerAddress: string;
        let takerAddress: string;
        const fillableAmount = new BigNumber(5);
        before(async () => {
            [, makerAddress, takerAddress] = userAddresses;
            const [makerToken, takerToken] = tokenUtils.getDummyTokens();
            makerTokenAddress = makerToken.address;
            takerTokenAddress = takerToken.address;
        });
        it("get's the same hash as the local function", async () => {
            const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress,
                takerTokenAddress,
                makerAddress,
                takerAddress,
                fillableAmount,
            );
            const orderHash = ZeroEx.getOrderHashHex(signedOrder);
            const orderHashFromContract = await (zeroEx.exchange as any)._getOrderHashHexUsingContractCallAsync(
                signedOrder,
            );
            expect(orderHash).to.equal(orderHashFromContract);
        });
    });
    describe('#getZRXTokenAddressAsync', () => {
        it('gets the same token as is in token registry', () => {
            const zrxAddress = zeroEx.exchange.getZRXTokenAddress();
            const zrxToken = tokenUtils.getProtocolTokenOrThrow();
            expect(zrxAddress).to.equal(zrxToken.address);
        });
    });
    describe('#getLogsAsync', () => {
        let makerTokenAddress: string;
        let takerTokenAddress: string;
        let makerAddress: string;
        let takerAddress: string;
        const fillableAmount = new BigNumber(5);
        const shouldThrowOnInsufficientBalanceOrAllowance = true;
        const blockRange: BlockRange = {
            fromBlock: 0,
            toBlock: BlockParamLiteral.Latest,
        };
        let txHash: string;
        before(async () => {
            [, makerAddress, takerAddress] = userAddresses;
            const [makerToken, takerToken] = tokenUtils.getDummyTokens();
            makerTokenAddress = makerToken.address;
            takerTokenAddress = takerToken.address;
        });
        it('should get logs with decoded args emitted by LogFill', async () => {
            const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress,
                takerTokenAddress,
                makerAddress,
                takerAddress,
                fillableAmount,
            );
            txHash = await zeroEx.exchange.fillOrderAsync(
                signedOrder,
                fillableAmount,
                shouldThrowOnInsufficientBalanceOrAllowance,
                takerAddress,
            );
            await zeroEx.awaitTransactionMinedAsync(txHash);
            const eventName = ExchangeEvents.LogFill;
            const indexFilterValues = {};
            const logs = await zeroEx.exchange.getLogsAsync(eventName, blockRange, indexFilterValues);
            expect(logs).to.have.length(1);
            expect(logs[0].event).to.be.equal(eventName);
        });
        it('should only get the logs with the correct event name', async () => {
            const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress,
                takerTokenAddress,
                makerAddress,
                takerAddress,
                fillableAmount,
            );
            txHash = await zeroEx.exchange.fillOrderAsync(
                signedOrder,
                fillableAmount,
                shouldThrowOnInsufficientBalanceOrAllowance,
                takerAddress,
            );
            await zeroEx.awaitTransactionMinedAsync(txHash);
            const differentEventName = ExchangeEvents.LogCancel;
            const indexFilterValues = {};
            const logs = await zeroEx.exchange.getLogsAsync(differentEventName, blockRange, indexFilterValues);
            expect(logs).to.have.length(0);
        });
        it('should only get the logs with the correct indexed fields', async () => {
            const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress,
                takerTokenAddress,
                makerAddress,
                takerAddress,
                fillableAmount,
            );
            txHash = await zeroEx.exchange.fillOrderAsync(
                signedOrder,
                fillableAmount,
                shouldThrowOnInsufficientBalanceOrAllowance,
                takerAddress,
            );
            await zeroEx.awaitTransactionMinedAsync(txHash);

            const differentMakerAddress = userAddresses[2];
            const anotherSignedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress,
                takerTokenAddress,
                differentMakerAddress,
                takerAddress,
                fillableAmount,
            );
            txHash = await zeroEx.exchange.fillOrderAsync(
                anotherSignedOrder,
                fillableAmount,
                shouldThrowOnInsufficientBalanceOrAllowance,
                takerAddress,
            );
            await zeroEx.awaitTransactionMinedAsync(txHash);

            const eventName = ExchangeEvents.LogFill;
            const indexFilterValues = {
                maker: differentMakerAddress,
            };
            const logs = await zeroEx.exchange.getLogsAsync<LogFillContractEventArgs>(
                eventName,
                blockRange,
                indexFilterValues,
            );
            expect(logs).to.have.length(1);
            const args = logs[0].args;
            expect(args.maker).to.be.equal(differentMakerAddress);
        });
    });
}); // tslint:disable:max-file-line-count
