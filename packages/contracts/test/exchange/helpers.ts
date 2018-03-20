import { ZeroEx } from '0x.js';
import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import ethUtil = require('ethereumjs-util');

import { ExchangeContract } from '../../src/contract_wrappers/generated/exchange';
import { constants } from '../../src/utils/constants';
import { ExchangeWrapper } from '../../src/utils/exchange_wrapper';
import { OrderFactory } from '../../src/utils/order_factory';
import { orderUtils } from '../../src/utils/order_utils';
import { ContractName, SignedOrder } from '../../src/utils/types';
import { chaiSetup } from '../utils/chai_setup';
import { deployer } from '../utils/deployer';
import { web3, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;

const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('Exchange', () => {
    let makerAddress: string;
    let feeRecipientAddress: string;
    let assetProxyManagerAddress: string;

    let signedOrder: SignedOrder;
    let exchangeWrapper: ExchangeWrapper;
    let orderFactory: OrderFactory;

    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        [makerAddress, feeRecipientAddress, assetProxyManagerAddress] = accounts;
        const tokenRegistry = await deployer.deployAsync(ContractName.TokenRegistry);
        const tokenTransferProxy = await deployer.deployAsync(ContractName.TokenTransferProxy);
        const assetTransferProxy = await deployer.deployAsync(ContractName.AssetTransferProxy);
        const erc20TransferProxy = await deployer.deployAsync(ContractName.ERC20TransferProxy, [
            tokenTransferProxy.address,
        ]);
        const [rep, dgd, zrx] = await Promise.all([
            deployer.deployAsync(ContractName.DummyToken, constants.DUMMY_TOKEN_ARGS),
            deployer.deployAsync(ContractName.DummyToken, constants.DUMMY_TOKEN_ARGS),
            deployer.deployAsync(ContractName.DummyToken, constants.DUMMY_TOKEN_ARGS),
        ]);
        const exchangeInstance = await deployer.deployAsync(ContractName.Exchange, [
            zrx.address,
            tokenTransferProxy.address,
            assetTransferProxy.address,
        ]);
        const exchange = new ExchangeContract(web3Wrapper, exchangeInstance.abi, exchangeInstance.address);
        await assetTransferProxy.addAuthorizedAddress.sendTransactionAsync(assetProxyManagerAddress, { from: accounts[0] });
        await assetTransferProxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, { from: accounts[0] });
        await erc20TransferProxy.addAuthorizedAddress.sendTransactionAsync(assetTransferProxy.address, { from: accounts[0] });
        await tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(erc20TransferProxy.address, { from: accounts[0] });
        await assetTransferProxy.registerAssetProxy.sendTransactionAsync(0, erc20TransferProxy.address, false, { from: assetProxyManagerAddress });
        const zeroEx = new ZeroEx(web3.currentProvider, { networkId: constants.TESTRPC_NETWORK_ID });
        exchangeWrapper = new ExchangeWrapper(exchange, zeroEx);
        const defaultOrderParams = {
            exchangeAddress: exchange.address,
            makerAddress,
            feeRecipientAddress,
            makerTokenAddress: rep.address,
            takerTokenAddress: dgd.address,
            makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
            takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
            makerFeeAmount: ZeroEx.toBaseUnitAmount(new BigNumber(1), 18),
            takerFeeAmount: ZeroEx.toBaseUnitAmount(new BigNumber(1), 18),
            makerAssetId: 0,
            takerAssetId: 70,
        };
        const privateKey = constants.TESTRPC_PRIVATE_KEYS[0];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);
        signedOrder = orderFactory.newSignedOrder();
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
            expect(orderUtils.getOrderHashHex(signedOrder)).to.be.equal(orderHashHex);
        });
    });

    describe('isValidSignature', () => {
        beforeEach(async () => {
            signedOrder = orderFactory.newSignedOrder();
        });

        it('should return true with a valid signature', async () => {
            const success = await exchangeWrapper.isValidSignatureAsync(signedOrder);
            expect(success).to.be.true();
        });

        it('should return false with an invalid signature', async () => {
            const invalidR = ethUtil.sha3('invalidR');
            const invalidS = ethUtil.sha3('invalidS');
            const invalidSigBuff = Buffer.concat([
                ethUtil.toBuffer(signedOrder.signature.slice(0, 6)),
                invalidR,
                invalidS,
            ]);
            const invalidSigHex = `0x${invalidSigBuff.toString('hex')}`;
            signedOrder.signature = invalidSigHex;
            const success = await exchangeWrapper.isValidSignatureAsync(signedOrder);
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
