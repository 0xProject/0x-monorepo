import { BlockchainLifecycle, callbackErrorReporter, devConstants, web3Factory } from '@0xproject/dev-utils';
import { FillScenarios } from '@0xproject/fill-scenarios';
import { getOrderHashHex } from '@0xproject/order-utils';
import { BlockParamLiteral, DoneCallback, OrderState } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import * as _ from 'lodash';
import 'make-promises-safe';
import 'mocha';

import {
    BlockRange,
    ContractWrappers,
    DecodedLogEvent,
    ExchangeContractErrs,
    ExchangeEvents,
    LogCancelContractEventArgs,
    LogFillContractEventArgs,
    OrderCancellationRequest,
    OrderFillRequest,
    SignedOrder,
    Token,
} from '../src';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';
import { TokenUtils } from './utils/token_utils';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

const NON_EXISTENT_ORDER_HASH = '0x79370342234e7acd6bbeac335bd3bb1d368383294b64b8160a00f4060e4d3777';

describe('ExchangeWrapper', () => {
    let contractWrappers: ContractWrappers;
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
        contractWrappers = new ContractWrappers(provider, config);
        exchangeContractAddress = contractWrappers.exchange.getContractAddress();
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
        tokens = await contractWrappers.tokenRegistry.getTokensAsync();
        tokenUtils = new TokenUtils(tokens);
        zrxTokenAddress = tokenUtils.getProtocolTokenOrThrow().address;
        fillScenarios = new FillScenarios(provider, userAddresses, tokens, zrxTokenAddress, exchangeContractAddress);
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
            tokens = await contractWrappers.tokenRegistry.getTokensAsync();
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
                await contractWrappers.exchange.batchFillOrKillAsync(orderFillRequests, takerAddress);
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
                        contractWrappers.exchange.batchFillOrKillAsync(orderFillRequests, takerAddress),
                    ).to.be.rejectedWith(ExchangeContractErrs.OrderFillAmountZero);
                });
                it('should validate when orderTransactionOptions specify to validate', async () => {
                    return expect(
                        contractWrappers.exchange.batchFillOrKillAsync(orderFillRequests, takerAddress, {
                            shouldValidate: true,
                        }),
                    ).to.be.rejectedWith(ExchangeContractErrs.OrderFillAmountZero);
                });
                it('should not validate when orderTransactionOptions specify not to validate', async () => {
                    return expect(
                        contractWrappers.exchange.batchFillOrKillAsync(orderFillRequests, takerAddress, {
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
                    expect(
                        await contractWrappers.token.getBalanceAsync(makerTokenAddress, makerAddress),
                    ).to.be.bignumber.equal(fillableAmount);
                    expect(
                        await contractWrappers.token.getBalanceAsync(takerTokenAddress, makerAddress),
                    ).to.be.bignumber.equal(0);
                    expect(
                        await contractWrappers.token.getBalanceAsync(makerTokenAddress, takerAddress),
                    ).to.be.bignumber.equal(0);
                    expect(
                        await contractWrappers.token.getBalanceAsync(takerTokenAddress, takerAddress),
                    ).to.be.bignumber.equal(fillableAmount);
                    await contractWrappers.exchange.fillOrKillOrderAsync(
                        signedOrder,
                        takerTokenFillAmount,
                        takerAddress,
                    );
                    expect(
                        await contractWrappers.token.getBalanceAsync(makerTokenAddress, makerAddress),
                    ).to.be.bignumber.equal(fillableAmount.minus(takerTokenFillAmount));
                    expect(
                        await contractWrappers.token.getBalanceAsync(takerTokenAddress, makerAddress),
                    ).to.be.bignumber.equal(takerTokenFillAmount);
                    expect(
                        await contractWrappers.token.getBalanceAsync(makerTokenAddress, takerAddress),
                    ).to.be.bignumber.equal(takerTokenFillAmount);
                    expect(
                        await contractWrappers.token.getBalanceAsync(takerTokenAddress, takerAddress),
                    ).to.be.bignumber.equal(fillableAmount.minus(takerTokenFillAmount));
                });
                it('should partially fill a valid order', async () => {
                    const partialFillAmount = new BigNumber(3);
                    await contractWrappers.exchange.fillOrKillOrderAsync(signedOrder, partialFillAmount, takerAddress);
                    expect(
                        await contractWrappers.token.getBalanceAsync(makerTokenAddress, makerAddress),
                    ).to.be.bignumber.equal(fillableAmount.minus(partialFillAmount));
                    expect(
                        await contractWrappers.token.getBalanceAsync(takerTokenAddress, makerAddress),
                    ).to.be.bignumber.equal(partialFillAmount);
                    expect(
                        await contractWrappers.token.getBalanceAsync(makerTokenAddress, takerAddress),
                    ).to.be.bignumber.equal(partialFillAmount);
                    expect(
                        await contractWrappers.token.getBalanceAsync(takerTokenAddress, takerAddress),
                    ).to.be.bignumber.equal(fillableAmount.minus(partialFillAmount));
                });
            });
            describe('order transaction options', () => {
                const emptyFillableAmount = new BigNumber(0);
                it('should validate when orderTransactionOptions are not present', async () => {
                    return expect(
                        contractWrappers.exchange.fillOrKillOrderAsync(signedOrder, emptyFillableAmount, takerAddress),
                    ).to.be.rejectedWith(ExchangeContractErrs.OrderFillAmountZero);
                });
                it('should validate when orderTransactionOptions specify to validate', async () => {
                    return expect(
                        contractWrappers.exchange.fillOrKillOrderAsync(signedOrder, emptyFillableAmount, takerAddress, {
                            shouldValidate: true,
                        }),
                    ).to.be.rejectedWith(ExchangeContractErrs.OrderFillAmountZero);
                });
                it('should not validate when orderTransactionOptions specify not to validate', async () => {
                    return expect(
                        contractWrappers.exchange.fillOrKillOrderAsync(signedOrder, emptyFillableAmount, takerAddress, {
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
            tokens = await contractWrappers.tokenRegistry.getTokensAsync();
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
                    expect(
                        await contractWrappers.token.getBalanceAsync(makerTokenAddress, makerAddress),
                    ).to.be.bignumber.equal(fillableAmount);
                    expect(
                        await contractWrappers.token.getBalanceAsync(takerTokenAddress, makerAddress),
                    ).to.be.bignumber.equal(0);
                    expect(
                        await contractWrappers.token.getBalanceAsync(makerTokenAddress, takerAddress),
                    ).to.be.bignumber.equal(0);
                    expect(
                        await contractWrappers.token.getBalanceAsync(takerTokenAddress, takerAddress),
                    ).to.be.bignumber.equal(fillableAmount);
                    const txHash = await contractWrappers.exchange.fillOrderAsync(
                        signedOrder,
                        takerTokenFillAmount,
                        shouldThrowOnInsufficientBalanceOrAllowance,
                        takerAddress,
                    );
                    await web3Wrapper.awaitTransactionMinedAsync(txHash);
                    expect(
                        await contractWrappers.token.getBalanceAsync(makerTokenAddress, makerAddress),
                    ).to.be.bignumber.equal(fillableAmount.minus(takerTokenFillAmount));
                    expect(
                        await contractWrappers.token.getBalanceAsync(takerTokenAddress, makerAddress),
                    ).to.be.bignumber.equal(takerTokenFillAmount);
                    expect(
                        await contractWrappers.token.getBalanceAsync(makerTokenAddress, takerAddress),
                    ).to.be.bignumber.equal(takerTokenFillAmount);
                    expect(
                        await contractWrappers.token.getBalanceAsync(takerTokenAddress, takerAddress),
                    ).to.be.bignumber.equal(fillableAmount.minus(takerTokenFillAmount));
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
                    const txHash = await contractWrappers.exchange.fillOrderAsync(
                        signedOrder,
                        partialFillAmount,
                        shouldThrowOnInsufficientBalanceOrAllowance,
                        takerAddress,
                    );
                    await web3Wrapper.awaitTransactionMinedAsync(txHash);
                    expect(
                        await contractWrappers.token.getBalanceAsync(makerTokenAddress, makerAddress),
                    ).to.be.bignumber.equal(fillableAmount.minus(partialFillAmount));
                    expect(
                        await contractWrappers.token.getBalanceAsync(takerTokenAddress, makerAddress),
                    ).to.be.bignumber.equal(partialFillAmount);
                    expect(
                        await contractWrappers.token.getBalanceAsync(makerTokenAddress, takerAddress),
                    ).to.be.bignumber.equal(partialFillAmount);
                    expect(
                        await contractWrappers.token.getBalanceAsync(takerTokenAddress, takerAddress),
                    ).to.be.bignumber.equal(fillableAmount.minus(partialFillAmount));
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
                    const txHash = await contractWrappers.exchange.fillOrderAsync(
                        signedOrder,
                        takerTokenFillAmount,
                        shouldThrowOnInsufficientBalanceOrAllowance,
                        takerAddress,
                    );
                    await web3Wrapper.awaitTransactionMinedAsync(txHash);
                    expect(
                        await contractWrappers.token.getBalanceAsync(zrxTokenAddress, feeRecipient),
                    ).to.be.bignumber.equal(makerFee.plus(takerFee));
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
                        contractWrappers.exchange.fillOrderAsync(
                            signedOrder,
                            emptyFillTakerAmount,
                            shouldThrowOnInsufficientBalanceOrAllowance,
                            takerAddress,
                        ),
                    ).to.be.rejectedWith(ExchangeContractErrs.OrderFillAmountZero);
                });
                it('should validate when orderTransactionOptions specify to validate', async () => {
                    return expect(
                        contractWrappers.exchange.fillOrderAsync(
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
                        contractWrappers.exchange.fillOrderAsync(
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
            describe('negative fill amount', async () => {
                let signedOrder: SignedOrder;
                const negativeFillTakerAmount = new BigNumber(-100);
                beforeEach(async () => {
                    signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                        makerTokenAddress,
                        takerTokenAddress,
                        makerAddress,
                        takerAddress,
                        fillableAmount,
                    );
                });
                it('should not allow the exchange wrapper to fill if amount is negative', async () => {
                    return expect(
                        contractWrappers.exchange.fillOrderAsync(
                            signedOrder,
                            negativeFillTakerAmount,
                            shouldThrowOnInsufficientBalanceOrAllowance,
                            takerAddress,
                        ),
                    ).to.be.rejected();
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
                signedOrderHashHex = getOrderHashHex(signedOrder);
                anotherSignedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerTokenAddress,
                    takerTokenAddress,
                    makerAddress,
                    takerAddress,
                    fillableAmount,
                );
                anotherOrderHashHex = getOrderHashHex(anotherSignedOrder);
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
                        contractWrappers.exchange.batchFillOrdersAsync(
                            [],
                            shouldThrowOnInsufficientBalanceOrAllowance,
                            takerAddress,
                        ),
                    ).to.be.rejectedWith(ExchangeContractErrs.BatchOrdersMustHaveAtLeastOneItem);
                });
                it('should successfully fill multiple orders', async () => {
                    const txHash = await contractWrappers.exchange.batchFillOrdersAsync(
                        orderFillBatch,
                        shouldThrowOnInsufficientBalanceOrAllowance,
                        takerAddress,
                    );
                    await web3Wrapper.awaitTransactionMinedAsync(txHash);
                    const filledAmount = await contractWrappers.exchange.getFilledTakerAmountAsync(signedOrderHashHex);
                    const anotherFilledAmount = await contractWrappers.exchange.getFilledTakerAmountAsync(
                        anotherOrderHashHex,
                    );
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
                        contractWrappers.exchange.batchFillOrdersAsync(
                            orderFillBatch,
                            shouldThrowOnInsufficientBalanceOrAllowance,
                            takerAddress,
                        ),
                    ).to.be.rejectedWith(ExchangeContractErrs.OrderFillAmountZero);
                });
                it('should validate when orderTransactionOptions specify to validate', async () => {
                    return expect(
                        contractWrappers.exchange.batchFillOrdersAsync(
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
                        contractWrappers.exchange.batchFillOrdersAsync(
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
            describe('negative batch fill amount', async () => {
                beforeEach(async () => {
                    const negativeFillTakerAmount = new BigNumber(-100);
                    orderFillBatch = [
                        {
                            signedOrder,
                            takerTokenFillAmount,
                        },
                        {
                            signedOrder: anotherSignedOrder,
                            takerTokenFillAmount: negativeFillTakerAmount,
                        },
                    ];
                });
                it('should not allow the exchange wrapper to batch fill if any amount is negative', async () => {
                    return expect(
                        contractWrappers.exchange.batchFillOrdersAsync(
                            orderFillBatch,
                            shouldThrowOnInsufficientBalanceOrAllowance,
                            takerAddress,
                        ),
                    ).to.be.rejected();
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
                signedOrderHashHex = getOrderHashHex(signedOrder);
                anotherSignedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerTokenAddress,
                    takerTokenAddress,
                    makerAddress,
                    takerAddress,
                    fillableAmount,
                );
                anotherOrderHashHex = getOrderHashHex(anotherSignedOrder);
                signedOrders = [signedOrder, anotherSignedOrder];
            });
            describe('successful batch fills', () => {
                it('should throw if a batch is empty', async () => {
                    return expect(
                        contractWrappers.exchange.fillOrdersUpToAsync(
                            [],
                            fillUpToAmount,
                            shouldThrowOnInsufficientBalanceOrAllowance,
                            takerAddress,
                        ),
                    ).to.be.rejectedWith(ExchangeContractErrs.BatchOrdersMustHaveAtLeastOneItem);
                });
                it('should successfully fill up to specified amount when all orders are fully funded', async () => {
                    const txHash = await contractWrappers.exchange.fillOrdersUpToAsync(
                        signedOrders,
                        fillUpToAmount,
                        shouldThrowOnInsufficientBalanceOrAllowance,
                        takerAddress,
                    );
                    await web3Wrapper.awaitTransactionMinedAsync(txHash);
                    const filledAmount = await contractWrappers.exchange.getFilledTakerAmountAsync(signedOrderHashHex);
                    const anotherFilledAmount = await contractWrappers.exchange.getFilledTakerAmountAsync(
                        anotherOrderHashHex,
                    );
                    expect(filledAmount).to.be.bignumber.equal(fillableAmount);
                    const remainingFillAmount = fillableAmount.minus(1);
                    expect(anotherFilledAmount).to.be.bignumber.equal(remainingFillAmount);
                });
                it('should successfully fill up to specified amount and leave the rest of the orders untouched', async () => {
                    const txHash = await contractWrappers.exchange.fillOrdersUpToAsync(
                        signedOrders,
                        fillableAmount,
                        shouldThrowOnInsufficientBalanceOrAllowance,
                        takerAddress,
                    );
                    await web3Wrapper.awaitTransactionMinedAsync(txHash);
                    const filledAmount = await contractWrappers.exchange.getFilledTakerAmountAsync(signedOrderHashHex);
                    const zeroAmount = await contractWrappers.exchange.getFilledTakerAmountAsync(anotherOrderHashHex);
                    expect(filledAmount).to.be.bignumber.equal(fillableAmount);
                    expect(zeroAmount).to.be.bignumber.equal(0);
                });
                it('should successfully fill up to specified amount even if filling all orders would fail', async () => {
                    const missingBalance = new BigNumber(1); // User will still have enough balance to fill up to 9,
                    // but won't have 10 to fully fill all orders in a batch.
                    await contractWrappers.token.transferAsync(
                        makerTokenAddress,
                        makerAddress,
                        coinbase,
                        missingBalance,
                    );
                    const txHash = await contractWrappers.exchange.fillOrdersUpToAsync(
                        signedOrders,
                        fillUpToAmount,
                        shouldThrowOnInsufficientBalanceOrAllowance,
                        takerAddress,
                    );
                    await web3Wrapper.awaitTransactionMinedAsync(txHash);
                    const filledAmount = await contractWrappers.exchange.getFilledTakerAmountAsync(signedOrderHashHex);
                    const anotherFilledAmount = await contractWrappers.exchange.getFilledTakerAmountAsync(
                        anotherOrderHashHex,
                    );
                    expect(filledAmount).to.be.bignumber.equal(fillableAmount);
                    const remainingFillAmount = fillableAmount.minus(1);
                    expect(anotherFilledAmount).to.be.bignumber.equal(remainingFillAmount);
                });
            });
            describe('failed batch fills', () => {
                it("should fail validation if user doesn't have enough balance without fill up to", async () => {
                    const missingBalance = new BigNumber(2); // User will only have enough balance to fill up to 8
                    await contractWrappers.token.transferAsync(
                        makerTokenAddress,
                        makerAddress,
                        coinbase,
                        missingBalance,
                    );
                    return expect(
                        contractWrappers.exchange.fillOrdersUpToAsync(
                            signedOrders,
                            fillUpToAmount,
                            shouldThrowOnInsufficientBalanceOrAllowance,
                            takerAddress,
                        ),
                    ).to.be.rejectedWith(ExchangeContractErrs.InsufficientMakerBalance);
                });
            });
            describe('order transaction options', () => {
                const emptyFillUpToAmount = new BigNumber(0);
                it('should validate when orderTransactionOptions are not present', async () => {
                    return expect(
                        contractWrappers.exchange.fillOrdersUpToAsync(
                            signedOrders,
                            emptyFillUpToAmount,
                            shouldThrowOnInsufficientBalanceOrAllowance,
                            takerAddress,
                        ),
                    ).to.be.rejectedWith(ExchangeContractErrs.OrderFillAmountZero);
                });
                it('should validate when orderTransactionOptions specify to validate', async () => {
                    return expect(
                        contractWrappers.exchange.fillOrdersUpToAsync(
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
                        contractWrappers.exchange.fillOrdersUpToAsync(
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
            orderHashHex = getOrderHashHex(signedOrder);
        });
        describe('#cancelOrderAsync', () => {
            describe('successful cancels', () => {
                it('should cancel an order', async () => {
                    const txHash = await contractWrappers.exchange.cancelOrderAsync(signedOrder, cancelAmount);
                    await web3Wrapper.awaitTransactionMinedAsync(txHash);
                    const cancelledAmount = await contractWrappers.exchange.getCancelledTakerAmountAsync(orderHashHex);
                    expect(cancelledAmount).to.be.bignumber.equal(cancelAmount);
                });
            });
            describe('order transaction options', () => {
                const emptyCancelTakerTokenAmount = new BigNumber(0);
                it('should validate when orderTransactionOptions are not present', async () => {
                    return expect(
                        contractWrappers.exchange.cancelOrderAsync(signedOrder, emptyCancelTakerTokenAmount),
                    ).to.be.rejectedWith(ExchangeContractErrs.OrderCancelAmountZero);
                });
                it('should validate when orderTransactionOptions specify to validate', async () => {
                    return expect(
                        contractWrappers.exchange.cancelOrderAsync(signedOrder, emptyCancelTakerTokenAmount, {
                            shouldValidate: true,
                        }),
                    ).to.be.rejectedWith(ExchangeContractErrs.OrderCancelAmountZero);
                });
                it('should not validate when orderTransactionOptions specify not to validate', async () => {
                    return expect(
                        contractWrappers.exchange.cancelOrderAsync(signedOrder, emptyCancelTakerTokenAmount, {
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
                anotherOrderHashHex = getOrderHashHex(anotherSignedOrder);
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
                        contractWrappers.exchange.batchCancelOrdersAsync([
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
                    await contractWrappers.exchange.batchCancelOrdersAsync(cancelBatch);
                    const cancelledAmount = await contractWrappers.exchange.getCancelledTakerAmountAsync(orderHashHex);
                    const anotherCancelledAmount = await contractWrappers.exchange.getCancelledTakerAmountAsync(
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
                    return expect(contractWrappers.exchange.batchCancelOrdersAsync(cancelBatch)).to.be.rejectedWith(
                        ExchangeContractErrs.OrderCancelAmountZero,
                    );
                });
                it('should validate when orderTransactionOptions specify to validate', async () => {
                    return expect(
                        contractWrappers.exchange.batchCancelOrdersAsync(cancelBatch, {
                            shouldValidate: true,
                        }),
                    ).to.be.rejectedWith(ExchangeContractErrs.OrderCancelAmountZero);
                });
                it('should not validate when orderTransactionOptions specify not to validate', async () => {
                    return expect(
                        contractWrappers.exchange.batchCancelOrdersAsync(cancelBatch, {
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
            orderHash = getOrderHashHex(signedOrder);
        });
        describe('#getUnavailableTakerAmountAsync', () => {
            it('should throw if passed an invalid orderHash', async () => {
                const invalidOrderHashHex = '0x123';
                return expect(
                    contractWrappers.exchange.getUnavailableTakerAmountAsync(invalidOrderHashHex),
                ).to.be.rejected();
            });
            it('should return zero if passed a valid but non-existent orderHash', async () => {
                const unavailableValueT = await contractWrappers.exchange.getUnavailableTakerAmountAsync(
                    NON_EXISTENT_ORDER_HASH,
                );
                expect(unavailableValueT).to.be.bignumber.equal(0);
            });
            it('should return the unavailableValueT for a valid and partially filled orderHash', async () => {
                const unavailableValueT = await contractWrappers.exchange.getUnavailableTakerAmountAsync(orderHash);
                expect(unavailableValueT).to.be.bignumber.equal(partialFillAmount);
            });
        });
        describe('#getFilledTakerAmountAsync', () => {
            it('should throw if passed an invalid orderHash', async () => {
                const invalidOrderHashHex = '0x123';
                return expect(
                    contractWrappers.exchange.getFilledTakerAmountAsync(invalidOrderHashHex),
                ).to.be.rejected();
            });
            it('should return zero if passed a valid but non-existent orderHash', async () => {
                const filledValueT = await contractWrappers.exchange.getFilledTakerAmountAsync(NON_EXISTENT_ORDER_HASH);
                expect(filledValueT).to.be.bignumber.equal(0);
            });
            it('should return the filledValueT for a valid and partially filled orderHash', async () => {
                const filledValueT = await contractWrappers.exchange.getFilledTakerAmountAsync(orderHash);
                expect(filledValueT).to.be.bignumber.equal(partialFillAmount);
            });
        });
        describe('#getCancelledTakerAmountAsync', () => {
            it('should throw if passed an invalid orderHash', async () => {
                const invalidOrderHashHex = '0x123';
                return expect(
                    contractWrappers.exchange.getCancelledTakerAmountAsync(invalidOrderHashHex),
                ).to.be.rejected();
            });
            it('should return zero if passed a valid but non-existent orderHash', async () => {
                const cancelledValueT = await contractWrappers.exchange.getCancelledTakerAmountAsync(
                    NON_EXISTENT_ORDER_HASH,
                );
                expect(cancelledValueT).to.be.bignumber.equal(0);
            });
            it('should return the cancelledValueT for a valid and partially filled orderHash', async () => {
                const cancelledValueT = await contractWrappers.exchange.getCancelledTakerAmountAsync(orderHash);
                expect(cancelledValueT).to.be.bignumber.equal(0);
            });
            it('should return the cancelledValueT for a valid and cancelled orderHash', async () => {
                const cancelAmount = fillableAmount.minus(partialFillAmount);
                await contractWrappers.exchange.cancelOrderAsync(signedOrder, cancelAmount);
                const cancelledValueT = await contractWrappers.exchange.getCancelledTakerAmountAsync(orderHash);
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
            contractWrappers.exchange.unsubscribeAll();
        });
        // Hack: Mocha does not allow a test to be both async and have a `done` callback
        // Since we need to await the receipt of the event in the `subscribe` callback,
        // we do need both. A hack is to make the top-level a sync fn w/ a done callback and then
        // wrap the rest of the test in an async block
        // Source: https://github.com/mochajs/mocha/issues/2407
        it('Should receive the LogFill event when an order is filled', (done: DoneCallback) => {
            (async () => {
                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<LogFillContractEventArgs>) => {
                        expect(logEvent.log.event).to.be.equal(ExchangeEvents.LogFill);
                    },
                );
                contractWrappers.exchange.subscribe(ExchangeEvents.LogFill, indexFilterValues, callback);
                await contractWrappers.exchange.fillOrderAsync(
                    signedOrder,
                    takerTokenFillAmountInBaseUnits,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    takerAddress,
                );
            })().catch(done);
        });
        it('Should receive the LogCancel event when an order is cancelled', (done: DoneCallback) => {
            (async () => {
                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<LogCancelContractEventArgs>) => {
                        expect(logEvent.log.event).to.be.equal(ExchangeEvents.LogCancel);
                    },
                );
                contractWrappers.exchange.subscribe(ExchangeEvents.LogCancel, indexFilterValues, callback);
                await contractWrappers.exchange.cancelOrderAsync(signedOrder, cancelTakerAmountInBaseUnits);
            })().catch(done);
        });
        it('Outstanding subscriptions are cancelled when contractWrappers.setProvider called', (done: DoneCallback) => {
            (async () => {
                const callbackNeverToBeCalled = callbackErrorReporter.reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<LogFillContractEventArgs>) => {
                        done(new Error('Expected this subscription to have been cancelled'));
                    },
                );
                contractWrappers.exchange.subscribe(ExchangeEvents.LogFill, indexFilterValues, callbackNeverToBeCalled);

                contractWrappers.setProvider(provider, constants.TESTRPC_NETWORK_ID);

                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<LogFillContractEventArgs>) => {
                        expect(logEvent.log.event).to.be.equal(ExchangeEvents.LogFill);
                    },
                );
                contractWrappers.exchange.subscribe(ExchangeEvents.LogFill, indexFilterValues, callback);
                await contractWrappers.exchange.fillOrderAsync(
                    signedOrder,
                    takerTokenFillAmountInBaseUnits,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    takerAddress,
                );
            })().catch(done);
        });
        it('Should cancel subscription when unsubscribe called', (done: DoneCallback) => {
            (async () => {
                const callbackNeverToBeCalled = callbackErrorReporter.reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<LogFillContractEventArgs>) => {
                        done(new Error('Expected this subscription to have been cancelled'));
                    },
                );
                const subscriptionToken = contractWrappers.exchange.subscribe(
                    ExchangeEvents.LogFill,
                    indexFilterValues,
                    callbackNeverToBeCalled,
                );
                contractWrappers.exchange.unsubscribe(subscriptionToken);
                await contractWrappers.exchange.fillOrderAsync(
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
            const orderHash = getOrderHashHex(signedOrder);
            const orderHashFromContract = await (contractWrappers.exchange as any)._getOrderHashHexUsingContractCallAsync(
                signedOrder,
            );
            expect(orderHash).to.equal(orderHashFromContract);
        });
    });
    describe('#getZRXTokenAddressAsync', () => {
        it('gets the same token as is in token registry', () => {
            const zrxAddress = contractWrappers.exchange.getZRXTokenAddress();
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
            txHash = await contractWrappers.exchange.fillOrderAsync(
                signedOrder,
                fillableAmount,
                shouldThrowOnInsufficientBalanceOrAllowance,
                takerAddress,
            );
            await web3Wrapper.awaitTransactionMinedAsync(txHash);
            const eventName = ExchangeEvents.LogFill;
            const indexFilterValues = {};
            const logs = await contractWrappers.exchange.getLogsAsync(eventName, blockRange, indexFilterValues);
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
            txHash = await contractWrappers.exchange.fillOrderAsync(
                signedOrder,
                fillableAmount,
                shouldThrowOnInsufficientBalanceOrAllowance,
                takerAddress,
            );
            await web3Wrapper.awaitTransactionMinedAsync(txHash);
            const differentEventName = ExchangeEvents.LogCancel;
            const indexFilterValues = {};
            const logs = await contractWrappers.exchange.getLogsAsync(
                differentEventName,
                blockRange,
                indexFilterValues,
            );
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
            txHash = await contractWrappers.exchange.fillOrderAsync(
                signedOrder,
                fillableAmount,
                shouldThrowOnInsufficientBalanceOrAllowance,
                takerAddress,
            );
            await web3Wrapper.awaitTransactionMinedAsync(txHash);

            const differentMakerAddress = userAddresses[2];
            const anotherSignedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress,
                takerTokenAddress,
                differentMakerAddress,
                takerAddress,
                fillableAmount,
            );
            txHash = await contractWrappers.exchange.fillOrderAsync(
                anotherSignedOrder,
                fillableAmount,
                shouldThrowOnInsufficientBalanceOrAllowance,
                takerAddress,
            );
            await web3Wrapper.awaitTransactionMinedAsync(txHash);

            const eventName = ExchangeEvents.LogFill;
            const indexFilterValues = {
                maker: differentMakerAddress,
            };
            const logs = await contractWrappers.exchange.getLogsAsync<LogFillContractEventArgs>(
                eventName,
                blockRange,
                indexFilterValues,
            );
            expect(logs).to.have.length(1);
            const args = logs[0].args;
            expect(args.maker).to.be.equal(differentMakerAddress);
        });
    });
    describe('#getOrderStateAsync', () => {
        let maker: string;
        let taker: string;
        let makerToken: Token;
        let takerToken: Token;
        let signedOrder: SignedOrder;
        let orderState: OrderState;
        const fillableAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(5), constants.ZRX_DECIMALS);
        before(async () => {
            [, maker, taker] = userAddresses;
            tokens = await contractWrappers.tokenRegistry.getTokensAsync();
            [makerToken, takerToken] = tokenUtils.getDummyTokens();
        });
        it('should report orderStateValid when order is fillable', async () => {
            signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerToken.address,
                takerToken.address,
                maker,
                taker,
                fillableAmount,
            );
            orderState = await contractWrappers.exchange.getOrderStateAsync(signedOrder);
            expect(orderState.isValid).to.be.true();
        });
        it('should report orderStateInvalid when maker allowance set to 0', async () => {
            signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerToken.address,
                takerToken.address,
                maker,
                taker,
                fillableAmount,
            );
            await contractWrappers.token.setProxyAllowanceAsync(makerToken.address, maker, new BigNumber(0));
            orderState = await contractWrappers.exchange.getOrderStateAsync(signedOrder);
            expect(orderState.isValid).to.be.false();
        });
    });
}); // tslint:disable:max-file-line-count
