import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { assetProxyUtils, generatePseudoRandomSalt } from '@0xproject/order-utils';
import { BigNumber } from '@0xproject/utils';
import BN = require('bn.js');
import * as chai from 'chai';
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';

import { TestLibBytesContract } from '../../src/generated_contract_wrappers/test_lib_bytes';
import { addressUtils } from '../../src/utils/address_utils';
import { artifacts } from '../../src/utils/artifacts';
import { expectRevertOrOtherErrorAsync } from '../../src/utils/assertions';
import { chaiSetup } from '../../src/utils/chai_setup';
import { constants } from '../../src/utils/constants';
import { provider, txDefaults, web3Wrapper } from '../../src/utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

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
    const testBytes32 = '0x102030405060708090a0b0c0d0e0f0102030405060708090a0b0c0d0e0f01020';
    const testUint256 = new BigNumber(testBytes32, 16);
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
        const encodedShortDataLength = assetProxyUtils.encodeUint256(shortDataLength);
        shortTestBytesAsBuffer = Buffer.concat([encodedShortDataLength, encodedShortData]);
        shortTestBytes = ethUtil.bufferToHex(shortTestBytesAsBuffer);
        // Create test bytes one word in length
        wordOfData = ethUtil.bufferToHex(assetProxyUtils.encodeUint256(generatePseudoRandomSalt()));
        const encodedWordOfData = ethUtil.toBuffer(wordOfData);
        const wordOfDataLength = new BigNumber(encodedWordOfData.byteLength);
        const encodedWordOfDataLength = assetProxyUtils.encodeUint256(wordOfDataLength);
        wordOfTestBytesAsBuffer = Buffer.concat([encodedWordOfDataLength, encodedWordOfData]);
        wordOfTestBytes = ethUtil.bufferToHex(wordOfTestBytesAsBuffer);
        // Create long test bytes (combines short test bytes with word of test bytes)
        longData = ethUtil.bufferToHex(Buffer.concat([encodedShortData, encodedWordOfData]));
        const longDataLength = new BigNumber(encodedShortData.byteLength + encodedWordOfData.byteLength);
        const encodedLongDataLength = assetProxyUtils.encodeUint256(longDataLength);
        longTestBytesAsBuffer = Buffer.concat([encodedLongDataLength, encodedShortData, encodedWordOfData]);
        longTestBytes = ethUtil.bufferToHex(longTestBytesAsBuffer);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('popByte', () => {
        it('should revert if length is 0', async () => {
            return expectRevertOrOtherErrorAsync(
                libBytes.publicPopByte.callAsync(constants.NULL_BYTES),
                constants.LIB_BYTES_GREATER_THAN_ZERO_LENGTH_REQUIRED,
            );
        });
        it('should pop the last byte from the input and return it', async () => {
            const [newBytes, poppedByte] = await libBytes.publicPopByte.callAsync(byteArrayLongerThan32Bytes);
            const expectedNewBytes = byteArrayLongerThan32Bytes.slice(0, -2);
            const expectedPoppedByte = `0x${byteArrayLongerThan32Bytes.slice(-2)}`;
            expect(newBytes).to.equal(expectedNewBytes);
            expect(poppedByte).to.equal(expectedPoppedByte);
        });
    });

    describe('popAddress', () => {
        it('should revert if length is less than 20', async () => {
            return expectRevertOrOtherErrorAsync(
                libBytes.publicPopAddress.callAsync(byteArrayShorterThan20Bytes),
                constants.LIB_BYTES_GREATER_OR_EQUAL_TO_20_LENGTH_REQUIRED,
            );
        });
        it('should pop the last 20 bytes from the input and return it', async () => {
            const [newBytes, poppedAddress] = await libBytes.publicPopAddress.callAsync(byteArrayLongerThan32Bytes);
            const expectedNewBytes = byteArrayLongerThan32Bytes.slice(0, -40);
            const expectedPoppedAddress = `0x${byteArrayLongerThan32Bytes.slice(-40)}`;
            expect(newBytes).to.equal(expectedNewBytes);
            expect(poppedAddress).to.equal(expectedPoppedAddress);
        });
    });

    describe('areBytesEqual', () => {
        it('should return true if byte arrays are equal (both arrays < 32 bytes)', async () => {
            const areBytesEqual = await libBytes.publicAreBytesEqual.callAsync(
                byteArrayShorterThan32Bytes,
                byteArrayShorterThan32Bytes,
            );
            return expect(areBytesEqual).to.be.true();
        });
        it('should return true if byte arrays are equal (both arrays > 32 bytes)', async () => {
            const areBytesEqual = await libBytes.publicAreBytesEqual.callAsync(
                byteArrayLongerThan32Bytes,
                byteArrayLongerThan32Bytes,
            );
            return expect(areBytesEqual).to.be.true();
        });
        it('should return false if byte arrays are not equal (first array < 32 bytes, second array > 32 bytes)', async () => {
            const areBytesEqual = await libBytes.publicAreBytesEqual.callAsync(
                byteArrayShorterThan32Bytes,
                byteArrayLongerThan32Bytes,
            );
            return expect(areBytesEqual).to.be.false();
        });
        it('should return false if byte arrays are not equal (first array > 32 bytes, second array < 32 bytes)', async () => {
            const areBytesEqual = await libBytes.publicAreBytesEqual.callAsync(
                byteArrayLongerThan32Bytes,
                byteArrayShorterThan32Bytes,
            );
            return expect(areBytesEqual).to.be.false();
        });
        it('should return false if byte arrays are not equal (same length, but a byte in first word differs)', async () => {
            const areBytesEqual = await libBytes.publicAreBytesEqual.callAsync(
                byteArrayLongerThan32BytesFirstBytesSwapped,
                byteArrayLongerThan32Bytes,
            );
            return expect(areBytesEqual).to.be.false();
        });
        it('should return false if byte arrays are not equal (same length, but a byte in last word differs)', async () => {
            const areBytesEqual = await libBytes.publicAreBytesEqual.callAsync(
                byteArrayLongerThan32BytesLastBytesSwapped,
                byteArrayLongerThan32Bytes,
            );
            return expect(areBytesEqual).to.be.false();
        });
    });

    describe('deepCopyBytes', () => {
        it('should revert if dest is shorter than source', async () => {
            return expectRevertOrOtherErrorAsync(
                libBytes.publicDeepCopyBytes.callAsync(byteArrayShorterThan32Bytes, byteArrayLongerThan32Bytes),
                constants.LIB_BYTES_GREATER_OR_EQUAL_TO_SOURCE_BYTES_LENGTH_REQUIRED,
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
            return expectRevertOrOtherErrorAsync(
                libBytes.publicReadAddress.callAsync(shortByteArray, offset),
                constants.LIB_BYTES_GREATER_OR_EQUAL_TO_20_LENGTH_REQUIRED,
            );
        });
        it('should fail if the length between the offset and end of the byte array is too short to hold an address', async () => {
            const byteArray = testAddress;
            const badOffset = new BigNumber(ethUtil.toBuffer(byteArray).byteLength);
            return expectRevertOrOtherErrorAsync(
                libBytes.publicReadAddress.callAsync(byteArray, badOffset),
                constants.LIB_BYTES_GREATER_OR_EQUAL_TO_20_LENGTH_REQUIRED,
            );
        });
    });

    describe('writeAddress', () => {
        it('should successfully write address when the address takes up the whole array', async () => {
            const byteArray = testAddress;
            const testAddressOffset = new BigNumber(0);
            const psuedoRandomAddress = addressUtils.generatePseudoRandomAddress();
            const newByteArray = await libBytes.publicWriteAddress.callAsync(
                byteArray,
                testAddressOffset,
                psuedoRandomAddress,
            );
            return expect(newByteArray).to.be.equal(psuedoRandomAddress);
        });
        it('should successfully write address when it is offset in the array', async () => {
            const addressByteArrayBuffer = ethUtil.toBuffer(testAddress);
            const prefixByteArrayBuffer = ethUtil.toBuffer('0xabcdef');
            const combinedByteArrayBuffer = Buffer.concat([prefixByteArrayBuffer, addressByteArrayBuffer]);
            const combinedByteArray = ethUtil.bufferToHex(combinedByteArrayBuffer);
            const testAddressOffset = new BigNumber(prefixByteArrayBuffer.byteLength);
            const psuedoRandomAddress = addressUtils.generatePseudoRandomAddress();
            const newByteArray = await libBytes.publicWriteAddress.callAsync(
                combinedByteArray,
                testAddressOffset,
                psuedoRandomAddress,
            );
            const newByteArrayBuffer = ethUtil.toBuffer(newByteArray);
            const addressFromOffsetBuffer = newByteArrayBuffer.slice(prefixByteArrayBuffer.byteLength);
            const addressFromOffset = ethUtil.addHexPrefix(ethUtil.bufferToHex(addressFromOffsetBuffer));
            return expect(addressFromOffset).to.be.equal(psuedoRandomAddress);
        });
        it('should fail if the byte array is too short to hold an address', async () => {
            const offset = new BigNumber(0);
            return expectRevertOrOtherErrorAsync(
                libBytes.publicWriteAddress.callAsync(byteArrayShorterThan20Bytes, offset, testAddress),
                constants.LIB_BYTES_GREATER_OR_EQUAL_TO_20_LENGTH_REQUIRED,
            );
        });
        it('should fail if the length between the offset and end of the byte array is too short to hold an address', async () => {
            const byteArray = byteArrayLongerThan32Bytes;
            const badOffset = new BigNumber(ethUtil.toBuffer(byteArray).byteLength);
            return expectRevertOrOtherErrorAsync(
                libBytes.publicWriteAddress.callAsync(byteArray, badOffset, testAddress),
                constants.LIB_BYTES_GREATER_OR_EQUAL_TO_20_LENGTH_REQUIRED,
            );
        });
    });

    describe('readBytes32', () => {
        it('should successfully read bytes32 when the bytes32 takes up the whole array', async () => {
            const testBytes32Offset = new BigNumber(0);
            const bytes32 = await libBytes.publicReadBytes32.callAsync(testBytes32, testBytes32Offset);
            return expect(bytes32).to.be.equal(testBytes32);
        });
        it('should successfully read bytes32 when it is offset in the array)', async () => {
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
            return expectRevertOrOtherErrorAsync(
                libBytes.publicReadBytes32.callAsync(byteArrayShorterThan32Bytes, offset),
                constants.LIB_BYTES_GREATER_OR_EQUAL_TO_32_LENGTH_REQUIRED,
            );
        });
        it('should fail if the length between the offset and end of the byte array is too short to hold a bytes32', async () => {
            const badOffset = new BigNumber(ethUtil.toBuffer(testBytes32).byteLength);
            return expectRevertOrOtherErrorAsync(
                libBytes.publicReadBytes32.callAsync(testBytes32, badOffset),
                constants.LIB_BYTES_GREATER_OR_EQUAL_TO_32_LENGTH_REQUIRED,
            );
        });
    });

    describe('writeBytes32', () => {
        it('should successfully write bytes32 when the address takes up the whole array', async () => {
            const byteArray = testBytes32;
            const testBytes32Offset = new BigNumber(0);
            const pseudoRandomBytes32 = ethUtil.addHexPrefix(generatePseudoRandomSalt().toString(16));
            const newByteArray = await libBytes.publicWriteBytes32.callAsync(
                byteArray,
                testBytes32Offset,
                pseudoRandomBytes32,
            );
            return expect(newByteArray).to.be.equal(pseudoRandomBytes32);
        });
        it('should successfully write bytes32 when it is offset in the array', async () => {
            const bytes32ByteArrayBuffer = ethUtil.toBuffer(testBytes32);
            const prefixByteArrayBuffer = ethUtil.toBuffer('0xabcdef');
            const combinedByteArrayBuffer = Buffer.concat([prefixByteArrayBuffer, bytes32ByteArrayBuffer]);
            const combinedByteArray = ethUtil.bufferToHex(combinedByteArrayBuffer);
            const testBytes32Offset = new BigNumber(prefixByteArrayBuffer.byteLength);
            const pseudoRandomBytes32 = ethUtil.addHexPrefix(generatePseudoRandomSalt().toString(16));
            const newByteArray = await libBytes.publicWriteBytes32.callAsync(
                combinedByteArray,
                testBytes32Offset,
                pseudoRandomBytes32,
            );
            const newByteArrayBuffer = ethUtil.toBuffer(newByteArray);
            const bytes32FromOffsetBuffer = newByteArrayBuffer.slice(prefixByteArrayBuffer.byteLength);
            const bytes32FromOffset = ethUtil.addHexPrefix(ethUtil.bufferToHex(bytes32FromOffsetBuffer));
            return expect(bytes32FromOffset).to.be.equal(pseudoRandomBytes32);
        });
        it('should fail if the byte array is too short to hold a bytes32', async () => {
            const offset = new BigNumber(0);
            return expectRevertOrOtherErrorAsync(
                libBytes.publicWriteBytes32.callAsync(byteArrayShorterThan32Bytes, offset, testBytes32),
                constants.LIB_BYTES_GREATER_OR_EQUAL_TO_32_LENGTH_REQUIRED,
            );
        });
        it('should fail if the length between the offset and end of the byte array is too short to hold a bytes32', async () => {
            const byteArray = byteArrayLongerThan32Bytes;
            const badOffset = new BigNumber(ethUtil.toBuffer(byteArray).byteLength);
            return expectRevertOrOtherErrorAsync(
                libBytes.publicWriteBytes32.callAsync(byteArray, badOffset, testBytes32),
                constants.LIB_BYTES_GREATER_OR_EQUAL_TO_32_LENGTH_REQUIRED,
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
            return expectRevertOrOtherErrorAsync(
                libBytes.publicReadUint256.callAsync(byteArrayShorterThan32Bytes, offset),
                constants.LIB_BYTES_GREATER_OR_EQUAL_TO_32_LENGTH_REQUIRED,
            );
        });
        it('should fail if the length between the offset and end of the byte array is too short to hold a uint256', async () => {
            const formattedTestUint256 = new BN(testUint256.toString(10));
            const testUint256AsBuffer = ethUtil.toBuffer(formattedTestUint256);
            const byteArray = ethUtil.bufferToHex(testUint256AsBuffer);
            const badOffset = new BigNumber(testUint256AsBuffer.byteLength);
            return expectRevertOrOtherErrorAsync(
                libBytes.publicReadUint256.callAsync(byteArray, badOffset),
                constants.LIB_BYTES_GREATER_OR_EQUAL_TO_32_LENGTH_REQUIRED,
            );
        });
    });

    describe('writeUint256', () => {
        it('should successfully write uint256 when the address takes up the whole array', async () => {
            const byteArray = testBytes32;
            const testUint256Offset = new BigNumber(0);
            const pseudoRandomUint256 = generatePseudoRandomSalt();
            const newByteArray = await libBytes.publicWriteUint256.callAsync(
                byteArray,
                testUint256Offset,
                pseudoRandomUint256,
            );
            const newByteArrayAsUint256 = new BigNumber(newByteArray, 16);
            return expect(newByteArrayAsUint256).to.be.bignumber.equal(pseudoRandomUint256);
        });
        it('should successfully write uint256 when it is offset in the array', async () => {
            const bytes32ByteArrayBuffer = ethUtil.toBuffer(testBytes32);
            const prefixByteArrayBuffer = ethUtil.toBuffer('0xabcdef');
            const combinedByteArrayBuffer = Buffer.concat([prefixByteArrayBuffer, bytes32ByteArrayBuffer]);
            const combinedByteArray = ethUtil.bufferToHex(combinedByteArrayBuffer);
            const testUint256Offset = new BigNumber(prefixByteArrayBuffer.byteLength);
            const pseudoRandomUint256 = generatePseudoRandomSalt();
            const newByteArray = await libBytes.publicWriteUint256.callAsync(
                combinedByteArray,
                testUint256Offset,
                pseudoRandomUint256,
            );
            const newByteArrayBuffer = ethUtil.toBuffer(newByteArray);
            const uint256FromOffsetBuffer = newByteArrayBuffer.slice(prefixByteArrayBuffer.byteLength);
            const uint256FromOffset = new BigNumber(
                ethUtil.addHexPrefix(ethUtil.bufferToHex(uint256FromOffsetBuffer)),
                16,
            );
            return expect(uint256FromOffset).to.be.bignumber.equal(pseudoRandomUint256);
        });
        it('should fail if the byte array is too short to hold a uint256', async () => {
            const offset = new BigNumber(0);
            return expectRevertOrOtherErrorAsync(
                libBytes.publicWriteUint256.callAsync(byteArrayShorterThan32Bytes, offset, testUint256),
                constants.LIB_BYTES_GREATER_OR_EQUAL_TO_32_LENGTH_REQUIRED,
            );
        });
        it('should fail if the length between the offset and end of the byte array is too short to hold a uint256', async () => {
            const byteArray = byteArrayLongerThan32Bytes;
            const badOffset = new BigNumber(ethUtil.toBuffer(byteArray).byteLength);
            return expectRevertOrOtherErrorAsync(
                libBytes.publicWriteUint256.callAsync(byteArray, badOffset, testUint256),
                constants.LIB_BYTES_GREATER_OR_EQUAL_TO_32_LENGTH_REQUIRED,
            );
        });
    });

    describe('readFirst4', () => {
        // AssertionError: expected promise to be rejected with an error including 'revert' but it was fulfilled with '0x08c379a0'
        it('should revert if byte array has a length < 4', async () => {
            const byteArrayLessThan4Bytes = '0x010101';
            return expectRevertOrOtherErrorAsync(
                libBytes.publicReadFirst4.callAsync(byteArrayLessThan4Bytes),
                constants.LIB_BYTES_GREATER_OR_EQUAL_TO_4_LENGTH_REQUIRED,
            );
        });
        it('should return the first 4 bytes of a byte array of arbitrary length', async () => {
            const first4Bytes = await libBytes.publicReadFirst4.callAsync(byteArrayLongerThan32Bytes);
            const expectedFirst4Bytes = byteArrayLongerThan32Bytes.slice(0, 10);
            expect(first4Bytes).to.equal(expectedFirst4Bytes);
        });
    });

    describe('readBytes', () => {
        it('should successfully read short, nested array of bytes when it takes up the whole array', async () => {
            const testBytesOffset = new BigNumber(0);
            const bytes = await libBytes.publicReadBytes.callAsync(shortTestBytes, testBytesOffset);
            return expect(bytes).to.be.equal(shortData);
        });
        it('should successfully read short, nested array of bytes when it is offset in the array', async () => {
            const prefixByteArrayBuffer = ethUtil.toBuffer('0xabcdef');
            const combinedByteArrayBuffer = Buffer.concat([prefixByteArrayBuffer, shortTestBytesAsBuffer]);
            const combinedByteArray = ethUtil.bufferToHex(combinedByteArrayBuffer);
            const testUint256Offset = new BigNumber(prefixByteArrayBuffer.byteLength);
            const bytes = await libBytes.publicReadBytes.callAsync(combinedByteArray, testUint256Offset);
            return expect(bytes).to.be.equal(shortData);
        });
        it('should successfully read a nested array of bytes - one word in length - when it takes up the whole array', async () => {
            const testBytesOffset = new BigNumber(0);
            const bytes = await libBytes.publicReadBytes.callAsync(wordOfTestBytes, testBytesOffset);
            return expect(bytes).to.be.equal(wordOfData);
        });
        it('should successfully read a nested array of bytes - one word in length - when it is offset in the array', async () => {
            const prefixByteArrayBuffer = ethUtil.toBuffer('0xabcdef');
            const combinedByteArrayBuffer = Buffer.concat([prefixByteArrayBuffer, wordOfTestBytesAsBuffer]);
            const combinedByteArray = ethUtil.bufferToHex(combinedByteArrayBuffer);
            const testUint256Offset = new BigNumber(prefixByteArrayBuffer.byteLength);
            const bytes = await libBytes.publicReadBytes.callAsync(combinedByteArray, testUint256Offset);
            return expect(bytes).to.be.equal(wordOfData);
        });
        it('should successfully read long, nested array of bytes when it takes up the whole array', async () => {
            const testBytesOffset = new BigNumber(0);
            const bytes = await libBytes.publicReadBytes.callAsync(longTestBytes, testBytesOffset);
            return expect(bytes).to.be.equal(longData);
        });
        it('should successfully read long, nested array of bytes when it is offset in the array', async () => {
            const prefixByteArrayBuffer = ethUtil.toBuffer('0xabcdef');
            const combinedByteArrayBuffer = Buffer.concat([prefixByteArrayBuffer, longTestBytesAsBuffer]);
            const combinedByteArray = ethUtil.bufferToHex(combinedByteArrayBuffer);
            const testUint256Offset = new BigNumber(prefixByteArrayBuffer.byteLength);
            const bytes = await libBytes.publicReadBytes.callAsync(combinedByteArray, testUint256Offset);
            return expect(bytes).to.be.equal(longData);
        });
        it('should fail if the byte array is too short to hold the length of a nested byte array', async () => {
            // The length of the nested array is 32 bytes. By storing less than 32 bytes, a length cannot be read.
            const offset = new BigNumber(0);
            return expectRevertOrOtherErrorAsync(
                libBytes.publicReadBytes.callAsync(byteArrayShorterThan32Bytes, offset),
                constants.LIB_BYTES_GREATER_OR_EQUAL_TO_32_LENGTH_REQUIRED,
            );
        });
        it('should fail if we store a nested byte array length, without a nested byte array', async () => {
            const offset = new BigNumber(0);
            return expectRevertOrOtherErrorAsync(
                libBytes.publicReadBytes.callAsync(testBytes32, offset),
                constants.LIB_BYTES_GREATER_OR_EQUAL_TO_NESTED_BYTES_LENGTH_REQUIRED,
            );
        });
        it('should fail if the length between the offset and end of the byte array is too short to hold the length of a nested byte array', async () => {
            const badOffset = new BigNumber(ethUtil.toBuffer(byteArrayShorterThan32Bytes).byteLength);
            return expectRevertOrOtherErrorAsync(
                libBytes.publicReadBytes.callAsync(byteArrayShorterThan32Bytes, badOffset),
                constants.LIB_BYTES_GREATER_OR_EQUAL_TO_32_LENGTH_REQUIRED,
            );
        });
        it('should fail if the length between the offset and end of the byte array is too short to hold the nested byte array', async () => {
            const badOffset = new BigNumber(ethUtil.toBuffer(testBytes32).byteLength);
            return expectRevertOrOtherErrorAsync(
                libBytes.publicReadBytes.callAsync(testBytes32, badOffset),
                constants.LIB_BYTES_GREATER_OR_EQUAL_TO_32_LENGTH_REQUIRED,
            );
        });
    });

    describe('writeBytes', () => {
        it('should successfully write short, nested array of bytes when it takes up the whole array)', async () => {
            const testBytesOffset = new BigNumber(0);
            const emptyByteArray = ethUtil.bufferToHex(new Buffer(shortTestBytesAsBuffer.byteLength));
            const bytesWritten = await libBytes.publicWriteBytes.callAsync(emptyByteArray, testBytesOffset, shortData);
            const bytesRead = await libBytes.publicReadBytes.callAsync(bytesWritten, testBytesOffset);
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
            let bytesWritten = await libBytes.publicWriteBytes.callAsync(emptyByteArray, prefixOffset, prefixData);
            // Write data after prefix
            const testBytesOffset = new BigNumber(prefixDataAsBuffer.byteLength);
            bytesWritten = await libBytes.publicWriteBytes.callAsync(bytesWritten, testBytesOffset, shortData);
            // Read data after prefix and validate
            const bytes = await libBytes.publicReadBytes.callAsync(bytesWritten, testBytesOffset);
            return expect(bytes).to.be.equal(shortData);
        });
        it('should successfully write a nested array of bytes - one word in length - when it takes up the whole array', async () => {
            const testBytesOffset = new BigNumber(0);
            const emptyByteArray = ethUtil.bufferToHex(new Buffer(wordOfTestBytesAsBuffer.byteLength));
            const bytesWritten = await libBytes.publicWriteBytes.callAsync(emptyByteArray, testBytesOffset, wordOfData);
            const bytesRead = await libBytes.publicReadBytes.callAsync(bytesWritten, testBytesOffset);
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
            let bytesWritten = await libBytes.publicWriteBytes.callAsync(emptyByteArray, prefixOffset, prefixData);
            // Write data after prefix
            const testBytesOffset = new BigNumber(prefixDataAsBuffer.byteLength);
            bytesWritten = await libBytes.publicWriteBytes.callAsync(bytesWritten, testBytesOffset, wordOfData);
            // Read data after prefix and validate
            const bytes = await libBytes.publicReadBytes.callAsync(bytesWritten, testBytesOffset);
            return expect(bytes).to.be.equal(wordOfData);
        });
        it('should successfully write a long, nested bytes when it takes up the whole array', async () => {
            const testBytesOffset = new BigNumber(0);
            const emptyByteArray = ethUtil.bufferToHex(new Buffer(longTestBytesAsBuffer.byteLength));
            const bytesWritten = await libBytes.publicWriteBytes.callAsync(emptyByteArray, testBytesOffset, longData);
            const bytesRead = await libBytes.publicReadBytes.callAsync(bytesWritten, testBytesOffset);
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
            let bytesWritten = await libBytes.publicWriteBytes.callAsync(emptyByteArray, prefixOffset, prefixData);
            // Write data after prefix
            const testBytesOffset = new BigNumber(prefixDataAsBuffer.byteLength);
            bytesWritten = await libBytes.publicWriteBytes.callAsync(bytesWritten, testBytesOffset, longData);
            // Read data after prefix and validate
            const bytes = await libBytes.publicReadBytes.callAsync(bytesWritten, testBytesOffset);
            return expect(bytes).to.be.equal(longData);
        });
        it('should fail if the byte array is too short to hold the length of a nested byte array', async () => {
            const offset = new BigNumber(0);
            const emptyByteArray = ethUtil.bufferToHex(new Buffer(1));
            return expectRevertOrOtherErrorAsync(
                libBytes.publicWriteBytes.callAsync(emptyByteArray, offset, longData),
                constants.LIB_BYTES_GREATER_OR_EQUAL_TO_NESTED_BYTES_LENGTH_REQUIRED,
            );
        });
        it('should fail if the length between the offset and end of the byte array is too short to hold the length of a nested byte array)', async () => {
            const emptyByteArray = ethUtil.bufferToHex(new Buffer(shortTestBytesAsBuffer.byteLength));
            const badOffset = new BigNumber(ethUtil.toBuffer(shortTestBytesAsBuffer).byteLength);
            return expectRevertOrOtherErrorAsync(
                libBytes.publicWriteBytes.callAsync(emptyByteArray, badOffset, shortData),
                constants.LIB_BYTES_GREATER_OR_EQUAL_TO_NESTED_BYTES_LENGTH_REQUIRED,
            );
        });
    });
});
// tslint:disable:max-file-line-count
