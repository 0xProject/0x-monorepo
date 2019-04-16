import {
    addressUtils,
    chaiSetup,
    constants,
    OrderFactory,
    provider,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { assetDataUtils, orderHashUtils } from '@0x/order-utils';
import { constants as orderConstants } from '@0x/order-utils/lib/src/constants';
import { SignedOrder } from '@0x/types';
import { BigNumber, providerUtils } from '@0x/utils';
import * as chai from 'chai';
import * as ethUtil from 'ethereumjs-util';

import { TestLibsContract } from '../generated-wrappers/test_libs';
import { artifacts } from '../src/artifacts';

import { stringifySchema } from './utils';

chaiSetup.configure();
const expect = chai.expect;

const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('Exchange libs', () => {
    let chainId: number;
    let signedOrder: SignedOrder;
    let orderFactory: OrderFactory;
    let libs: TestLibsContract;
    let libsAlternateChain: TestLibsContract;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const makerAddress = accounts[0];
        chainId = await providerUtils.getChainIdAsync(provider);
        libs = await TestLibsContract.deployFrom0xArtifactAsync(
            artifacts.TestLibs,
            provider,
            txDefaults,
            new BigNumber(chainId),
        );
        // Deploy a version with a different chain ID.
        const alternateChainId = chainId + 1;
        libsAlternateChain = await TestLibsContract.deployFrom0xArtifactAsync(
            artifacts.TestLibs,
            provider,
            txDefaults,
            new BigNumber(alternateChainId),
        );

        const defaultOrderParams = {
            ...constants.STATIC_ORDER_PARAMS,
            makerAddress,
            feeRecipientAddress: addressUtils.generatePseudoRandomAddress(),
            makerAssetData: assetDataUtils.encodeERC20AssetData(addressUtils.generatePseudoRandomAddress()),
            takerAssetData: assetDataUtils.encodeERC20AssetData(addressUtils.generatePseudoRandomAddress()),
            makerFeeAssetData: assetDataUtils.encodeERC20AssetData(addressUtils.generatePseudoRandomAddress()),
            takerFeeAssetData: assetDataUtils.encodeERC20AssetData(addressUtils.generatePseudoRandomAddress()),
            domain: {
                verifyingContractAddress: libs.address,
                chainId,
            },
        };
        const privateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddress)];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);
    });

    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    // Note(albrow): These tests are designed to be supplemental to the
    // combinatorial tests in test/exchange/internal. They test specific edge
    // cases that are not covered by the combinatorial tests.
    describe('LibMath', () => {
        describe('isRoundingError', () => {
            it('should return true if there is a rounding error of 0.1%', async () => {
                const numerator = new BigNumber(20);
                const denominator = new BigNumber(999);
                const target = new BigNumber(50);
                // rounding error = ((20*50/999) - floor(20*50/999)) / (20*50/999) = 0.1%
                const isRoundingError = await libs.publicIsRoundingErrorFloor.callAsync(numerator, denominator, target);
                expect(isRoundingError).to.be.true();
            });
            it('should return false if there is a rounding of 0.09%', async () => {
                const numerator = new BigNumber(20);
                const denominator = new BigNumber(9991);
                const target = new BigNumber(500);
                // rounding error = ((20*500/9991) - floor(20*500/9991)) / (20*500/9991) = 0.09%
                const isRoundingError = await libs.publicIsRoundingErrorFloor.callAsync(numerator, denominator, target);
                expect(isRoundingError).to.be.false();
            });
            it('should return true if there is a rounding error of 0.11%', async () => {
                const numerator = new BigNumber(20);
                const denominator = new BigNumber(9989);
                const target = new BigNumber(500);
                // rounding error = ((20*500/9989) - floor(20*500/9989)) / (20*500/9989) = 0.011%
                const isRoundingError = await libs.publicIsRoundingErrorFloor.callAsync(numerator, denominator, target);
                expect(isRoundingError).to.be.true();
            });
        });
        describe('isRoundingErrorCeil', () => {
            it('should return true if there is a rounding error of 0.1%', async () => {
                const numerator = new BigNumber(20);
                const denominator = new BigNumber(1001);
                const target = new BigNumber(50);
                // rounding error = (ceil(20*50/1001) - (20*50/1001)) / (20*50/1001) = 0.1%
                const isRoundingError = await libs.publicIsRoundingErrorCeil.callAsync(numerator, denominator, target);
                expect(isRoundingError).to.be.true();
            });
            it('should return false if there is a rounding of 0.09%', async () => {
                const numerator = new BigNumber(20);
                const denominator = new BigNumber(10009);
                const target = new BigNumber(500);
                // rounding error = (ceil(20*500/10009) - (20*500/10009)) / (20*500/10009) = 0.09%
                const isRoundingError = await libs.publicIsRoundingErrorCeil.callAsync(numerator, denominator, target);
                expect(isRoundingError).to.be.false();
            });
            it('should return true if there is a rounding error of 0.11%', async () => {
                const numerator = new BigNumber(20);
                const denominator = new BigNumber(10011);
                const target = new BigNumber(500);
                // rounding error = (ceil(20*500/10011) - (20*500/10011)) / (20*500/10011) = 0.11%
                const isRoundingError = await libs.publicIsRoundingErrorCeil.callAsync(numerator, denominator, target);
                expect(isRoundingError).to.be.true();
            });
        });
    });

    describe('LibOrder', () => {
        describe('getOrderHash', () => {
            it('should output the correct orderHash', async () => {
                signedOrder = await orderFactory.newSignedOrderAsync();
                const orderHashHex = await libs.publicGetOrderHash.callAsync(signedOrder);
                expect(orderHashUtils.getOrderHashHex(signedOrder)).to.be.equal(orderHashHex);
            });
            it('orderHash should differ if chainId is different', async () => {
                signedOrder = await orderFactory.newSignedOrderAsync();
                const orderHashHex1 = await libsAlternateChain.publicGetOrderHash.callAsync(signedOrder);
                const orderHashHex2 = await libs.publicGetOrderHash.callAsync(signedOrder);
                expect(orderHashHex1).to.be.not.equal(orderHashHex2);
            });
        });
    });

    describe('LibEIP712', () => {
        it('should return the correct domain separator schema hash', async () => {
            const schema = stringifySchema(orderConstants.DEFAULT_DOMAIN_SCHEMA);
            const expectedSchemaHash = ethUtil.bufferToHex(ethUtil.sha3(Buffer.from(schema)));
            const actualSchemaHash = await libs.getDomainSeparatorSchemaHash.callAsync();
            expect(actualSchemaHash).to.be.equal(expectedSchemaHash);
        });
        it('should return the correct order schema hash', async () => {
            const schema = stringifySchema(orderConstants.EXCHANGE_ORDER_SCHEMA);
            const expectedSchemaHash = ethUtil.bufferToHex(ethUtil.sha3(Buffer.from(schema)));
            const actualSchemaHash = await libs.getOrderSchemaHash.callAsync();
            expect(actualSchemaHash).to.be.equal(expectedSchemaHash);
        });
        it('should return the correct domain separator', async () => {
            const schema = stringifySchema(orderConstants.DEFAULT_DOMAIN_SCHEMA);
            const schemaHash = ethUtil.sha3(Buffer.from(schema));
            const payload = Buffer.concat([
                schemaHash,
                ethUtil.sha3(Buffer.from(orderConstants.EXCHANGE_DOMAIN_NAME)),
                ethUtil.sha3(Buffer.from(orderConstants.EXCHANGE_DOMAIN_VERSION)),
                ethUtil.setLengthLeft(ethUtil.toBuffer(chainId), 32),
                ethUtil.setLengthLeft(ethUtil.toBuffer(libs.address), 32),
            ]);
            const expectedDomain = ethUtil.bufferToHex(ethUtil.sha3(payload));
            const actualDomain = await libs.getDomainSeparator.callAsync();
            expect(actualDomain).to.be.equal(expectedDomain);
        });
        it('should return a different domain separator if chainId is different', async () => {
            const domain1 = await libsAlternateChain.getDomainSeparator.callAsync();
            const domain2 = await libs.getDomainSeparator.callAsync();
            expect(domain1).to.be.not.equal(domain2);
        });
    });
});
