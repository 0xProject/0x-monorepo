import 'mocha';
import * as chai from 'chai';
import * as Web3 from 'web3';
import * as BigNumber from 'bignumber.js';
import {chaiSetup} from './utils/chai_setup';
import ChaiBigNumber = require('chai-bignumber');
import promisify = require('es6-promisify');
import {web3Factory} from './utils/web3_factory';
import {ZeroEx} from '../src/0x.js';
import {BlockchainLifecycle} from './utils/blockchain_lifecycle';
import {
    Token,
    SignedOrder,
    SubscriptionOpts,
    ExchangeEvents,
    ContractEvent,
    DoneCallback,
    ExchangeContractErrs,
} from '../src/types';
import {FillScenarios} from './utils/fill_scenarios';
import {TokenUtils} from './utils/token_utils';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle();

const NON_EXISTENT_ORDER_HASH = '0x79370342234e7acd6bbeac335bd3bb1d368383294b64b8160a00f4060e4d3777';

describe('ExchangeWrapper', () => {
    let web3: Web3;
    let zeroEx: ZeroEx;
    let tokenUtils: TokenUtils;
    let tokens: Token[];
    let userAddresses: string[];
    let zrxTokenAddress: string;
    let fillScenarios: FillScenarios;
    before(async () => {
        web3 = web3Factory.create();
        zeroEx = new ZeroEx(web3);
        userAddresses = await promisify(web3.eth.getAccounts)();
        tokens = await zeroEx.tokenRegistry.getTokensAsync();
        tokenUtils = new TokenUtils(tokens);
        zrxTokenAddress = tokenUtils.getProtocolTokenOrThrow().address;
        fillScenarios = new FillScenarios(zeroEx, userAddresses, tokens, zrxTokenAddress);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('#isValidSignatureAsync', () => {
        // The Exchange smart contract `isValidSignature` method only validates orderHashes and assumes
        // the length of the data is exactly 32 bytes. Thus for these tests, we use data of this size.
        const dataHex = '0x6927e990021d23b1eb7b8789f6a6feaf98fe104bb0cf8259421b79f9a34222b0';
        const signature = {
            v: 27,
            r: '0x61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc33',
            s: '0x40349190569279751135161d22529dc25add4f6069af05be04cacbda2ace2254',
        };
        const address = '0x5409ed021d9299bf6814279a6a1411a7e866a631';
        describe('should throw if passed a malformed signature', () => {
            it('malformed v', async () => {
                const malformedSignature = {
                    v: 34,
                    r: signature.r,
                    s: signature.s,
                };
                return expect(zeroEx.exchange.isValidSignatureAsync(dataHex, malformedSignature, address))
                    .to.be.rejected();
            });
            it('r lacks 0x prefix', async () => {
                const malformedR = signature.r.replace('0x', '');
                const malformedSignature = {
                    v: signature.v,
                    r: malformedR,
                    s: signature.s,
                };
                return expect(zeroEx.exchange.isValidSignatureAsync(dataHex, malformedSignature, address))
                    .to.be.rejected();
            });
            it('r is too short', async () => {
                const malformedR = signature.r.substr(10);
                const malformedSignature = {
                    v: signature.v,
                    r: malformedR,
                    s: signature.s.replace('0', 'z'),
                };
                return expect(zeroEx.exchange.isValidSignatureAsync(dataHex, malformedSignature, address))
                    .to.be.rejected();
            });
            it('s is not hex', async () => {
                const malformedS = signature.s.replace('0', 'z');
                const malformedSignature = {
                    v: signature.v,
                    r: signature.r,
                    s: malformedS,
                };
                return expect(zeroEx.exchange.isValidSignatureAsync(dataHex, malformedSignature, address))
                    .to.be.rejected();
            });
        });
        it('should return false if the data doesn\'t pertain to the signature & address', async () => {
            const isValid = await zeroEx.exchange.isValidSignatureAsync('0x0', signature, address);
            expect(isValid).to.be.false();
        });
        it('should return false if the address doesn\'t pertain to the signature & dataHex', async () => {
            const validUnrelatedAddress = '0x8b0292B11a196601eD2ce54B665CaFEca0347D42';
            const isValid = await zeroEx.exchange.isValidSignatureAsync(dataHex, signature, validUnrelatedAddress);
            expect(isValid).to.be.false();
        });
        it('should return false if the signature doesn\'t pertain to the dataHex & address', async () => {
            const wrongSignature = {...signature, v: 28};
            const isValid = await zeroEx.exchange.isValidSignatureAsync(dataHex, wrongSignature, address);
            expect(isValid).to.be.false();
        });
        it('should return true if the signature does pertain to the dataHex & address', async () => {
            const isValid = await zeroEx.exchange.isValidSignatureAsync(dataHex, signature, address);
            expect(isValid).to.be.true();
        });
    });
    describe('#fillOrderAsync', () => {
        let makerTokenAddress: string;
        let takerTokenAddress: string;
        let coinbase: string;
        let makerAddress: string;
        let takerAddress: string;
        let feeRecipient: string;
        const fillTakerAmount = new BigNumber(5);
        const shouldCheckTransfer = false;
        before(async () => {
            [coinbase, makerAddress, takerAddress, feeRecipient] = userAddresses;
            tokens = await zeroEx.tokenRegistry.getTokensAsync();
            const [makerToken, takerToken] = tokenUtils.getNonProtocolTokens();
            makerTokenAddress = makerToken.address;
            takerTokenAddress = takerToken.address;
        });
        afterEach('reset default account', () => {
            zeroEx.setTransactionSenderAccount(userAddresses[0]);
        });
        describe('failed fills', () => {
            it('should throw when the fill amount is zero', async () => {
                const fillableAmount = new BigNumber(5);
                const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
                );
                const zeroFillAmount = new BigNumber(0);
                zeroEx.setTransactionSenderAccount(takerAddress);
                return expect(zeroEx.exchange.fillOrderAsync(
                    signedOrder, zeroFillAmount, shouldCheckTransfer,
                )).to.be.rejectedWith(ExchangeContractErrs.ORDER_REMAINING_FILL_AMOUNT_ZERO);
            });
            it('should throw when sender is not a taker', async () => {
                const fillableAmount = new BigNumber(5);
                const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
                );
                return expect(zeroEx.exchange.fillOrderAsync(
                    signedOrder, fillTakerAmount, shouldCheckTransfer,
                )).to.be.rejectedWith(ExchangeContractErrs.TRANSACTION_SENDER_IS_NOT_FILL_ORDER_TAKER);
            });
            it('should throw when order is expired', async () => {
                const expirationInPast = new BigNumber(42);
                const fillableAmount = new BigNumber(5);
                const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount, expirationInPast,
                );
                zeroEx.setTransactionSenderAccount(takerAddress);
                return expect(zeroEx.exchange.fillOrderAsync(
                    signedOrder, fillTakerAmount, shouldCheckTransfer,
                )).to.be.rejectedWith(ExchangeContractErrs.ORDER_FILL_EXPIRED);
            });
            describe('should throw when not enough balance or allowance to fulfill the order', () => {
                const fillableAmount = new BigNumber(5);
                const balanceToSubtractFromMaker = new BigNumber(3);
                const lackingAllowance = new BigNumber(3);
                let signedOrder: SignedOrder;
                beforeEach('create fillable signed order', async () => {
                    signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                        makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
                    );
                });
                it('should throw when taker balance is less than fill amount', async () => {
                    await zeroEx.token.transferAsync(
                        takerTokenAddress, takerAddress, coinbase, balanceToSubtractFromMaker,
                    );
                    zeroEx.setTransactionSenderAccount(takerAddress);
                    return expect(zeroEx.exchange.fillOrderAsync(
                        signedOrder, fillTakerAmount, shouldCheckTransfer,
                    )).to.be.rejectedWith(ExchangeContractErrs.INSUFFICIENT_TAKER_BALANCE);
                });
                it('should throw when taker allowance is less than fill amount', async () => {
                    const newAllowanceWhichIsLessThanFillAmount = fillTakerAmount.minus(lackingAllowance);
                    await zeroEx.token.setProxyAllowanceAsync(takerTokenAddress, takerAddress,
                        newAllowanceWhichIsLessThanFillAmount);
                    zeroEx.setTransactionSenderAccount(takerAddress);
                    return expect(zeroEx.exchange.fillOrderAsync(
                        signedOrder, fillTakerAmount, shouldCheckTransfer,
                    )).to.be.rejectedWith(ExchangeContractErrs.INSUFFICIENT_TAKER_ALLOWANCE);
                });
                it('should throw when maker balance is less than maker fill amount', async () => {
                    await zeroEx.token.transferAsync(
                        makerTokenAddress, makerAddress, coinbase, balanceToSubtractFromMaker,
                    );
                    zeroEx.setTransactionSenderAccount(takerAddress);
                    return expect(zeroEx.exchange.fillOrderAsync(
                        signedOrder, fillTakerAmount, shouldCheckTransfer,
                    )).to.be.rejectedWith(ExchangeContractErrs.INSUFFICIENT_MAKER_BALANCE);
                });
                it('should throw when maker allowance is less than maker fill amount', async () => {
                    const newAllowanceWhichIsLessThanFillAmount = fillTakerAmount.minus(lackingAllowance);
                    await zeroEx.token.setProxyAllowanceAsync(makerTokenAddress, makerAddress,
                        newAllowanceWhichIsLessThanFillAmount);
                    zeroEx.setTransactionSenderAccount(takerAddress);
                    return expect(zeroEx.exchange.fillOrderAsync(
                        signedOrder, fillTakerAmount, shouldCheckTransfer,
                    )).to.be.rejectedWith(ExchangeContractErrs.INSUFFICIENT_MAKER_ALLOWANCE);
                });
            });
            it('should throw when there a rounding error would have occurred', async () => {
                const makerAmount = new BigNumber(3);
                const takerAmount = new BigNumber(5);
                const signedOrder = await fillScenarios.createAsymmetricFillableSignedOrderAsync(
                    makerTokenAddress, takerTokenAddress, makerAddress, takerAddress,
                    makerAmount, takerAmount,
                );
                const fillTakerAmountThatCausesRoundingError = new BigNumber(3);
                zeroEx.setTransactionSenderAccount(takerAddress);
                return expect(zeroEx.exchange.fillOrderAsync(
                    signedOrder, fillTakerAmountThatCausesRoundingError, shouldCheckTransfer,
                )).to.be.rejectedWith(ExchangeContractErrs.ORDER_FILL_ROUNDING_ERROR);
            });
            describe('should throw when not enough balance or allowance to pay fees', () => {
                const fillableAmount = new BigNumber(5);
                const makerFee = new BigNumber(2);
                const takerFee = new BigNumber(2);
                let signedOrder: SignedOrder;
                beforeEach('setup', async () => {
                    signedOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
                        makerTokenAddress, takerTokenAddress, makerFee, takerFee,
                        makerAddress, takerAddress, fillableAmount, feeRecipient,
                    );
                    zeroEx.setTransactionSenderAccount(takerAddress);
                });
                it('should throw when maker doesn\'t have enough balance to pay fees', async () => {
                    const balanceToSubtractFromMaker = new BigNumber(1);
                    await zeroEx.token.transferAsync(
                        zrxTokenAddress, makerAddress, coinbase, balanceToSubtractFromMaker,
                    );
                    return expect(zeroEx.exchange.fillOrderAsync(
                        signedOrder, fillTakerAmount, shouldCheckTransfer,
                    )).to.be.rejectedWith(ExchangeContractErrs.INSUFFICIENT_MAKER_FEE_BALANCE);
                });
                it('should throw when maker doesn\'t have enough allowance to pay fees', async () => {
                    const newAllowanceWhichIsLessThanFees = makerFee.minus(1);
                    await zeroEx.token.setProxyAllowanceAsync(zrxTokenAddress, makerAddress,
                        newAllowanceWhichIsLessThanFees);
                    return expect(zeroEx.exchange.fillOrderAsync(
                        signedOrder, fillTakerAmount, shouldCheckTransfer,
                    )).to.be.rejectedWith(ExchangeContractErrs.INSUFFICIENT_MAKER_FEE_ALLOWANCE);
                });
                it('should throw when taker doesn\'t have enough balance to pay fees', async () => {
                    const balanceToSubtractFromTaker = new BigNumber(1);
                    await zeroEx.token.transferAsync(
                        zrxTokenAddress, takerAddress, coinbase, balanceToSubtractFromTaker,
                    );
                    return expect(zeroEx.exchange.fillOrderAsync(
                        signedOrder, fillTakerAmount, shouldCheckTransfer,
                    )).to.be.rejectedWith(ExchangeContractErrs.INSUFFICIENT_TAKER_FEE_BALANCE);
                });
                it('should throw when taker doesn\'t have enough allowance to pay fees', async () => {
                    const newAllowanceWhichIsLessThanFees = makerFee.minus(1);
                    await zeroEx.token.setProxyAllowanceAsync(zrxTokenAddress, takerAddress,
                        newAllowanceWhichIsLessThanFees);
                    return expect(zeroEx.exchange.fillOrderAsync(
                        signedOrder, fillTakerAmount, shouldCheckTransfer,
                    )).to.be.rejectedWith(ExchangeContractErrs.INSUFFICIENT_TAKER_FEE_ALLOWANCE);
                });
            });
        });
        describe('successful fills', () => {
            it('should fill a valid order', async () => {
                const fillableAmount = new BigNumber(5);
                const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
                );
                expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, makerAddress))
                    .to.be.bignumber.equal(fillableAmount);
                expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, makerAddress))
                    .to.be.bignumber.equal(0);
                expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, takerAddress))
                    .to.be.bignumber.equal(0);
                expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, takerAddress))
                    .to.be.bignumber.equal(fillableAmount);
                zeroEx.setTransactionSenderAccount(takerAddress);
                await zeroEx.exchange.fillOrderAsync(signedOrder, fillTakerAmount, shouldCheckTransfer);
                expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, makerAddress))
                    .to.be.bignumber.equal(fillableAmount.minus(fillTakerAmount));
                expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, makerAddress))
                    .to.be.bignumber.equal(fillTakerAmount);
                expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, takerAddress))
                    .to.be.bignumber.equal(fillTakerAmount);
                expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, takerAddress))
                    .to.be.bignumber.equal(fillableAmount.minus(fillTakerAmount));
            });
            it('should partially fill the valid order', async () => {
                const fillableAmount = new BigNumber(5);
                const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
                );
                const partialFillAmount = new BigNumber(3);
                zeroEx.setTransactionSenderAccount(takerAddress);
                await zeroEx.exchange.fillOrderAsync(signedOrder, partialFillAmount, shouldCheckTransfer);
                expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, makerAddress))
                    .to.be.bignumber.equal(fillableAmount.minus(partialFillAmount));
                expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, makerAddress))
                    .to.be.bignumber.equal(partialFillAmount);
                expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, takerAddress))
                    .to.be.bignumber.equal(partialFillAmount);
                expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, takerAddress))
                    .to.be.bignumber.equal(fillableAmount.minus(partialFillAmount));
            });
            it('should fill the valid orders with fees', async () => {
                const fillableAmount = new BigNumber(5);
                const makerFee = new BigNumber(1);
                const takerFee = new BigNumber(2);
                const signedOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
                    makerTokenAddress, takerTokenAddress, makerFee, takerFee,
                    makerAddress, takerAddress, fillableAmount, feeRecipient,
                );
                zeroEx.setTransactionSenderAccount(takerAddress);
                await zeroEx.exchange.fillOrderAsync(signedOrder, fillTakerAmount, shouldCheckTransfer);
                expect(await zeroEx.token.getBalanceAsync(zrxTokenAddress, feeRecipient))
                    .to.be.bignumber.equal(makerFee.plus(takerFee));
            });
        });
    });
    describe('tests that require partially filled order', () => {
        let makerTokenAddress: string;
        let takerTokenAddress: string;
        let takerAddress: string;
        let fillableAmount: BigNumber.BigNumber;
        let partialFillAmount: BigNumber.BigNumber;
        let signedOrder: SignedOrder;
        before(() => {
            takerAddress = userAddresses[1];
            const [makerToken, takerToken] = tokens;
            makerTokenAddress = makerToken.address;
            takerTokenAddress = takerToken.address;
        });
        beforeEach(async () => {
            fillableAmount = new BigNumber(5);
            partialFillAmount = new BigNumber(2);
            signedOrder = await fillScenarios.createPartiallyFilledSignedOrderAsync(
                makerTokenAddress, takerTokenAddress, takerAddress, fillableAmount, partialFillAmount,
            );
        });
        describe('#getUnavailableTakerAmountAsync', () => {
            it ('should throw if passed an invalid orderHash', async () => {
                const invalidOrderHashHex = '0x123';
                expect(zeroEx.exchange.getUnavailableTakerAmountAsync(invalidOrderHashHex)).to.be.rejected();
            });
            it ('should return zero if passed a valid but non-existent orderHash', async () => {
                const unavailableValueT = await zeroEx.exchange.getUnavailableTakerAmountAsync(NON_EXISTENT_ORDER_HASH);
                expect(unavailableValueT).to.be.bignumber.equal(0);
            });
            it ('should return the unavailableValueT for a valid and partially filled orderHash', async () => {
                const orderHash = await zeroEx.getOrderHashHexAsync(signedOrder);
                const unavailableValueT = await zeroEx.exchange.getUnavailableTakerAmountAsync(orderHash);
                expect(unavailableValueT).to.be.bignumber.equal(partialFillAmount);
            });
        });
        describe('#getFilledTakerAmountAsync', () => {
            it ('should throw if passed an invalid orderHash', async () => {
                const invalidOrderHashHex = '0x123';
                expect(zeroEx.exchange.getFilledTakerAmountAsync(invalidOrderHashHex)).to.be.rejected();
            });
            it ('should return zero if passed a valid but non-existent orderHash', async () => {
                const filledValueT = await zeroEx.exchange.getFilledTakerAmountAsync(NON_EXISTENT_ORDER_HASH);
                expect(filledValueT).to.be.bignumber.equal(0);
            });
            it ('should return the filledValueT for a valid and partially filled orderHash', async () => {
                const orderHash = await zeroEx.getOrderHashHexAsync(signedOrder);
                const filledValueT = await zeroEx.exchange.getFilledTakerAmountAsync(orderHash);
                expect(filledValueT).to.be.bignumber.equal(partialFillAmount);
            });
        });
        describe('#getCanceledTakerAmountAsync', () => {
            it ('should throw if passed an invalid orderHash', async () => {
                const invalidOrderHashHex = '0x123';
                expect(zeroEx.exchange.getCanceledTakerAmountAsync(invalidOrderHashHex)).to.be.rejected();
            });
            it ('should return zero if passed a valid but non-existent orderHash', async () => {
                const cancelledValueT = await zeroEx.exchange.getCanceledTakerAmountAsync(NON_EXISTENT_ORDER_HASH);
                expect(cancelledValueT).to.be.bignumber.equal(0);
            });
            it ('should return the cancelledValueT for a valid and partially filled orderHash', async () => {
                const orderHash = await zeroEx.getOrderHashHexAsync(signedOrder);
                const cancelledValueT = await zeroEx.exchange.getCanceledTakerAmountAsync(orderHash);
                expect(cancelledValueT).to.be.bignumber.equal(0);
            });
        });
    });
    describe('#subscribeAsync', () => {
        const indexFilterValues = {};
        const shouldCheckTransfer = false;
        let makerTokenAddress: string;
        let takerTokenAddress: string;
        let coinbase: string;
        let takerAddress: string;
        let makerAddress: string;
        let fillableAmount: BigNumber.BigNumber;
        let signedOrder: SignedOrder;
        before(() => {
            [coinbase, makerAddress, takerAddress] = userAddresses;
            const [makerToken, takerToken] = tokens;
            makerTokenAddress = makerToken.address;
            takerTokenAddress = takerToken.address;
        });
        beforeEach(async () => {
            fillableAmount = new BigNumber(5);
            signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
            );
        });
        afterEach(async () => {
            (zeroEx.exchange as any).stopWatchingExchangeLogEventsAsync();
        });
        // Hack: Mocha does not allow a test to be both async and have a `done` callback
        // Since we need to await the receipt of the event in the `subscribeAsync` callback,
        // we do need both. A hack is to make the top-level a sync fn w/ a done callback and then
        // wrap the rest of the test in an async block
        // Source: https://github.com/mochajs/mocha/issues/2407
        it('Should receive the LogFill event when an order is filled', (done: DoneCallback) => {
            (async () => {
                const subscriptionOpts: SubscriptionOpts = {
                    fromBlock: 0,
                    toBlock: 'latest',
                };
                await zeroEx.exchange.subscribeAsync(ExchangeEvents.LogFill, subscriptionOpts,
                                                     indexFilterValues, (err: Error, event: ContractEvent) => {
                    expect(err).to.be.null();
                    expect(event).to.not.be.undefined();
                    done();
                });
                const fillTakerAmountInBaseUnits = new BigNumber(1);
                zeroEx.setTransactionSenderAccount(takerAddress);
                await zeroEx.exchange.fillOrderAsync(signedOrder, fillTakerAmountInBaseUnits, shouldCheckTransfer);
            })();
        });
        it('Outstanding subscriptions are cancelled when zeroEx.setProviderAsync called', (done: DoneCallback) => {
            (async () => {
                const subscriptionOpts: SubscriptionOpts = {
                    fromBlock: 0,
                    toBlock: 'latest',
                };
                await zeroEx.exchange.subscribeAsync(ExchangeEvents.LogFill, subscriptionOpts,
                                                     indexFilterValues, (err: Error, event: ContractEvent) => {
                    done(new Error('Expected this subscription to have been cancelled'));
                });

                const newProvider = web3Factory.getRpcProvider();
                await zeroEx.setProviderAsync(newProvider);

                await zeroEx.exchange.subscribeAsync(ExchangeEvents.LogFill, subscriptionOpts,
                                                     indexFilterValues, (err: Error, event: ContractEvent) => {
                    expect(err).to.be.null();
                    expect(event).to.not.be.undefined();
                    done();
                });

                const fillTakerAmountInBaseUnits = new BigNumber(1);
                zeroEx.setTransactionSenderAccount(takerAddress);
                await zeroEx.exchange.fillOrderAsync(signedOrder, fillTakerAmountInBaseUnits, shouldCheckTransfer);
            })();
        });
    });
});
