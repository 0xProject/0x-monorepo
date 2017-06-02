import 'mocha';
import * as _ from 'lodash';
import * as chai from 'chai';
import * as Web3 from 'web3';
import * as BigNumber from 'bignumber.js';
import * as dirtyChai from 'dirty-chai';
import ChaiBigNumber = require('chai-bignumber');
import promisify = require('es6-promisify');
import {web3Factory} from './utils/web3_factory';
import {ZeroEx} from '../src/0x.js';
import {BlockchainLifecycle} from './utils/blockchain_lifecycle';
import {orderFactory} from './utils/order_factory';
import {FillOrderValidationErrs, Token, SignedOrder} from '../src/types';
import {FillScenarios} from './utils/fill_scenarios';

chai.use(dirtyChai);
chai.use(ChaiBigNumber());
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle();

const NON_EXISTENT_ORDER_HASH = '0x79370342234e7acd6bbeac335bd3bb1d368383294b64b8160a00f4060e4d3777';

describe('ExchangeWrapper', () => {
    let zeroEx: ZeroEx;
    let userAddresses: string[];
    let web3: Web3;
    let tokens: Token[];
    let fillScenarios: FillScenarios;
    before(async () => {
        web3 = web3Factory.create();
        zeroEx = new ZeroEx(web3);
        userAddresses = await promisify(web3.eth.getAccounts)();
        tokens = await zeroEx.tokenRegistry.getTokensAsync();
        fillScenarios = new FillScenarios(zeroEx, userAddresses, tokens);
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
                expect(zeroEx.exchange.isValidSignatureAsync(dataHex, malformedSignature, address))
                    .to.be.rejected();
            });
            it('r lacks 0x prefix', () => {
                const malformedR = signature.r.replace('0x', '');
                const malformedSignature = {
                    v: signature.v,
                    r: malformedR,
                    s: signature.s,
                };
                expect(zeroEx.exchange.isValidSignatureAsync(dataHex, malformedSignature, address))
                    .to.be.rejected();
            });
            it('r is too short', () => {
                const malformedR = signature.r.substr(10);
                const malformedSignature = {
                    v: signature.v,
                    r: malformedR,
                    s: signature.s.replace('0', 'z'),
                };
                expect(zeroEx.exchange.isValidSignatureAsync(dataHex, malformedSignature, address))
                    .to.be.rejected();
            });
            it('s is not hex', () => {
                const malformedS = signature.s.replace('0', 'z');
                const malformedSignature = {
                    v: signature.v,
                    r: signature.r,
                    s: malformedS,
                };
                expect(zeroEx.exchange.isValidSignatureAsync(dataHex, malformedSignature, address))
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
        let takerAddress: string;
        const fillTakerAmountInBaseUnits = new BigNumber(5);
        const shouldCheckTransfer = false;
        before('fetch tokens', async () => {
            takerAddress = userAddresses[1];
            const [makerToken, takerToken] = tokens;
            makerTokenAddress = makerToken.address;
            takerTokenAddress = takerToken.address;
        });
        afterEach('reset default account', () => {
            zeroEx.setTransactionSenderAccount(userAddresses[0]);
        });
        describe('failed fills', () => {
            it('should throw when the fill amount is zero', async () => {
                const fillableAmount = new BigNumber(5);
                const signedOrder = await fillScenarios.createAFillableSignedOrderAsync(
                    makerTokenAddress, takerTokenAddress, takerAddress, fillableAmount,
                );
                const zeroFillAmount = new BigNumber(0);
                zeroEx.setTransactionSenderAccount(takerAddress);
                expect(zeroEx.exchange.fillOrderAsync(signedOrder, zeroFillAmount, shouldCheckTransfer))
                    .to.be.rejectedWith(FillOrderValidationErrs.FILL_AMOUNT_IS_ZERO);
            });
            it('should throw when sender is not a taker', async () => {
                const fillableAmount = new BigNumber(5);
                const signedOrder = await fillScenarios.createAFillableSignedOrderAsync(
                    makerTokenAddress, takerTokenAddress, takerAddress, fillableAmount,
                );
                expect(zeroEx.exchange.fillOrderAsync(signedOrder, fillTakerAmountInBaseUnits, shouldCheckTransfer))
                    .to.be.rejectedWith(FillOrderValidationErrs.NOT_A_TAKER);
            });
            it('should throw when order is expired', async () => {
                const expirationInPast = new BigNumber(42);
                const fillableAmount = new BigNumber(5);
                const signedOrder = await fillScenarios.createAFillableSignedOrderAsync(
                    makerTokenAddress, takerTokenAddress, takerAddress, fillableAmount, expirationInPast,
                );
                zeroEx.setTransactionSenderAccount(takerAddress);
                expect(zeroEx.exchange.fillOrderAsync(signedOrder, fillTakerAmountInBaseUnits, shouldCheckTransfer))
                    .to.be.rejectedWith(FillOrderValidationErrs.EXPIRED);
            });
            it('should throw when taker balance is less than fill amount', async () => {
                const fillableAmount = new BigNumber(5);
                const signedOrder = await fillScenarios.createAFillableSignedOrderAsync(
                    makerTokenAddress, takerTokenAddress, takerAddress, fillableAmount,
                );
                zeroEx.setTransactionSenderAccount(takerAddress);
                const moreThanTheBalance = new BigNumber(6);
                expect(zeroEx.exchange.fillOrderAsync(signedOrder, moreThanTheBalance, shouldCheckTransfer))
                    .to.be.rejectedWith(FillOrderValidationErrs.NOT_ENOUGH_TAKER_BALANCE);
            });
        });
        describe('successful fills', () => {
            it('should fill the valid order', async () => {
                const fillableAmount = new BigNumber(5);
                const signedOrder = await fillScenarios.createAFillableSignedOrderAsync(
                    makerTokenAddress, takerTokenAddress, takerAddress, fillableAmount,
                );
                zeroEx.setTransactionSenderAccount(takerAddress);
                expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, takerAddress))
                    .to.be.bignumber.equal(0);
                expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, takerAddress))
                    .to.be.bignumber.equal(fillTakerAmountInBaseUnits);
                await zeroEx.exchange.fillOrderAsync(signedOrder, fillTakerAmountInBaseUnits, shouldCheckTransfer);
                expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, takerAddress))
                    .to.be.bignumber.equal(fillTakerAmountInBaseUnits);
                expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, takerAddress))
                    .to.be.bignumber.equal(0);
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
});
