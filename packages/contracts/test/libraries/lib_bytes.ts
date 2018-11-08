import { BlockchainLifecycle } from '@0x/dev-utils';
import { generatePseudoRandomSalt } from '@0x/order-utils';
import { RevertReason } from '@0x/types';
import { BigNumber } from '@0x/utils';
import BN = require('bn.js');
import * as chai from 'chai';
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';

import { TestLibBytesContract } from '../../generated-wrappers/test_lib_bytes';
import { artifacts } from '../../src/artifacts';
import { expectContractCallFailedAsync } from '../utils/assertions';
import { chaiSetup } from '../utils/chai_setup';
import { constants } from '../utils/constants';
import { typeEncodingUtils } from '../utils/type_encoding_utils';
import { provider, txDefaults, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

// BUG: Ideally we would use Buffer.from(memory).toString('hex')
// https://github.com/Microsoft/TypeScript/issues/23155
const toHex = (buf: Uint8Array): string => buf.reduce((a, v) => a + ('00' + v.toString(16)).slice(-2), '0x');

const fromHex = (str: string): Uint8Array => Uint8Array.from(Buffer.from(str.slice(2), 'hex'));

describe('LibBytes', () => {
    let libBytes: TestLibBytesContract;
    const byteArrayShorterThan32Bytes = '0x012345';
    const byteArrayShorterThan20Bytes = byteArrayShorterThan32Bytes;
    const byteArrayLongerThan32Bytes =
        '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    const byteArrayLongerThan32BytesFirstBytesSwapped =
        '0x2301456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    const byteArrayLongerThan32BytesLastBytesSwapped =
        '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abefcd';
    let testAddress: string;
    let testAddressB: string;
    const testBytes32 = '0x102030405060708090a0b0c0d0e0f0102030405060708090a0b0c0d0e0f01020';
    const testBytes32B = '0x534877abd8443578526845cdfef020047528759477fedef87346527659aced32';
    const testUint256 = new BigNumber(testBytes32, 16);
    const testUint256B = new BigNumber(testBytes32B, 16);
    const testBytes4 = '0xabcdef12';
    const testByte = '0xab';
    let shortData: string;
    let shortTestBytes: string;
    let shortTestBytesAsBuffer: Buffer;
    let wordOfData: string;
    let wordOfTestBytes: string;
    let wordOfTestBytesAsBuffer: Buffer;
    let longData: string;
    let longTestBytes: string;
    let longTestBytesAsBuffer: Buffer;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        // Setup accounts & addresses
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        testAddress = accounts[1];
        testAddressB = accounts[2];
        // Deploy LibBytes
        libBytes = await TestLibBytesContract.deployFrom0xArtifactAsync(artifacts.TestLibBytes, provider, txDefaults);
        // Verify lengths of test data
        const byteArrayShorterThan32BytesLength = ethUtil.toBuffer(byteArrayShorterThan32Bytes).byteLength;
        expect(byteArrayShorterThan32BytesLength).to.be.lessThan(32);
        const byteArrayLongerThan32BytesLength = ethUtil.toBuffer(byteArrayLongerThan32Bytes).byteLength;
        expect(byteArrayLongerThan32BytesLength).to.be.greaterThan(32);
        const testBytes32Length = ethUtil.toBuffer(testBytes32).byteLength;
        expect(testBytes32Length).to.be.equal(32);
        // Create short test bytes
        shortData = '0xffffaa';
        const encodedShortData = ethUtil.toBuffer(shortData);
        const shortDataLength = new BigNumber(encodedShortData.byteLength);
        const encodedShortDataLength = typeEncodingUtils.encodeUint256(shortDataLength);
        shortTestBytesAsBuffer = Buffer.concat([encodedShortDataLength, encodedShortData]);
        shortTestBytes = ethUtil.bufferToHex(shortTestBytesAsBuffer);
        // Create test bytes one word in length
        wordOfData = ethUtil.bufferToHex(typeEncodingUtils.encodeUint256(generatePseudoRandomSalt()));
        const encodedWordOfData = ethUtil.toBuffer(wordOfData);
        const wordOfDataLength = new BigNumber(encodedWordOfData.byteLength);
        const encodedWordOfDataLength = typeEncodingUtils.encodeUint256(wordOfDataLength);
        wordOfTestBytesAsBuffer = Buffer.concat([encodedWordOfDataLength, encodedWordOfData]);
        wordOfTestBytes = ethUtil.bufferToHex(wordOfTestBytesAsBuffer);
        // Create long test bytes (combines short test bytes with word of test bytes)
        longData = ethUtil.bufferToHex(Buffer.concat([encodedShortData, encodedWordOfData]));
        const longDataLength = new BigNumber(encodedShortData.byteLength + encodedWordOfData.byteLength);
        const encodedLongDataLength = typeEncodingUtils.encodeUint256(longDataLength);
        longTestBytesAsBuffer = Buffer.concat([encodedLongDataLength, encodedShortData, encodedWordOfData]);
        longTestBytes = ethUtil.bufferToHex(longTestBytesAsBuffer);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('popLastByte', () => {
        it('should revert if length is 0', async () => {
            return expectContractCallFailedAsync(
                libBytes.publicPopLastByte.callAsync(constants.NULL_BYTES),
                RevertReason.LibBytesGreaterThanZeroLengthRequired,
            );
        });
        it('should pop the last byte from the input and return it when array holds more than 1 byte', async () => {
            const [newBytes, poppedByte] = await libBytes.publicPopLastByte.callAsync(byteArrayLongerThan32Bytes);
            const expectedNewBytes = byteArrayLongerThan32Bytes.slice(0, -2);
            const expectedPoppedByte = `0x${byteArrayLongerThan32Bytes.slice(-2)}`;
            expect(newBytes).to.equal(expectedNewBytes);
            expect(poppedByte).to.equal(expectedPoppedByte);
        });
        it('should pop the last byte from the input and return it when array is exactly 1 byte', async () => {
            const [newBytes, poppedByte] = await libBytes.publicPopLastByte.callAsync(testByte);
            const expectedNewBytes = '0x';
            expect(newBytes).to.equal(expectedNewBytes);
            return expect(poppedByte).to.be.equal(testByte);
        });
    });

    describe('popLast20Bytes', () => {
        it('should revert if length is less than 20', async () => {
            return expectContractCallFailedAsync(
                libBytes.publicPopLast20Bytes.callAsync(byteArrayShorterThan20Bytes),
                RevertReason.LibBytesGreaterOrEqualTo20LengthRequired,
            );
        });
        it('should pop the last 20 bytes from the input and return it when array holds more than 20 bytes', async () => {
            const [newBytes, poppedAddress] = await libBytes.publicPopLast20Bytes.callAsync(byteArrayLongerThan32Bytes);
            const expectedNewBytes = byteArrayLongerThan32Bytes.slice(0, -40);
            const expectedPoppedAddress = `0x${byteArrayLongerThan32Bytes.slice(-40)}`;
            expect(newBytes).to.equal(expectedNewBytes);
            expect(poppedAddress).to.equal(expectedPoppedAddress);
        });
        it('should pop the last 20 bytes from the input and return it when array is exactly 20 bytes', async () => {
            const [newBytes, poppedAddress] = await libBytes.publicPopLast20Bytes.callAsync(testAddress);
            const expectedNewBytes = '0x';
            const expectedPoppedAddress = testAddress;
            expect(newBytes).to.equal(expectedNewBytes);
            expect(poppedAddress).to.equal(expectedPoppedAddress);
        });
    });

    describe('equals', () => {
        it('should return true if byte arrays are equal (both arrays < 32 bytes)', async () => {
            const isEqual = await libBytes.publicEquals.callAsync(
                byteArrayShorterThan32Bytes,
                byteArrayShorterThan32Bytes,
            );
            return expect(isEqual).to.be.true();
        });
        it('should return true if byte arrays are equal (both arrays > 32 bytes)', async () => {
            const isEqual = await libBytes.publicEquals.callAsync(
                byteArrayLongerThan32Bytes,
                byteArrayLongerThan32Bytes,
            );
            return expect(isEqual).to.be.true();
        });
        it('should return false if byte arrays are not equal (first array < 32 bytes, second array > 32 bytes)', async () => {
            const isEqual = await libBytes.publicEquals.callAsync(
                byteArrayShorterThan32Bytes,
                byteArrayLongerThan32Bytes,
            );
            return expect(isEqual).to.be.false();
        });
        it('should return false if byte arrays are not equal (first array > 32 bytes, second array < 32 bytes)', async () => {
            const isEqual = await libBytes.publicEquals.callAsync(
                byteArrayLongerThan32Bytes,
                byteArrayShorterThan32Bytes,
            );
            return expect(isEqual).to.be.false();
        });
        it('should return false if byte arrays are not equal (same length, but a byte in first word differs)', async () => {
            const isEqual = await libBytes.publicEquals.callAsync(
                byteArrayLongerThan32BytesFirstBytesSwapped,
                byteArrayLongerThan32Bytes,
            );
            return expect(isEqual).to.be.false();
        });
        it('should return false if byte arrays are not equal (same length, but a byte in last word differs)', async () => {
            const isEqual = await libBytes.publicEquals.callAsync(
                byteArrayLongerThan32BytesLastBytesSwapped,
                byteArrayLongerThan32Bytes,
            );
            return expect(isEqual).to.be.false();
        });

        describe('should ignore trailing data', () => {
            it('should return true when both < 32 bytes', async () => {
                const isEqual = await libBytes.publicEqualsPop1.callAsync('0x0102', '0x0103');
                return expect(isEqual).to.be.true();
            });
        });
    });

    describe('deepCopyBytes', () => {
        it('should revert if dest is shorter than source', async () => {
            return expectContractCallFailedAsync(
                libBytes.publicDeepCopyBytes.callAsync(byteArrayShorterThan32Bytes, byteArrayLongerThan32Bytes),
                RevertReason.LibBytesGreaterOrEqualToSourceBytesLengthRequired,
            );
        });
        it('should overwrite dest with source if source and dest have equal length', async () => {
            const zeroedByteArrayLongerThan32Bytes = `0x${_.repeat('0', byteArrayLongerThan32Bytes.length - 2)}`;
            const zeroedBytesAfterCopy = await libBytes.publicDeepCopyBytes.callAsync(
                zeroedByteArrayLongerThan32Bytes,
                byteArrayLongerThan32Bytes,
            );
            return expect(zeroedBytesAfterCopy).to.be.equal(byteArrayLongerThan32Bytes);
        });
        it('should overwrite the leftmost len(source) bytes of dest if dest is larger than source', async () => {
            const zeroedByteArrayLongerThan32Bytes = `0x${_.repeat('0', byteArrayLongerThan32Bytes.length * 2)}`;
            const zeroedBytesAfterCopy = await libBytes.publicDeepCopyBytes.callAsync(
                zeroedByteArrayLongerThan32Bytes,
                byteArrayLongerThan32Bytes,
            );
            const copiedBytes = zeroedBytesAfterCopy.slice(0, byteArrayLongerThan32Bytes.length);
            return expect(copiedBytes).to.be.equal(byteArrayLongerThan32Bytes);
        });
        it('should not overwrite the rightmost bytes of dest if dest is larger than source', async () => {
            const zeroedByteArrayLongerThan32Bytes = `0x${_.repeat('0', byteArrayLongerThan32Bytes.length * 2)}`;
            const zeroedBytesAfterCopy = await libBytes.publicDeepCopyBytes.callAsync(
                zeroedByteArrayLongerThan32Bytes,
                byteArrayLongerThan32Bytes,
            );
            const expectedNotCopiedBytes = zeroedByteArrayLongerThan32Bytes.slice(byteArrayLongerThan32Bytes.length);
            const notCopiedBytes = zeroedBytesAfterCopy.slice(byteArrayLongerThan32Bytes.length);
            return expect(notCopiedBytes).to.be.equal(expectedNotCopiedBytes);
        });
    });

    describe('readAddress', () => {
        it('should successfully read address when the address takes up the whole array', async () => {
            const byteArray = ethUtil.addHexPrefix(testAddress);
            const testAddressOffset = new BigNumber(0);
            const address = await libBytes.publicReadAddress.callAsync(byteArray, testAddressOffset);
            return expect(address).to.be.equal(testAddress);
        });
        it('should successfully read address when it is offset in the array', async () => {
            const addressByteArrayBuffer = ethUtil.toBuffer(testAddress);
            const prefixByteArrayBuffer = ethUtil.toBuffer('0xabcdef');
            const combinedByteArrayBuffer = Buffer.concat([prefixByteArrayBuffer, addressByteArrayBuffer]);
            const combinedByteArray = ethUtil.bufferToHex(combinedByteArrayBuffer);
            const testAddressOffset = new BigNumber(prefixByteArrayBuffer.byteLength);
            const address = await libBytes.publicReadAddress.callAsync(combinedByteArray, testAddressOffset);
            return expect(address).to.be.equal(testAddress);
        });
        it('should fail if the byte array is too short to hold an address', async () => {
            const shortByteArray = '0xabcdef';
            const offset = new BigNumber(0);
            return expectContractCallFailedAsync(
                libBytes.publicReadAddress.callAsync(shortByteArray, offset),
                RevertReason.LibBytesGreaterOrEqualTo20LengthRequired,
            );
        });
        it('should fail if the length between the offset and end of the byte array is too short to hold an address', async () => {
            const byteArray = testAddress;
            const badOffset = new BigNumber(ethUtil.toBuffer(byteArray).byteLength);
            return expectContractCallFailedAsync(
                libBytes.publicReadAddress.callAsync(byteArray, badOffset),
                RevertReason.LibBytesGreaterOrEqualTo20LengthRequired,
            );
        });
    });

    describe('writeAddress', () => {
        it('should successfully write address when the address takes up the whole array', async () => {
            const byteArray = testAddress;
            const testAddressOffset = new BigNumber(0);
            const newByteArray = await libBytes.publicWriteAddress.callAsync(
                byteArray,
                testAddressOffset,
                testAddressB,
            );
            return expect(newByteArray).to.be.equal(testAddressB);
        });
        it('should successfully write address when it is offset in the array', async () => {
            const addressByteArrayBuffer = ethUtil.toBuffer(testAddress);
            const prefixByteArrayBuffer = ethUtil.toBuffer('0xabcdef');
            const combinedByteArrayBuffer = Buffer.concat([prefixByteArrayBuffer, addressByteArrayBuffer]);
            const combinedByteArray = ethUtil.bufferToHex(combinedByteArrayBuffer);
            const testAddressOffset = new BigNumber(prefixByteArrayBuffer.byteLength);
            const newByteArray = await libBytes.publicWriteAddress.callAsync(
                combinedByteArray,
                testAddressOffset,
                testAddressB,
            );
            const newByteArrayBuffer = ethUtil.toBuffer(newByteArray);
            const addressFromOffsetBuffer = newByteArrayBuffer.slice(prefixByteArrayBuffer.byteLength);
            const addressFromOffset = ethUtil.addHexPrefix(ethUtil.bufferToHex(addressFromOffsetBuffer));
            return expect(addressFromOffset).to.be.equal(testAddressB);
        });
        it('should fail if the byte array is too short to hold an address', async () => {
            const offset = new BigNumber(0);
            return expectContractCallFailedAsync(
                libBytes.publicWriteAddress.callAsync(byteArrayShorterThan20Bytes, offset, testAddress),
                RevertReason.LibBytesGreaterOrEqualTo20LengthRequired,
            );
        });
        it('should fail if the length between the offset and end of the byte array is too short to hold an address', async () => {
            const byteArray = byteArrayLongerThan32Bytes;
            const badOffset = new BigNumber(ethUtil.toBuffer(byteArray).byteLength);
            return expectContractCallFailedAsync(
                libBytes.publicWriteAddress.callAsync(byteArray, badOffset, testAddress),
                RevertReason.LibBytesGreaterOrEqualTo20LengthRequired,
            );
        });
    });

    describe('readBytes32', () => {
        it('should successfully read bytes32 when the bytes32 takes up the whole array', async () => {
            const testBytes32Offset = new BigNumber(0);
            const bytes32 = await libBytes.publicReadBytes32.callAsync(testBytes32, testBytes32Offset);
            return expect(bytes32).to.be.equal(testBytes32);
        });
        it('should successfully read bytes32 when it is offset in the array', async () => {
            const bytes32ByteArrayBuffer = ethUtil.toBuffer(testBytes32);
            const prefixByteArrayBuffer = ethUtil.toBuffer('0xabcdef');
            const combinedByteArrayBuffer = Buffer.concat([prefixByteArrayBuffer, bytes32ByteArrayBuffer]);
            const combinedByteArray = ethUtil.bufferToHex(combinedByteArrayBuffer);
            const testBytes32Offset = new BigNumber(prefixByteArrayBuffer.byteLength);
            const bytes32 = await libBytes.publicReadBytes32.callAsync(combinedByteArray, testBytes32Offset);
            return expect(bytes32).to.be.equal(testBytes32);
        });
        it('should fail if the byte array is too short to hold a bytes32', async () => {
            const offset = new BigNumber(0);
            return expectContractCallFailedAsync(
                libBytes.publicReadBytes32.callAsync(byteArrayShorterThan32Bytes, offset),
                RevertReason.LibBytesGreaterOrEqualTo32LengthRequired,
            );
        });
        it('should fail if the length between the offset and end of the byte array is too short to hold a bytes32', async () => {
            const badOffset = new BigNumber(ethUtil.toBuffer(testBytes32).byteLength);
            return expectContractCallFailedAsync(
                libBytes.publicReadBytes32.callAsync(testBytes32, badOffset),
                RevertReason.LibBytesGreaterOrEqualTo32LengthRequired,
            );
        });
    });

    describe('writeBytes32', () => {
        it('should successfully write bytes32 when the address takes up the whole array', async () => {
            const byteArray = testBytes32;
            const testBytes32Offset = new BigNumber(0);
            const newByteArray = await libBytes.publicWriteBytes32.callAsync(
                byteArray,
                testBytes32Offset,
                testBytes32B,
            );
            return expect(newByteArray).to.be.equal(testBytes32B);
        });
        it('should successfully write bytes32 when it is offset in the array', async () => {
            const bytes32ByteArrayBuffer = ethUtil.toBuffer(testBytes32);
            const prefixByteArrayBuffer = ethUtil.toBuffer('0xabcdef');
            const combinedByteArrayBuffer = Buffer.concat([prefixByteArrayBuffer, bytes32ByteArrayBuffer]);
            const combinedByteArray = ethUtil.bufferToHex(combinedByteArrayBuffer);
            const testBytes32Offset = new BigNumber(prefixByteArrayBuffer.byteLength);
            const newByteArray = await libBytes.publicWriteBytes32.callAsync(
                combinedByteArray,
                testBytes32Offset,
                testBytes32B,
            );
            const newByteArrayBuffer = ethUtil.toBuffer(newByteArray);
            const bytes32FromOffsetBuffer = newByteArrayBuffer.slice(prefixByteArrayBuffer.byteLength);
            const bytes32FromOffset = ethUtil.addHexPrefix(ethUtil.bufferToHex(bytes32FromOffsetBuffer));
            return expect(bytes32FromOffset).to.be.equal(testBytes32B);
        });
        it('should fail if the byte array is too short to hold a bytes32', async () => {
            const offset = new BigNumber(0);
            return expectContractCallFailedAsync(
                libBytes.publicWriteBytes32.callAsync(byteArrayShorterThan32Bytes, offset, testBytes32),
                RevertReason.LibBytesGreaterOrEqualTo32LengthRequired,
            );
        });
        it('should fail if the length between the offset and end of the byte array is too short to hold a bytes32', async () => {
            const byteArray = byteArrayLongerThan32Bytes;
            const badOffset = new BigNumber(ethUtil.toBuffer(byteArray).byteLength);
            return expectContractCallFailedAsync(
                libBytes.publicWriteBytes32.callAsync(byteArray, badOffset, testBytes32),
                RevertReason.LibBytesGreaterOrEqualTo32LengthRequired,
            );
        });
    });

    describe('readUint256', () => {
        it('should successfully read uint256 when the uint256 takes up the whole array', async () => {
            const formattedTestUint256 = new BN(testUint256.toString(10));
            const testUint256AsBuffer = ethUtil.toBuffer(formattedTestUint256);
            const byteArray = ethUtil.bufferToHex(testUint256AsBuffer);
            const testUint256Offset = new BigNumber(0);
            const uint256 = await libBytes.publicReadUint256.callAsync(byteArray, testUint256Offset);
            return expect(uint256).to.bignumber.equal(testUint256);
        });
        it('should successfully read uint256 when it is offset in the array', async () => {
            const prefixByteArrayBuffer = ethUtil.toBuffer('0xabcdef');
            const formattedTestUint256 = new BN(testUint256.toString(10));
            const testUint256AsBuffer = ethUtil.toBuffer(formattedTestUint256);
            const combinedByteArrayBuffer = Buffer.concat([prefixByteArrayBuffer, testUint256AsBuffer]);
            const combinedByteArray = ethUtil.bufferToHex(combinedByteArrayBuffer);
            const testUint256Offset = new BigNumber(prefixByteArrayBuffer.byteLength);
            const uint256 = await libBytes.publicReadUint256.callAsync(combinedByteArray, testUint256Offset);
            return expect(uint256).to.bignumber.equal(testUint256);
        });
        it('should fail if the byte array is too short to hold a uint256', async () => {
            const offset = new BigNumber(0);
            return expectContractCallFailedAsync(
                libBytes.publicReadUint256.callAsync(byteArrayShorterThan32Bytes, offset),
                RevertReason.LibBytesGreaterOrEqualTo32LengthRequired,
            );
        });
        it('should fail if the length between the offset and end of the byte array is too short to hold a uint256', async () => {
            const formattedTestUint256 = new BN(testUint256.toString(10));
            const testUint256AsBuffer = ethUtil.toBuffer(formattedTestUint256);
            const byteArray = ethUtil.bufferToHex(testUint256AsBuffer);
            const badOffset = new BigNumber(testUint256AsBuffer.byteLength);
            return expectContractCallFailedAsync(
                libBytes.publicReadUint256.callAsync(byteArray, badOffset),
                RevertReason.LibBytesGreaterOrEqualTo32LengthRequired,
            );
        });
    });

    describe('writeUint256', () => {
        it('should successfully write uint256 when the address takes up the whole array', async () => {
            const byteArray = testBytes32;
            const testUint256Offset = new BigNumber(0);
            const newByteArray = await libBytes.publicWriteUint256.callAsync(
                byteArray,
                testUint256Offset,
                testUint256B,
            );
            const newByteArrayAsUint256 = new BigNumber(newByteArray, 16);
            return expect(newByteArrayAsUint256).to.be.bignumber.equal(testUint256B);
        });
        it('should successfully write uint256 when it is offset in the array', async () => {
            const bytes32ByteArrayBuffer = ethUtil.toBuffer(testBytes32);
            const prefixByteArrayBuffer = ethUtil.toBuffer('0xabcdef');
            const combinedByteArrayBuffer = Buffer.concat([prefixByteArrayBuffer, bytes32ByteArrayBuffer]);
            const combinedByteArray = ethUtil.bufferToHex(combinedByteArrayBuffer);
            const testUint256Offset = new BigNumber(prefixByteArrayBuffer.byteLength);
            const newByteArray = await libBytes.publicWriteUint256.callAsync(
                combinedByteArray,
                testUint256Offset,
                testUint256B,
            );
            const newByteArrayBuffer = ethUtil.toBuffer(newByteArray);
            const uint256FromOffsetBuffer = newByteArrayBuffer.slice(prefixByteArrayBuffer.byteLength);
            const uint256FromOffset = new BigNumber(
                ethUtil.addHexPrefix(ethUtil.bufferToHex(uint256FromOffsetBuffer)),
                16,
            );
            return expect(uint256FromOffset).to.be.bignumber.equal(testUint256B);
        });
        it('should fail if the byte array is too short to hold a uint256', async () => {
            const offset = new BigNumber(0);
            return expectContractCallFailedAsync(
                libBytes.publicWriteUint256.callAsync(byteArrayShorterThan32Bytes, offset, testUint256),
                RevertReason.LibBytesGreaterOrEqualTo32LengthRequired,
            );
        });
        it('should fail if the length between the offset and end of the byte array is too short to hold a uint256', async () => {
            const byteArray = byteArrayLongerThan32Bytes;
            const badOffset = new BigNumber(ethUtil.toBuffer(byteArray).byteLength);
            return expectContractCallFailedAsync(
                libBytes.publicWriteUint256.callAsync(byteArray, badOffset, testUint256),
                RevertReason.LibBytesGreaterOrEqualTo32LengthRequired,
            );
        });
    });

    describe('readBytes4', () => {
        // AssertionError: expected promise to be rejected with an error including 'revert' but it was fulfilled with '0x08c379a0'
        it('should revert if byte array has a length < 4', async () => {
            const byteArrayLessThan4Bytes = '0x010101';
            const offset = new BigNumber(0);
            return expectContractCallFailedAsync(
                libBytes.publicReadBytes4.callAsync(byteArrayLessThan4Bytes, offset),
                RevertReason.LibBytesGreaterOrEqualTo4LengthRequired,
            );
        });
        it('should return the first 4 bytes of a byte array of arbitrary length', async () => {
            const first4Bytes = await libBytes.publicReadBytes4.callAsync(byteArrayLongerThan32Bytes, new BigNumber(0));
            const expectedFirst4Bytes = byteArrayLongerThan32Bytes.slice(0, 10);
            expect(first4Bytes).to.equal(expectedFirst4Bytes);
        });
        it('should successfully read bytes4 when the bytes4 takes up the whole array', async () => {
            const testBytes4Offset = new BigNumber(0);
            const bytes4 = await libBytes.publicReadBytes4.callAsync(testBytes4, testBytes4Offset);
            return expect(bytes4).to.be.equal(testBytes4);
        });
        it('should successfully read bytes4 when it is offset in the array', async () => {
            const bytes4ByteArrayBuffer = ethUtil.toBuffer(testBytes4);
            const prefixByteArrayBuffer = ethUtil.toBuffer('0xabcdef');
            const combinedByteArrayBuffer = Buffer.concat([prefixByteArrayBuffer, bytes4ByteArrayBuffer]);
            const combinedByteArray = ethUtil.bufferToHex(combinedByteArrayBuffer);
            const testBytes4Offset = new BigNumber(prefixByteArrayBuffer.byteLength);
            const bytes4 = await libBytes.publicReadBytes4.callAsync(combinedByteArray, testBytes4Offset);
            return expect(bytes4).to.be.equal(testBytes4);
        });
        it('should fail if the length between the offset and end of the byte array is too short to hold a bytes4', async () => {
            const badOffset = new BigNumber(ethUtil.toBuffer(testBytes4).byteLength);
            return expectContractCallFailedAsync(
                libBytes.publicReadBytes4.callAsync(testBytes4, badOffset),
                RevertReason.LibBytesGreaterOrEqualTo4LengthRequired,
            );
        });
    });

    describe('readBytesWithLength', () => {
        it('should successfully read short, nested array of bytes when it takes up the whole array', async () => {
            const testBytesOffset = new BigNumber(0);
            const bytes = await libBytes.publicReadBytesWithLength.callAsync(shortTestBytes, testBytesOffset);
            return expect(bytes).to.be.equal(shortData);
        });
        it('should successfully read short, nested array of bytes when it is offset in the array', async () => {
            const prefixByteArrayBuffer = ethUtil.toBuffer('0xabcdef');
            const combinedByteArrayBuffer = Buffer.concat([prefixByteArrayBuffer, shortTestBytesAsBuffer]);
            const combinedByteArray = ethUtil.bufferToHex(combinedByteArrayBuffer);
            const testUint256Offset = new BigNumber(prefixByteArrayBuffer.byteLength);
            const bytes = await libBytes.publicReadBytesWithLength.callAsync(combinedByteArray, testUint256Offset);
            return expect(bytes).to.be.equal(shortData);
        });
        it('should successfully read a nested array of bytes - one word in length - when it takes up the whole array', async () => {
            const testBytesOffset = new BigNumber(0);
            const bytes = await libBytes.publicReadBytesWithLength.callAsync(wordOfTestBytes, testBytesOffset);
            return expect(bytes).to.be.equal(wordOfData);
        });
        it('should successfully read a nested array of bytes - one word in length - when it is offset in the array', async () => {
            const prefixByteArrayBuffer = ethUtil.toBuffer('0xabcdef');
            const combinedByteArrayBuffer = Buffer.concat([prefixByteArrayBuffer, wordOfTestBytesAsBuffer]);
            const combinedByteArray = ethUtil.bufferToHex(combinedByteArrayBuffer);
            const testUint256Offset = new BigNumber(prefixByteArrayBuffer.byteLength);
            const bytes = await libBytes.publicReadBytesWithLength.callAsync(combinedByteArray, testUint256Offset);
            return expect(bytes).to.be.equal(wordOfData);
        });
        it('should successfully read long, nested array of bytes when it takes up the whole array', async () => {
            const testBytesOffset = new BigNumber(0);
            const bytes = await libBytes.publicReadBytesWithLength.callAsync(longTestBytes, testBytesOffset);
            return expect(bytes).to.be.equal(longData);
        });
        it('should successfully read long, nested array of bytes when it is offset in the array', async () => {
            const prefixByteArrayBuffer = ethUtil.toBuffer('0xabcdef');
            const combinedByteArrayBuffer = Buffer.concat([prefixByteArrayBuffer, longTestBytesAsBuffer]);
            const combinedByteArray = ethUtil.bufferToHex(combinedByteArrayBuffer);
            const testUint256Offset = new BigNumber(prefixByteArrayBuffer.byteLength);
            const bytes = await libBytes.publicReadBytesWithLength.callAsync(combinedByteArray, testUint256Offset);
            return expect(bytes).to.be.equal(longData);
        });
        it('should fail if the byte array is too short to hold the length of a nested byte array', async () => {
            // The length of the nested array is 32 bytes. By storing less than 32 bytes, a length cannot be read.
            const offset = new BigNumber(0);
            return expectContractCallFailedAsync(
                libBytes.publicReadBytesWithLength.callAsync(byteArrayShorterThan32Bytes, offset),
                RevertReason.LibBytesGreaterOrEqualTo32LengthRequired,
            );
        });
        it('should fail if we store a nested byte array length, without a nested byte array', async () => {
            const offset = new BigNumber(0);
            return expectContractCallFailedAsync(
                libBytes.publicReadBytesWithLength.callAsync(testBytes32, offset),
                RevertReason.LibBytesGreaterOrEqualToNestedBytesLengthRequired,
            );
        });
        it('should fail if the length between the offset and end of the byte array is too short to hold the length of a nested byte array', async () => {
            const badOffset = new BigNumber(ethUtil.toBuffer(byteArrayShorterThan32Bytes).byteLength);
            return expectContractCallFailedAsync(
                libBytes.publicReadBytesWithLength.callAsync(byteArrayShorterThan32Bytes, badOffset),
                RevertReason.LibBytesGreaterOrEqualTo32LengthRequired,
            );
        });
        it('should fail if the length between the offset and end of the byte array is too short to hold the nested byte array', async () => {
            const badOffset = new BigNumber(ethUtil.toBuffer(testBytes32).byteLength);
            return expectContractCallFailedAsync(
                libBytes.publicReadBytesWithLength.callAsync(testBytes32, badOffset),
                RevertReason.LibBytesGreaterOrEqualTo32LengthRequired,
            );
        });
    });

    describe('writeBytesWithLength', () => {
        it('should successfully write short, nested array of bytes when it takes up the whole array', async () => {
            const testBytesOffset = new BigNumber(0);
            const emptyByteArray = ethUtil.bufferToHex(new Buffer(shortTestBytesAsBuffer.byteLength));
            const bytesWritten = await libBytes.publicWriteBytesWithLength.callAsync(
                emptyByteArray,
                testBytesOffset,
                shortData,
            );
            const bytesRead = await libBytes.publicReadBytesWithLength.callAsync(bytesWritten, testBytesOffset);
            return expect(bytesRead).to.be.equal(shortData);
        });
        it('should successfully write short, nested array of bytes when it is offset in the array', async () => {
            // Write a prefix to the array
            const prefixData = '0xabcdef';
            const prefixDataAsBuffer = ethUtil.toBuffer(prefixData);
            const prefixOffset = new BigNumber(0);
            const emptyByteArray = ethUtil.bufferToHex(
                new Buffer(prefixDataAsBuffer.byteLength + shortTestBytesAsBuffer.byteLength),
            );
            let bytesWritten = await libBytes.publicWriteBytesWithLength.callAsync(
                emptyByteArray,
                prefixOffset,
                prefixData,
            );
            // Write data after prefix
            const testBytesOffset = new BigNumber(prefixDataAsBuffer.byteLength);
            bytesWritten = await libBytes.publicWriteBytesWithLength.callAsync(
                bytesWritten,
                testBytesOffset,
                shortData,
            );
            // Read data after prefix and validate
            const bytes = await libBytes.publicReadBytesWithLength.callAsync(bytesWritten, testBytesOffset);
            return expect(bytes).to.be.equal(shortData);
        });
        it('should successfully write a nested array of bytes - one word in length - when it takes up the whole array', async () => {
            const testBytesOffset = new BigNumber(0);
            const emptyByteArray = ethUtil.bufferToHex(new Buffer(wordOfTestBytesAsBuffer.byteLength));
            const bytesWritten = await libBytes.publicWriteBytesWithLength.callAsync(
                emptyByteArray,
                testBytesOffset,
                wordOfData,
            );
            const bytesRead = await libBytes.publicReadBytesWithLength.callAsync(bytesWritten, testBytesOffset);
            return expect(bytesRead).to.be.equal(wordOfData);
        });
        it('should successfully write a nested array of bytes - one word in length - when it is offset in the array', async () => {
            // Write a prefix to the array
            const prefixData = '0xabcdef';
            const prefixDataAsBuffer = ethUtil.toBuffer(prefixData);
            const prefixOffset = new BigNumber(0);
            const emptyByteArray = ethUtil.bufferToHex(
                new Buffer(prefixDataAsBuffer.byteLength + wordOfTestBytesAsBuffer.byteLength),
            );
            let bytesWritten = await libBytes.publicWriteBytesWithLength.callAsync(
                emptyByteArray,
                prefixOffset,
                prefixData,
            );
            // Write data after prefix
            const testBytesOffset = new BigNumber(prefixDataAsBuffer.byteLength);
            bytesWritten = await libBytes.publicWriteBytesWithLength.callAsync(
                bytesWritten,
                testBytesOffset,
                wordOfData,
            );
            // Read data after prefix and validate
            const bytes = await libBytes.publicReadBytesWithLength.callAsync(bytesWritten, testBytesOffset);
            return expect(bytes).to.be.equal(wordOfData);
        });
        it('should successfully write a long, nested bytes when it takes up the whole array', async () => {
            const testBytesOffset = new BigNumber(0);
            const emptyByteArray = ethUtil.bufferToHex(new Buffer(longTestBytesAsBuffer.byteLength));
            const bytesWritten = await libBytes.publicWriteBytesWithLength.callAsync(
                emptyByteArray,
                testBytesOffset,
                longData,
            );
            const bytesRead = await libBytes.publicReadBytesWithLength.callAsync(bytesWritten, testBytesOffset);
            return expect(bytesRead).to.be.equal(longData);
        });
        it('should successfully write long, nested array of bytes when it is offset in the array', async () => {
            // Write a prefix to the array
            const prefixData = '0xabcdef';
            const prefixDataAsBuffer = ethUtil.toBuffer(prefixData);
            const prefixOffset = new BigNumber(0);
            const emptyByteArray = ethUtil.bufferToHex(
                new Buffer(prefixDataAsBuffer.byteLength + longTestBytesAsBuffer.byteLength),
            );
            let bytesWritten = await libBytes.publicWriteBytesWithLength.callAsync(
                emptyByteArray,
                prefixOffset,
                prefixData,
            );
            // Write data after prefix
            const testBytesOffset = new BigNumber(prefixDataAsBuffer.byteLength);
            bytesWritten = await libBytes.publicWriteBytesWithLength.callAsync(bytesWritten, testBytesOffset, longData);
            // Read data after prefix and validate
            const bytes = await libBytes.publicReadBytesWithLength.callAsync(bytesWritten, testBytesOffset);
            return expect(bytes).to.be.equal(longData);
        });
        it('should fail if the byte array is too short to hold the length of a nested byte array', async () => {
            const offset = new BigNumber(0);
            const emptyByteArray = ethUtil.bufferToHex(new Buffer(1));
            return expectContractCallFailedAsync(
                libBytes.publicWriteBytesWithLength.callAsync(emptyByteArray, offset, longData),
                RevertReason.LibBytesGreaterOrEqualToNestedBytesLengthRequired,
            );
        });
        it('should fail if the length between the offset and end of the byte array is too short to hold the length of a nested byte array', async () => {
            const emptyByteArray = ethUtil.bufferToHex(new Buffer(shortTestBytesAsBuffer.byteLength));
            const badOffset = new BigNumber(ethUtil.toBuffer(shortTestBytesAsBuffer).byteLength);
            return expectContractCallFailedAsync(
                libBytes.publicWriteBytesWithLength.callAsync(emptyByteArray, badOffset, shortData),
                RevertReason.LibBytesGreaterOrEqualToNestedBytesLengthRequired,
            );
        });
    });

    describe('memCopy', () => {
        // Create memory 0x000102...FF
        const memSize = 256;
        // tslint:disable:no-shadowed-variable
        const memory = new Uint8Array(memSize).map((_, i) => i);
        const memHex = toHex(memory);

        // Reference implementation to test against
        const refMemcpy = (mem: Uint8Array, dest: number, source: number, length: number): Uint8Array =>
            Uint8Array.from(mem).copyWithin(dest, source, source + length);

        // Test vectors: destination, source, length, job description
        type Tests = Array<[number, number, number, string]>;

        const test = (tests: Tests) =>
            tests.forEach(([dest, source, length, job]) =>
                it(job, async () => {
                    const expected = refMemcpy(memory, dest, source, length);
                    const resultStr = await libBytes.testMemcpy.callAsync(
                        memHex,
                        new BigNumber(dest),
                        new BigNumber(source),
                        new BigNumber(length),
                    );
                    const result = fromHex(resultStr);
                    expect(result).to.deep.equal(expected);
                }),
            );

        test([[0, 0, 0, 'copies zero bytes with overlap']]);

        describe('copies forward', () =>
            test([
                [128, 0, 0, 'zero bytes'],
                [128, 0, 1, 'one byte'],
                [128, 0, 11, 'eleven bytes'],
                [128, 0, 31, 'thirty-one bytes'],
                [128, 0, 32, 'one word'],
                [128, 0, 64, 'two words'],
                [128, 0, 96, 'three words'],
                [128, 0, 33, 'one word and one byte'],
                [128, 0, 72, 'two words and eight bytes'],
                [128, 0, 100, 'three words and four bytes'],
            ]));

        describe('copies forward within one word', () =>
            test([
                [16, 0, 0, 'zero bytes'],
                [16, 0, 1, 'one byte'],
                [16, 0, 11, 'eleven bytes'],
                [16, 0, 16, 'sixteen bytes'],
            ]));

        describe('copies forward with one byte overlap', () =>
            test([
                [0, 0, 1, 'one byte'],
                [10, 0, 11, 'eleven bytes'],
                [30, 0, 31, 'thirty-one bytes'],
                [31, 0, 32, 'one word'],
                [32, 0, 33, 'one word and one byte'],
                [71, 0, 72, 'two words and eight bytes'],
                [99, 0, 100, 'three words and four bytes'],
            ]));

        describe('copies forward with thirty-one bytes overlap', () =>
            test([
                [0, 0, 31, 'thirty-one bytes'],
                [1, 0, 32, 'one word'],
                [2, 0, 33, 'one word and one byte'],
                [41, 0, 72, 'two words and eight bytes'],
                [69, 0, 100, 'three words and four bytes'],
            ]));

        describe('copies forward with one word overlap', () =>
            test([
                [0, 0, 32, 'one word'],
                [1, 0, 33, 'one word and one byte'],
                [41, 0, 72, 'two words and eight bytes'],
                [69, 0, 100, 'three words and four bytes'],
            ]));

        describe('copies forward with one word and one byte overlap', () =>
            test([
                [0, 0, 33, 'one word and one byte'],
                [40, 0, 72, 'two words and eight bytes'],
                [68, 0, 100, 'three words and four bytes'],
            ]));

        describe('copies forward with two words overlap', () =>
            test([
                [0, 0, 64, 'two words'],
                [8, 0, 72, 'two words and eight bytes'],
                [36, 0, 100, 'three words and four bytes'],
            ]));

        describe('copies forward within one word and one byte overlap', () =>
            test([[0, 0, 1, 'one byte'], [10, 0, 11, 'eleven bytes'], [15, 0, 16, 'sixteen bytes']]));

        describe('copies backward', () =>
            test([
                [0, 128, 0, 'zero bytes'],
                [0, 128, 1, 'one byte'],
                [0, 128, 11, 'eleven bytes'],
                [0, 128, 31, 'thirty-one bytes'],
                [0, 128, 32, 'one word'],
                [0, 128, 64, 'two words'],
                [0, 128, 96, 'three words'],
                [0, 128, 33, 'one word and one byte'],
                [0, 128, 72, 'two words and eight bytes'],
                [0, 128, 100, 'three words and four bytes'],
            ]));

        describe('copies backward within one word', () =>
            test([
                [0, 16, 0, 'zero bytes'],
                [0, 16, 1, 'one byte'],
                [0, 16, 11, 'eleven bytes'],
                [0, 16, 16, 'sixteen bytes'],
            ]));

        describe('copies backward with one byte overlap', () =>
            test([
                [0, 0, 1, 'one byte'],
                [0, 10, 11, 'eleven bytes'],
                [0, 30, 31, 'thirty-one bytes'],
                [0, 31, 32, 'one word'],
                [0, 32, 33, 'one word and one byte'],
                [0, 71, 72, 'two words and eight bytes'],
                [0, 99, 100, 'three words and four bytes'],
            ]));

        describe('copies backward with thirty-one bytes overlap', () =>
            test([
                [0, 0, 31, 'thirty-one bytes'],
                [0, 1, 32, 'one word'],
                [0, 2, 33, 'one word and one byte'],
                [0, 41, 72, 'two words and eight bytes'],
                [0, 69, 100, 'three words and four bytes'],
            ]));

        describe('copies backward with one word overlap', () =>
            test([
                [0, 0, 32, 'one word'],
                [0, 1, 33, 'one word and one byte'],
                [0, 41, 72, 'two words and eight bytes'],
                [0, 69, 100, 'three words and four bytes'],
            ]));

        describe('copies backward with one word and one byte overlap', () =>
            test([
                [0, 0, 33, 'one word and one byte'],
                [0, 40, 72, 'two words and eight bytes'],
                [0, 68, 100, 'three words and four bytes'],
            ]));

        describe('copies backward with two words overlap', () =>
            test([
                [0, 0, 64, 'two words'],
                [0, 8, 72, 'two words and eight bytes'],
                [0, 36, 100, 'three words and four bytes'],
            ]));

        describe('copies forward within one word and one byte overlap', () =>
            test([[0, 0, 1, 'one byte'], [0, 10, 11, 'eleven bytes'], [0, 15, 16, 'sixteen bytes']]));
    });
});
// tslint:disable:max-file-line-count
