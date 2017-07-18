import * as chai from 'chai';
import {chaiSetup} from './utils/chai_setup';
import * as Web3 from 'web3';
import * as BigNumber from 'bignumber.js';
import promisify = require('es6-promisify');
import {web3Factory} from './utils/web3_factory';
import {ZeroEx, SignedOrder, Token, ExchangeContractErrs} from '../src';
import {TokenUtils} from './utils/token_utils';
import {BlockchainLifecycle} from './utils/blockchain_lifecycle';
import {FillScenarios} from './utils/fill_scenarios';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle();

describe('OrderValidationUtils', () => {
    let web3: Web3;
    let zeroEx: ZeroEx;
    let userAddresses: string[];
    let tokens: Token[];
    let tokenUtils: TokenUtils;
    let exchangeContractAddress: string;
    let zrxTokenAddress: string;
    let fillScenarios: FillScenarios;
    let makerTokenAddress: string;
    let takerTokenAddress: string;
    let coinbase: string;
    let makerAddress: string;
    let takerAddress: string;
    let feeRecipient: string;
    const fillableAmount = new BigNumber(5);
    const fillTakerAmount = new BigNumber(5);
    const shouldCheckTransfer = true;
    before(async () => {
        web3 = web3Factory.create();
        zeroEx = new ZeroEx(web3.currentProvider);
        exchangeContractAddress = await zeroEx.exchange.getContractAddressAsync();
        userAddresses = await promisify(web3.eth.getAccounts)();
        [coinbase, makerAddress, takerAddress, feeRecipient] = userAddresses;
        tokens = await zeroEx.tokenRegistry.getTokensAsync();
        tokenUtils = new TokenUtils(tokens);
        zrxTokenAddress = tokenUtils.getProtocolTokenOrThrow().address;
        fillScenarios = new FillScenarios(zeroEx, userAddresses, tokens, zrxTokenAddress, exchangeContractAddress);
        const [makerToken, takerToken] = tokenUtils.getNonProtocolTokens();
        makerTokenAddress = makerToken.address;
        takerTokenAddress = takerToken.address;
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('#validateFillOrderBalancesAndAllowancesAndThrowIfInvalidAsync', () => {
        describe('should throw when not enough balance or allowance to fulfill the order', () => {
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
                return expect(zeroEx.exchange.fillOrderAsync(
                    signedOrder, fillTakerAmount, shouldCheckTransfer, takerAddress,
                )).to.be.rejectedWith(ExchangeContractErrs.InsufficientTakerBalance);
            });
            it('should throw when taker allowance is less than fill amount', async () => {
                const newAllowanceWhichIsLessThanFillAmount = fillTakerAmount.minus(lackingAllowance);
                await zeroEx.token.setProxyAllowanceAsync(takerTokenAddress, takerAddress,
                    newAllowanceWhichIsLessThanFillAmount);
                return expect(zeroEx.exchange.fillOrderAsync(
                    signedOrder, fillTakerAmount, shouldCheckTransfer, takerAddress,
                )).to.be.rejectedWith(ExchangeContractErrs.InsufficientTakerAllowance);
            });
            it('should throw when maker balance is less than maker fill amount', async () => {
                await zeroEx.token.transferAsync(
                    makerTokenAddress, makerAddress, coinbase, balanceToSubtractFromMaker,
                );
                return expect(zeroEx.exchange.fillOrderAsync(
                    signedOrder, fillTakerAmount, shouldCheckTransfer, takerAddress,
                )).to.be.rejectedWith(ExchangeContractErrs.InsufficientMakerBalance);
            });
            it('should throw when maker allowance is less than maker fill amount', async () => {
                const newAllowanceWhichIsLessThanFillAmount = fillTakerAmount.minus(lackingAllowance);
                await zeroEx.token.setProxyAllowanceAsync(makerTokenAddress, makerAddress,
                    newAllowanceWhichIsLessThanFillAmount);
                return expect(zeroEx.exchange.fillOrderAsync(
                    signedOrder, fillTakerAmount, shouldCheckTransfer, takerAddress,
                )).to.be.rejectedWith(ExchangeContractErrs.InsufficientMakerAllowance);
            });
        });
        describe('should throw when not enough balance or allowance to pay fees', () => {
            const makerFee = new BigNumber(2);
            const takerFee = new BigNumber(2);
            let signedOrder: SignedOrder;
            beforeEach('setup', async () => {
                signedOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
                    makerTokenAddress, takerTokenAddress, makerFee, takerFee,
                    makerAddress, takerAddress, fillableAmount, feeRecipient,
                );
            });
            it('should throw when maker doesn\'t have enough balance to pay fees', async () => {
                const balanceToSubtractFromMaker = new BigNumber(1);
                await zeroEx.token.transferAsync(
                    zrxTokenAddress, makerAddress, coinbase, balanceToSubtractFromMaker,
                );
                return expect(zeroEx.exchange.fillOrderAsync(
                    signedOrder, fillTakerAmount, shouldCheckTransfer, takerAddress,
                )).to.be.rejectedWith(ExchangeContractErrs.InsufficientMakerFeeBalance);
            });
            it('should throw when maker doesn\'t have enough allowance to pay fees', async () => {
                const newAllowanceWhichIsLessThanFees = makerFee.minus(1);
                await zeroEx.token.setProxyAllowanceAsync(zrxTokenAddress, makerAddress,
                    newAllowanceWhichIsLessThanFees);
                return expect(zeroEx.exchange.fillOrderAsync(
                    signedOrder, fillTakerAmount, shouldCheckTransfer, takerAddress,
                )).to.be.rejectedWith(ExchangeContractErrs.InsufficientMakerFeeAllowance);
            });
            it('should throw when taker doesn\'t have enough balance to pay fees', async () => {
                const balanceToSubtractFromTaker = new BigNumber(1);
                await zeroEx.token.transferAsync(
                    zrxTokenAddress, takerAddress, coinbase, balanceToSubtractFromTaker,
                );
                return expect(zeroEx.exchange.fillOrderAsync(
                    signedOrder, fillTakerAmount, shouldCheckTransfer, takerAddress,
                )).to.be.rejectedWith(ExchangeContractErrs.InsufficientTakerFeeBalance);
            });
            it('should throw when taker doesn\'t have enough allowance to pay fees', async () => {
                const newAllowanceWhichIsLessThanFees = makerFee.minus(1);
                await zeroEx.token.setProxyAllowanceAsync(zrxTokenAddress, takerAddress,
                    newAllowanceWhichIsLessThanFees);
                return expect(zeroEx.exchange.fillOrderAsync(
                    signedOrder, fillTakerAmount, shouldCheckTransfer, takerAddress,
                )).to.be.rejectedWith(ExchangeContractErrs.InsufficientTakerFeeAllowance);
            });
        });
        describe('should throw on insufficient balance or allowance when makerToken is ZRX',
        () => {
            const makerFee = new BigNumber(2);
            const takerFee = new BigNumber(2);
            let signedOrder: SignedOrder;
            beforeEach(async () => {
                signedOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
                    zrxTokenAddress, takerTokenAddress, makerFee, takerFee,
                    makerAddress, takerAddress, fillableAmount, feeRecipient,
                );
            });
            it('should throw on insufficient balance when makerToken is ZRX', async () => {
                const balanceToSubtractFromMaker = new BigNumber(1);
                await zeroEx.token.transferAsync(
                    zrxTokenAddress, makerAddress, coinbase, balanceToSubtractFromMaker,
                );
                return expect(zeroEx.exchange.fillOrderAsync(
                    signedOrder, fillTakerAmount, shouldCheckTransfer, takerAddress,
                )).to.be.rejectedWith(ExchangeContractErrs.InsufficientMakerBalance);
            });
            it('should throw on insufficient allowance when makerToken is ZRX', async () => {
                const oldAllowance = await zeroEx.token.getProxyAllowanceAsync(zrxTokenAddress, makerAddress);
                const newAllowanceWhichIsInsufficient = oldAllowance.minus(1);
                await zeroEx.token.setProxyAllowanceAsync(
                    zrxTokenAddress, makerAddress, newAllowanceWhichIsInsufficient);
                return expect(zeroEx.exchange.fillOrderAsync(
                    signedOrder, fillTakerAmount, shouldCheckTransfer, takerAddress,
                )).to.be.rejectedWith(ExchangeContractErrs.InsufficientMakerAllowance);
            });
        });
        describe('should throw on insufficient balance or allowance when takerToken is ZRX',
        () => {
            const makerFee = new BigNumber(2);
            const takerFee = new BigNumber(2);
            let signedOrder: SignedOrder;
            beforeEach(async () => {
                signedOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
                    makerTokenAddress, zrxTokenAddress, makerFee, takerFee,
                    makerAddress, takerAddress, fillableAmount, feeRecipient,
                );
            });
            it('should throw on insufficient balance when takerToken is ZRX', async () => {
                const balanceToSubtractFromTaker = new BigNumber(1);
                await zeroEx.token.transferAsync(
                    zrxTokenAddress, takerAddress, coinbase, balanceToSubtractFromTaker,
                );
                return expect(zeroEx.exchange.fillOrderAsync(
                    signedOrder, fillTakerAmount, shouldCheckTransfer, takerAddress,
                )).to.be.rejectedWith(ExchangeContractErrs.InsufficientTakerBalance);
            });
            it('should throw on insufficient allowance when takerToken is ZRX', async () => {
                const oldAllowance = await zeroEx.token.getProxyAllowanceAsync(zrxTokenAddress, takerAddress);
                const newAllowanceWhichIsInsufficient = oldAllowance.minus(1);
                await zeroEx.token.setProxyAllowanceAsync(
                    zrxTokenAddress, takerAddress, newAllowanceWhichIsInsufficient);
                return expect(zeroEx.exchange.fillOrderAsync(
                    signedOrder, fillTakerAmount, shouldCheckTransfer, takerAddress,
                )).to.be.rejectedWith(ExchangeContractErrs.InsufficientTakerAllowance);
            });
        });
    });
});
