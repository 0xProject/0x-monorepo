import { addressUtils, chaiSetup, constants, provider, txDefaults, web3Wrapper } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { assetDataUtils, orderHashUtils, transactionHashUtils } from '@0x/order-utils';
import { constants as orderConstants } from '@0x/order-utils/lib/src/constants';
import { Order, ZeroExTransaction } from '@0x/types';
import { BigNumber, providerUtils } from '@0x/utils';
import * as chai from 'chai';
import * as ethUtil from 'ethereumjs-util';

import { TestLibsContract } from '../src';
import { artifacts } from '../src/artifacts';

import { stringifySchema } from './utils';

chaiSetup.configure();
const expect = chai.expect;

const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('Exchange libs', () => {
    let chainId: number;
    let order: Order;
    let transaction: ZeroExTransaction;
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
        const [makerAddress, takerAddress, senderAddress, feeRecipientAddress, signerAddress] = accounts.slice(0, 5);
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
        const domain = {
            verifyingContractAddress: libs.address,
            chainId,
        };
        order = {
            ...constants.STATIC_ORDER_PARAMS,
            makerAddress,
            takerAddress,
            senderAddress,
            feeRecipientAddress,
            makerAssetData: assetDataUtils.encodeERC20AssetData(addressUtils.generatePseudoRandomAddress()),
            takerAssetData: assetDataUtils.encodeERC20AssetData(addressUtils.generatePseudoRandomAddress()),
            makerFeeAssetData: assetDataUtils.encodeERC20AssetData(addressUtils.generatePseudoRandomAddress()),
            takerFeeAssetData: assetDataUtils.encodeERC20AssetData(addressUtils.generatePseudoRandomAddress()),
            salt: new BigNumber(0),
            expirationTimeSeconds: new BigNumber(0),
            domain,
        };
        transaction = {
            signerAddress,
            salt: new BigNumber(0),
            expirationTimeSeconds: new BigNumber(0),
            data: constants.NULL_BYTES,
            domain,
        };
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
                const isRoundingError = await libs.isRoundingErrorFloor.callAsync(numerator, denominator, target);
                expect(isRoundingError).to.be.true();
            });
            it('should return false if there is a rounding of 0.09%', async () => {
                const numerator = new BigNumber(20);
                const denominator = new BigNumber(9991);
                const target = new BigNumber(500);
                // rounding error = ((20*500/9991) - floor(20*500/9991)) / (20*500/9991) = 0.09%
                const isRoundingError = await libs.isRoundingErrorFloor.callAsync(numerator, denominator, target);
                expect(isRoundingError).to.be.false();
            });
            it('should return true if there is a rounding error of 0.11%', async () => {
                const numerator = new BigNumber(20);
                const denominator = new BigNumber(9989);
                const target = new BigNumber(500);
                // rounding error = ((20*500/9989) - floor(20*500/9989)) / (20*500/9989) = 0.011%
                const isRoundingError = await libs.isRoundingErrorFloor.callAsync(numerator, denominator, target);
                expect(isRoundingError).to.be.true();
            });
        });
        describe('isRoundingErrorCeil', () => {
            it('should return true if there is a rounding error of 0.1%', async () => {
                const numerator = new BigNumber(20);
                const denominator = new BigNumber(1001);
                const target = new BigNumber(50);
                // rounding error = (ceil(20*50/1001) - (20*50/1001)) / (20*50/1001) = 0.1%
                const isRoundingError = await libs.isRoundingErrorCeil.callAsync(numerator, denominator, target);
                expect(isRoundingError).to.be.true();
            });
            it('should return false if there is a rounding of 0.09%', async () => {
                const numerator = new BigNumber(20);
                const denominator = new BigNumber(10009);
                const target = new BigNumber(500);
                // rounding error = (ceil(20*500/10009) - (20*500/10009)) / (20*500/10009) = 0.09%
                const isRoundingError = await libs.isRoundingErrorCeil.callAsync(numerator, denominator, target);
                expect(isRoundingError).to.be.false();
            });
            it('should return true if there is a rounding error of 0.11%', async () => {
                const numerator = new BigNumber(20);
                const denominator = new BigNumber(10011);
                const target = new BigNumber(500);
                // rounding error = (ceil(20*500/10011) - (20*500/10011)) / (20*500/10011) = 0.11%
                const isRoundingError = await libs.isRoundingErrorCeil.callAsync(numerator, denominator, target);
                expect(isRoundingError).to.be.true();
            });
        });
    });

    describe('LibOrder', () => {
        describe('getOrderHash', () => {
            it('should return the correct orderHash', async () => {
                const orderHashHex = await libs.getOrderHash.callAsync(order);
                expect(orderHashUtils.getOrderHashHex(order)).to.be.equal(orderHashHex);
            });
            it('orderHash should differ if chainId is different', async () => {
                const orderHashHex1 = await libsAlternateChain.getOrderHash.callAsync(order);
                const orderHashHex2 = await libs.getOrderHash.callAsync(order);
                expect(orderHashHex1).to.be.not.equal(orderHashHex2);
            });
        });
    });

    describe('LibZeroExTransaction', () => {
        describe('EIP712ZeroExTransactionSchemaHash', () => {
            it('should return the correct schema hash', async () => {
                const schemaHash = await libs.EIP712_ZEROEX_TRANSACTION_SCHEMA_HASH.callAsync();
                const schemaString =
                    'ZeroExTransaction(uint256 salt,uint256 expirationTimeSeconds,address signerAddress,bytes data)';
                const expectedSchemaHash = ethUtil.addHexPrefix(ethUtil.bufferToHex(ethUtil.sha3(schemaString)));
                expect(schemaHash).to.equal(expectedSchemaHash);
            });
        });
        describe('getTransactionHash', () => {
            it('should return the correct transactionHash', async () => {
                const transactionHash = await libs.getTransactionHash.callAsync(transaction);
                const expectedTransactionHash = transactionHashUtils.getTransactionHashHex(transaction);
                expect(transactionHash).to.equal(expectedTransactionHash);
            });
            it('transactionHash should differ if chainId is different', async () => {
                const transactionHash1 = await libsAlternateChain.getTransactionHash.callAsync(transaction);
                const transactionHash2 = await libs.getTransactionHash.callAsync(transaction);
                expect(transactionHash1).to.not.equal(transactionHash2);
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
