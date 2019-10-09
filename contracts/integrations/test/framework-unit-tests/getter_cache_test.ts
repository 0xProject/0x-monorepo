import { blockchainTests, constants, expect, hexSlice } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { BlockParam, CallData } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';

import { artifacts, TestFrameworkContract } from '../../src';
import { GetterCache } from '../utils/cache';

blockchainTests.resets('Cache Tests', env => {
    let exampleContract: TestFrameworkContract;

    before(async () => {
        exampleContract = await TestFrameworkContract.deployFrom0xArtifactAsync(
            artifacts.TestFramework,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    describe('callAsync', () => {
        describe('() => uint', () => {
            let cache: GetterCache;

            beforeEach(async () => {
                cache = new GetterCache(exampleContract.numberSideEffect);
            });

            it('should return 0 when "counter" == 0', async () => {
                expect(await cache.callAsync()).bignumber.to.be.eq(constants.ZERO_AMOUNT);
            });

            it('should return 1 when "counter" == 1', async () => {
                // Update the counter to 1.
                await exampleContract.setCounter.awaitTransactionSuccessAsync(new BigNumber(1));

                // Ensure that the returned value is the updated counter.
                expect(await cache.callAsync()).bignumber.to.be.eq(new BigNumber(1));
            });

            it('should return the cached counter', async () => {
                // Cache a value.
                expect(await cache.callAsync()).bignumber.to.be.eq(constants.ZERO_AMOUNT);

                // Update the counter to 1.
                await exampleContract.setCounter.awaitTransactionSuccessAsync(new BigNumber(1));

                // Ensure that the returned value is the cached counter.
                expect(await cache.callAsync()).bignumber.to.be.eq(constants.ZERO_AMOUNT);
            });
        });

        describe('uint => boolean', () => {
            let cache: GetterCache;

            beforeEach(async () => {
                cache = new GetterCache(exampleContract.equalsSideEffect);
            });

            it('should return true when "possiblyZero" == 0 && "counter" == 0', async () => {
                expect(await cache.callAsync(constants.ZERO_AMOUNT)).to.be.true();
            });

            it('should return false when "possiblyZero" == 0 && "counter" != 0', async () => {
                // Update "counter" to "1", which will cause all calls to return false.
                await exampleContract.setCounter.awaitTransactionSuccessAsync(new BigNumber(1));
                expect(await cache.callAsync(constants.ZERO_AMOUNT)).to.be.false();
            });

            it('should return the cached value', async () => {
                // Cache a "true" value when "possiblyZero" == 0 && "counter" == 0
                expect(await cache.callAsync(constants.ZERO_AMOUNT)).to.be.true();

                // Update "counter" to "1", which will cause all calls of "isZeroOrFalse" to return "false".
                await exampleContract.setCounter.awaitTransactionSuccessAsync(new BigNumber(1));

                // This should return "true" because a value was cached.
                expect(await cache.callAsync(constants.ZERO_AMOUNT)).to.be.true();
            });
        });

        describe('(uint, bytes32) => bytes32', () => {
            let cache: GetterCache;

            beforeEach(async () => {
                cache = new GetterCache(exampleContract.hashSideEffect);
            });

            it('should return correct hash when counter == 0', async () => {
                // Get the calldata for the function call, which includes the abi-encoded data to hash.
                const hashData = exampleContract.hashSideEffect.getABIEncodedTransactionData(
                    new BigNumber(1),
                    ethUtil.bufferToHex(ethUtil.sha3(0)),
                );

                // Ensure that the correct hash was returned from the cache.
                expect(await cache.callAsync(new BigNumber(1), ethUtil.bufferToHex(ethUtil.sha3(0)))).to.be.eq(
                    ethUtil.bufferToHex(ethUtil.sha3(hexSlice(hashData, 4))),
                );
            });

            it('should return the null hash when counter != 0', async () => {
                // Update "counter" to "1", which will cause all calls to return the null hash.
                await exampleContract.setCounter.awaitTransactionSuccessAsync(new BigNumber(1));

                // Ensure that the cache returns the correct value.
                expect(await cache.callAsync(new BigNumber(1), ethUtil.bufferToHex(ethUtil.sha3(0)))).to.be.eq(
                    ethUtil.bufferToHex(ethUtil.sha3('0x')),
                );
            });

            it('should return the cached hash', async () => {
                // Get the calldata for the function call, which includes the abi-encoded data to hash.
                const hashData = exampleContract.hashSideEffect.getABIEncodedTransactionData(
                    new BigNumber(1),
                    ethUtil.bufferToHex(ethUtil.sha3(0)),
                );

                // Ensure that the cache returns the correct value.
                expect(await cache.callAsync(new BigNumber(1), ethUtil.bufferToHex(ethUtil.sha3(0)))).to.be.eq(
                    ethUtil.bufferToHex(ethUtil.sha3(hexSlice(hashData, 4))),
                );

                // Update "counter" to "1", which will cause all calls to return the null hash.
                await exampleContract.setCounter.awaitTransactionSuccessAsync(new BigNumber(1));

                // Ensure that the cache returns the correct value.
                expect(await cache.callAsync(new BigNumber(1), ethUtil.bufferToHex(ethUtil.sha3(0)))).to.be.eq(
                    ethUtil.bufferToHex(ethUtil.sha3(hexSlice(hashData, 4))),
                );
            });
        });
    });

    describe('flush', () => {
        describe('uint => boolean', () => {
            let cache: GetterCache;

            beforeEach(async () => {
                cache = new GetterCache(exampleContract.equalsSideEffect);
            });

            it('should return false when the cache was flushed && "possiblyZero" == 0 && "counter" != 0', async () => {
                // Cache a "true" value when "possiblyZero" == 0 && "counter" == 0
                expect(await cache.callAsync(constants.ZERO_AMOUNT)).to.be.true();

                // Update "counter" to "1", which will cause all calls of "isZeroOrFalse" to return "false".
                await exampleContract.setCounter.awaitTransactionSuccessAsync(new BigNumber(1));

                // Flush the entire cache.
                cache.flush();

                // This should return "false" because the value was flushed.
                expect(await cache.callAsync(constants.ZERO_AMOUNT)).to.be.false();
            });
        });
    });
});
