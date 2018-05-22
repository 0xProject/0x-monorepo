import { SignedOrder, ZeroEx } from '0x.js';
import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import ethUtil = require('ethereumjs-util');
import 'make-promises-safe';

import {
    ExchangeContract,
    LogCancelContractEventArgs,
    LogErrorContractEventArgs,
    LogFillContractEventArgs,
} from '../../src/contract_wrappers/generated/exchange';

import { DummyTokenContract } from '../../src/contract_wrappers/generated/dummy_token';
import { TokenRegistryContract } from '../../src/contract_wrappers/generated/token_registry';
import { TokenTransferProxyContract } from '../../src/contract_wrappers/generated/token_transfer_proxy';
import { artifacts } from '../../util/artifacts';
import { constants } from '../../util/constants';
import { ExchangeWrapper } from '../../util/exchange_wrapper';
import { OrderFactory } from '../../util/order_factory';
import { ContractName } from '../../util/types';
import { chaiSetup } from '../utils/chai_setup';

import { provider, txDefaults, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;

const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('Exchange', () => {
    let maker: string;
    let feeRecipient: string;

    let signedOrder: SignedOrder;
    let exchangeWrapper: ExchangeWrapper;
    let orderFactory: OrderFactory;

    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        [maker, feeRecipient] = accounts;
        const tokenRegistry = await TokenRegistryContract.deployFrom0xArtifactAsync(
            artifacts.TokenRegistry,
            provider,
            txDefaults,
        );
        const tokenTransferProxy = await TokenTransferProxyContract.deployFrom0xArtifactAsync(
            artifacts.TokenTransferProxy,
            provider,
            txDefaults,
        );
        const [rep, dgd, zrx] = await Promise.all([
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
        const exchange = await ExchangeContract.deployFrom0xArtifactAsync(
            artifacts.Exchange,
            provider,
            txDefaults,
            zrx.address,
            tokenTransferProxy.address,
        );
        await tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, { from: accounts[0] });
        const zeroEx = new ZeroEx(provider, { networkId: constants.TESTRPC_NETWORK_ID });
        exchangeWrapper = new ExchangeWrapper(exchange, zeroEx);
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
        signedOrder = await orderFactory.newSignedOrderAsync();
    });

    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('getOrderHash', () => {
        it('should output the correct orderHash', async () => {
            const orderHashHex = await exchangeWrapper.getOrderHashAsync(signedOrder);
            expect(ZeroEx.getOrderHashHex(signedOrder)).to.be.equal(orderHashHex);
        });
    });

    describe('isValidSignature', () => {
        beforeEach(async () => {
            signedOrder = await orderFactory.newSignedOrderAsync();
        });

        it('should return true with a valid signature', async () => {
            const isValidSignatureForContract = await exchangeWrapper.isValidSignatureAsync(signedOrder);
            const orderHashHex = ZeroEx.getOrderHashHex(signedOrder);
            const isValidSignature = ZeroEx.isValidSignature(orderHashHex, signedOrder.ecSignature, signedOrder.maker);
            expect(isValidSignature).to.be.true();
            expect(isValidSignatureForContract).to.be.true();
        });

        it('should return false with an invalid signature', async () => {
            signedOrder.ecSignature.r = ethUtil.bufferToHex(ethUtil.sha3('invalidR'));
            signedOrder.ecSignature.s = ethUtil.bufferToHex(ethUtil.sha3('invalidS'));
            const isValidSignatureForContract = await exchangeWrapper.isValidSignatureAsync(signedOrder);
            const orderHashHex = ZeroEx.getOrderHashHex(signedOrder);
            const isValidSignature = ZeroEx.isValidSignature(orderHashHex, signedOrder.ecSignature, signedOrder.maker);
            expect(isValidSignature).to.be.false();
            expect(isValidSignatureForContract).to.be.false();
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
