import { ZeroEx } from '0x.js';
import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import ethUtil = require('ethereumjs-util');

import { constants } from '../../util/constants';
import { ExchangeWrapper } from '../../util/exchange_wrapper';
import { Order } from '../../util/order';
import { OrderFactory } from '../../util/order_factory';
import { ContractName } from '../../util/types';
import { chaiSetup } from '../utils/chai_setup';
import { deployer } from '../utils/deployer';

chaiSetup.configure();
const expect = chai.expect;

const web3 = web3Factory.create();
const web3Wrapper = new Web3Wrapper(web3.currentProvider);
const blockchainLifecycle = new BlockchainLifecycle(devConstants.RPC_URL);

describe('Exchange', () => {
    let maker: string;
    let feeRecipient: string;

    let order: Order;
    let exchangeWrapper: ExchangeWrapper;
    let orderFactory: OrderFactory;

    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        maker = accounts[0];
        feeRecipient = accounts[1] || accounts[accounts.length - 1];
        const tokenRegistry = await deployer.deployAsync(ContractName.TokenRegistry);
        const tokenTransferProxy = await deployer.deployAsync(ContractName.TokenTransferProxy);
        const [rep, dgd, zrx] = await Promise.all([
            deployer.deployAsync(ContractName.DummyToken),
            deployer.deployAsync(ContractName.DummyToken),
            deployer.deployAsync(ContractName.DummyToken),
        ]);
        const exchange = await deployer.deployAsync(ContractName.Exchange, [zrx.address, tokenTransferProxy.address]);
        await tokenTransferProxy.addAuthorizedAddress(exchange.address, { from: accounts[0] });
        const zeroEx = new ZeroEx(web3.currentProvider, { networkId: constants.TESTRPC_NETWORK_ID });
        exchangeWrapper = new ExchangeWrapper(exchange, zeroEx);
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
        order = await orderFactory.newSignedOrderAsync();
    });

    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('getOrderHash', () => {
        it('should output the correct orderHash', async () => {
            const orderHashHex = await exchangeWrapper.getOrderHashAsync(order);
            expect(order.params.orderHashHex).to.be.equal(orderHashHex);
        });
    });

    describe('isValidSignature', () => {
        beforeEach(async () => {
            order = await orderFactory.newSignedOrderAsync();
        });

        it('should return true with a valid signature', async () => {
            const success = await exchangeWrapper.isValidSignatureAsync(order);
            const isValidSignature = order.isValidSignature();
            expect(isValidSignature).to.be.true();
            expect(success).to.be.true();
        });

        it('should return false with an invalid signature', async () => {
            order.params.r = ethUtil.bufferToHex(ethUtil.sha3('invalidR'));
            order.params.s = ethUtil.bufferToHex(ethUtil.sha3('invalidS'));
            const success = await exchangeWrapper.isValidSignatureAsync(order);
            expect(order.isValidSignature()).to.be.false();
            expect(success).to.be.false();
        });
    });

    describe('isRoundingError', () => {
        it('should return false if there is a rounding error of 0.1%', async () => {
            const numerator = new BigNumber(20);
            const denominator = new BigNumber(999);
            const target = new BigNumber(50);
            // rounding error = ((20*50/999) - floor(20*50/999)) / (20*50/999) = 0.1%
            const isRoundingError = await exchangeWrapper.isRoundingErrorAsync(numerator, denominator, target);
            expect(isRoundingError).to.be.false();
        });

        it('should return false if there is a rounding of 0.09%', async () => {
            const numerator = new BigNumber(20);
            const denominator = new BigNumber(9991);
            const target = new BigNumber(500);
            // rounding error = ((20*500/9991) - floor(20*500/9991)) / (20*500/9991) = 0.09%
            const isRoundingError = await exchangeWrapper.isRoundingErrorAsync(numerator, denominator, target);
            expect(isRoundingError).to.be.false();
        });

        it('should return true if there is a rounding error of 0.11%', async () => {
            const numerator = new BigNumber(20);
            const denominator = new BigNumber(9989);
            const target = new BigNumber(500);
            // rounding error = ((20*500/9989) - floor(20*500/9989)) / (20*500/9989) = 0.011%
            const isRoundingError = await exchangeWrapper.isRoundingErrorAsync(numerator, denominator, target);
            expect(isRoundingError).to.be.true();
        });

        it('should return true if there is a rounding error > 0.1%', async () => {
            const numerator = new BigNumber(3);
            const denominator = new BigNumber(7);
            const target = new BigNumber(10);
            // rounding error = ((3*10/7) - floor(3*10/7)) / (3*10/7) = 6.67%
            const isRoundingError = await exchangeWrapper.isRoundingErrorAsync(numerator, denominator, target);
            expect(isRoundingError).to.be.true();
        });

        it('should return false when there is no rounding error', async () => {
            const numerator = new BigNumber(1);
            const denominator = new BigNumber(2);
            const target = new BigNumber(10);

            const isRoundingError = await exchangeWrapper.isRoundingErrorAsync(numerator, denominator, target);
            expect(isRoundingError).to.be.false();
        });

        it('should return false when there is rounding error <= 0.1%', async () => {
            // randomly generated numbers
            const numerator = new BigNumber(76564);
            const denominator = new BigNumber(676373677);
            const target = new BigNumber(105762562);
            // rounding error = ((76564*105762562/676373677) - floor(76564*105762562/676373677)) /
            // (76564*105762562/676373677) = 0.0007%
            const isRoundingError = await exchangeWrapper.isRoundingErrorAsync(numerator, denominator, target);
            expect(isRoundingError).to.be.false();
        });
    });

    describe('getPartialAmount', () => {
        it('should return the numerator/denominator*target', async () => {
            const numerator = new BigNumber(1);
            const denominator = new BigNumber(2);
            const target = new BigNumber(10);

            const partialAmount = await exchangeWrapper.getPartialAmountAsync(numerator, denominator, target);
            const expectedPartialAmount = 5;
            expect(partialAmount).to.be.bignumber.equal(expectedPartialAmount);
        });

        it('should round down', async () => {
            const numerator = new BigNumber(2);
            const denominator = new BigNumber(3);
            const target = new BigNumber(10);

            const partialAmount = await exchangeWrapper.getPartialAmountAsync(numerator, denominator, target);
            const expectedPartialAmount = 6;
            expect(partialAmount).to.be.bignumber.equal(expectedPartialAmount);
        });

        it('should round .5 down', async () => {
            const numerator = new BigNumber(1);
            const denominator = new BigNumber(20);
            const target = new BigNumber(10);

            const partialAmount = await exchangeWrapper.getPartialAmountAsync(numerator, denominator, target);
            const expectedPartialAmount = 0;
            expect(partialAmount).to.be.bignumber.equal(expectedPartialAmount);
        });
    });
});
