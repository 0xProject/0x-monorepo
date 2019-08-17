import { addressUtils, chaiSetup, provider, txDefaults, web3Wrapper } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { BigNumber, LibAddressArrayRevertErrors } from '@0x/utils';
import * as chai from 'chai';
import * as _ from 'lodash';

import { artifacts, TestLibAddressArrayContract } from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('LibAddressArray', () => {
    let lib: TestLibAddressArrayContract;

    before(async () => {
        await blockchainLifecycle.startAsync();
        // Deploy LibAddressArray
        lib = await TestLibAddressArrayContract.deployFrom0xArtifactAsync(
            artifacts.TestLibAddressArray,
            provider,
            txDefaults,
            artifacts,
        );
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('append', () => {
        it('should append to empty array', async () => {
            const addr = addressUtils.generatePseudoRandomAddress();
            const result = await lib.publicAppend.callAsync([], addr);
            const expected = [addr];
            expect(result).to.deep.equal(expected);
        });

        it('should append to non-empty array', async () => {
            const arr = _.times(3, () => addressUtils.generatePseudoRandomAddress());
            const addr = addressUtils.generatePseudoRandomAddress();
            const expected = [...arr, addr];
            const result = await lib.publicAppend.callAsync(arr, addr);
            expect(result).to.deep.equal(expected);
        });

        it('should revert if the free memory pointer was moved to before the end of the array', async () => {
            const arr = _.times(3, () => addressUtils.generatePseudoRandomAddress());
            const addr = addressUtils.generatePseudoRandomAddress();
            const freeMemOffset = new BigNumber(-1);
            const addressArrayEndPtr = new BigNumber(256);
            const expectedError = new LibAddressArrayRevertErrors.MismanagedMemoryError(
                addressArrayEndPtr.plus(freeMemOffset),
                addressArrayEndPtr,
            );
            return expect(lib.testAppendRealloc.callAsync(arr, freeMemOffset, addr)).to.revertWith(expectedError);
        });

        it('should keep the same memory address if free memory pointer does not move', async () => {
            const arr = _.times(3, () => addressUtils.generatePseudoRandomAddress());
            const addr = addressUtils.generatePseudoRandomAddress();
            const freeMemOffset = new BigNumber(0);
            const expected = [...arr, addr];
            const [result, oldArrayMemStart, newArrayMemStart] = await lib.testAppendRealloc.callAsync(
                arr,
                freeMemOffset,
                addr,
            );
            expect(result).to.deep.equal(expected);
            expect(newArrayMemStart).bignumber.to.be.equal(oldArrayMemStart);
        });

        it('should change memory address if free memory pointer advances', async () => {
            const arr = _.times(3, () => addressUtils.generatePseudoRandomAddress());
            const addr = addressUtils.generatePseudoRandomAddress();
            const freeMemOffset = new BigNumber(1);
            const expectedArray = [...arr, addr];
            const [result, oldArrayMemStart, newArrayMemStart] = await lib.testAppendRealloc.callAsync(
                arr,
                freeMemOffset,
                addr,
            );
            // The new location should be the end of the old array + freeMemOffset.
            const expectedNewArrayMemStart = oldArrayMemStart.plus((arr.length + 1) * 32).plus(freeMemOffset);
            expect(result).to.deep.equal(expectedArray);
            expect(newArrayMemStart).bignumber.to.be.equal(expectedNewArrayMemStart);
        });
    });

    describe('contains', () => {
        it('should return false on an empty array', async () => {
            const addr = addressUtils.generatePseudoRandomAddress();
            const isFound = await lib.publicContains.callAsync([], addr);
            expect(isFound).to.equal(false);
        });

        it('should return false on a missing item', async () => {
            const arr = _.times(3, () => addressUtils.generatePseudoRandomAddress());
            const addr = addressUtils.generatePseudoRandomAddress();
            const isFound = await lib.publicContains.callAsync(arr, addr);
            expect(isFound).to.equal(false);
        });

        it('should return true on an included item', async () => {
            const arr = _.times(4, () => addressUtils.generatePseudoRandomAddress());
            const addr = _.sample(arr) as string;
            const isFound = await lib.publicContains.callAsync(arr, addr);
            expect(isFound).to.equal(true);
        });

        it('should return true on the only item in the array', async () => {
            const arr = _.times(1, () => addressUtils.generatePseudoRandomAddress());
            const isFound = await lib.publicContains.callAsync(arr, arr[0]);
            expect(isFound).to.equal(true);
        });
    });

    describe('indexOf', () => {
        it('should fail on an empty array', async () => {
            const addr = addressUtils.generatePseudoRandomAddress();
            const [isSuccess] = await lib.publicIndexOf.callAsync([], addr);
            expect(isSuccess).to.equal(false);
        });

        it('should fail on a missing item', async () => {
            const arr = _.times(3, () => addressUtils.generatePseudoRandomAddress());
            const addr = addressUtils.generatePseudoRandomAddress();
            const [isSuccess] = await lib.publicIndexOf.callAsync(arr, addr);
            expect(isSuccess).to.equal(false);
        });

        it('should succeed on an included item', async () => {
            const arr = _.times(4, () => addressUtils.generatePseudoRandomAddress());
            const expectedIndexOf = _.random(0, arr.length - 1);
            const addr = arr[expectedIndexOf];
            const [isSuccess, index] = await lib.publicIndexOf.callAsync(arr, addr);
            expect(isSuccess).to.equal(true);
            expect(index).bignumber.to.equal(expectedIndexOf);
        });

        it('should succeed on the only item in the array', async () => {
            const arr = _.times(1, () => addressUtils.generatePseudoRandomAddress());
            const [isSuccess, index] = await lib.publicIndexOf.callAsync(arr, arr[0]);
            expect(isSuccess).to.equal(true);
            expect(index).bignumber.to.equal(0);
        });
    });
});
// tslint:disable:max-file-line-count
