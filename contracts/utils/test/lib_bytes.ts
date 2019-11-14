import { blockchainTests, constants, expect } from '@0x/contracts-test-utils';
import { BigNumber, LibBytesRevertErrors } from '@0x/utils';
import BN = require('bn.js');
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { artifacts } from './artifacts';
import { TestLibBytesContract } from './wrappers';

// BUG: Ideally we would use fromHex(memory).toString('hex')
// https://github.com/Microsoft/TypeScript/issues/23155
const toHex = (buf: Uint8Array): string => buf.reduce((a, v) => a + `00${v.toString(16)}`.slice(-2), '0x');

const fromHex = (str: string): Uint8Array => Uint8Array.from(Buffer.from(str.slice(2), 'hex'));

blockchainTests('LibBytes', env => {
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

    before(async () => {
        // Setup accounts & addresses
        const accounts = await env.getAccountAddressesAsync();
        testAddress = accounts[1];
        testAddressB = accounts[2];
        // Deploy LibBytes
        libBytes = await TestLibBytesContract.deployFrom0xArtifactAsync(
            artifacts.TestLibBytes,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        // Verify lengths of test data
        const byteArrayShorterThan32BytesLength = ethUtil.toBuffer(byteArrayShorterThan32Bytes).byteLength;
        expect(byteArrayShorterThan32BytesLength).to.be.lessThan(32);
        const byteArrayLongerThan32BytesLength = ethUtil.toBuffer(byteArrayLongerThan32Bytes).byteLength;
        expect(byteArrayLongerThan32BytesLength).to.be.greaterThan(32);
        const testBytes32Length = ethUtil.toBuffer(testBytes32).byteLength;
        expect(testBytes32Length).to.be.equal(32);
    });

    describe('popLastByte', () => {
        it('should revert if length is 0', async () => {
            const expectedError = new LibBytesRevertErrors.InvalidByteOperationError(
                LibBytesRevertErrors.InvalidByteOperationErrorCodes.LengthGreaterThanZeroRequired,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
            return expect(libBytes.publicPopLastByte(constants.NULL_BYTES).callAsync()).to.revertWith(expectedError);
        });
        it('should pop the last byte from the input and return it when array holds more than 1 byte', async () => {
            const [newBytes, poppedByte] = await libBytes.publicPopLastByte(byteArrayLongerThan32Bytes).callAsync();
            const expectedNewBytes = byteArrayLongerThan32Bytes.slice(0, -2);
            const expectedPoppedByte = `0x${byteArrayLongerThan32Bytes.slice(-2)}`;
            expect(newBytes).to.equal(expectedNewBytes);
            expect(poppedByte).to.equal(expectedPoppedByte);
        });
        it('should pop the last byte from the input and return it when array is exactly 1 byte', async () => {
            const [newBytes, poppedByte] = await libBytes.publicPopLastByte(testByte).callAsync();
            const expectedNewBytes = '0x';
            expect(newBytes).to.equal(expectedNewBytes);
            return expect(poppedByte).to.be.equal(testByte);
        });
    });

    describe('equals', () => {
        it('should return true if byte arrays are equal (both arrays < 32 bytes)', async () => {
            const isEqual = await libBytes
                .publicEquals(byteArrayShorterThan32Bytes, byteArrayShorterThan32Bytes)
                .callAsync();
            return expect(isEqual).to.be.true();
        });
        it('should return true if byte arrays are equal (both arrays > 32 bytes)', async () => {
            const isEqual = await libBytes
                .publicEquals(byteArrayLongerThan32Bytes, byteArrayLongerThan32Bytes)
                .callAsync();
            return expect(isEqual).to.be.true();
        });
        it('should return false if byte arrays are not equal (first array < 32 bytes, second array > 32 bytes)', async () => {
            const isEqual = await libBytes
                .publicEquals(byteArrayShorterThan32Bytes, byteArrayLongerThan32Bytes)
                .callAsync();
            return expect(isEqual).to.be.false();
        });
        it('should return false if byte arrays are not equal (first array > 32 bytes, second array < 32 bytes)', async () => {
            const isEqual = await libBytes
                .publicEquals(byteArrayLongerThan32Bytes, byteArrayShorterThan32Bytes)
                .callAsync();
            return expect(isEqual).to.be.false();
        });
        it('should return false if byte arrays are not equal (same length, but a byte in first word differs)', async () => {
            const isEqual = await libBytes
                .publicEquals(byteArrayLongerThan32BytesFirstBytesSwapped, byteArrayLongerThan32Bytes)
                .callAsync();
            return expect(isEqual).to.be.false();
        });
        it('should return false if byte arrays are not equal (same length, but a byte in last word differs)', async () => {
            const isEqual = await libBytes
                .publicEquals(byteArrayLongerThan32BytesLastBytesSwapped, byteArrayLongerThan32Bytes)
                .callAsync();
            return expect(isEqual).to.be.false();
        });

        describe('should ignore trailing data', () => {
            it('should return true when both < 32 bytes', async () => {
                const isEqual = await libBytes.publicEqualsPop1('0x0102', '0x0103').callAsync();
                return expect(isEqual).to.be.true();
            });
        });
    });

    describe('readAddress', () => {
        it('should successfully read address when the address takes up the whole array', async () => {
            const byteArray = ethUtil.addHexPrefix(testAddress);
            const testAddressOffset = new BigNumber(0);
            const address = await libBytes.publicReadAddress(byteArray, testAddressOffset).callAsync();
            return expect(address).to.be.equal(testAddress);
        });
        it('should successfully read address when it is offset in the array', async () => {
            const addressByteArrayBuffer = ethUtil.toBuffer(testAddress);
            const prefixByteArrayBuffer = ethUtil.toBuffer('0xabcdef');
            const combinedByteArrayBuffer = Buffer.concat([prefixByteArrayBuffer, addressByteArrayBuffer]);
            const combinedByteArray = ethUtil.bufferToHex(combinedByteArrayBuffer);
            const testAddressOffset = new BigNumber(prefixByteArrayBuffer.byteLength);
            const address = await libBytes.publicReadAddress(combinedByteArray, testAddressOffset).callAsync();
            return expect(address).to.be.equal(testAddress);
        });
        it('should fail if the byte array is too short to hold an address', async () => {
            const shortByteArray = '0xabcdef';
            const offset = new BigNumber(0);
            const expectedError = new LibBytesRevertErrors.InvalidByteOperationError(
                LibBytesRevertErrors.InvalidByteOperationErrorCodes.LengthGreaterThanOrEqualsTwentyRequired,
                new BigNumber(3),
                new BigNumber(20),
            );
            return expect(libBytes.publicReadAddress(shortByteArray, offset).callAsync()).to.revertWith(expectedError);
        });
        it('should fail if the length between the offset and end of the byte array is too short to hold an address', async () => {
            const byteArray = testAddress;
            const badOffset = new BigNumber(ethUtil.toBuffer(byteArray).byteLength);
            const expectedError = new LibBytesRevertErrors.InvalidByteOperationError(
                LibBytesRevertErrors.InvalidByteOperationErrorCodes.LengthGreaterThanOrEqualsTwentyRequired,
                new BigNumber(20),
                new BigNumber(40),
            );
            return expect(libBytes.publicReadAddress(byteArray, badOffset).callAsync()).to.revertWith(expectedError);
        });
    });

    describe('writeAddress', () => {
        it('should successfully write address when the address takes up the whole array', async () => {
            const byteArray = testAddress;
            const testAddressOffset = new BigNumber(0);
            const newByteArray = await libBytes
                .publicWriteAddress(byteArray, testAddressOffset, testAddressB)
                .callAsync();
            return expect(newByteArray).to.be.equal(testAddressB);
        });
        it('should successfully write address when it is offset in the array', async () => {
            const addressByteArrayBuffer = ethUtil.toBuffer(testAddress);
            const prefixByteArrayBuffer = ethUtil.toBuffer('0xabcdef');
            const combinedByteArrayBuffer = Buffer.concat([prefixByteArrayBuffer, addressByteArrayBuffer]);
            const combinedByteArray = ethUtil.bufferToHex(combinedByteArrayBuffer);
            const testAddressOffset = new BigNumber(prefixByteArrayBuffer.byteLength);
            const newByteArray = await libBytes
                .publicWriteAddress(combinedByteArray, testAddressOffset, testAddressB)
                .callAsync();
            const newByteArrayBuffer = ethUtil.toBuffer(newByteArray);
            const addressFromOffsetBuffer = newByteArrayBuffer.slice(prefixByteArrayBuffer.byteLength);
            const addressFromOffset = ethUtil.addHexPrefix(ethUtil.bufferToHex(addressFromOffsetBuffer));
            return expect(addressFromOffset).to.be.equal(testAddressB);
        });
        it('should fail if the byte array is too short to hold an address', async () => {
            const offset = new BigNumber(0);
            const byteLen = ethUtil.toBuffer(byteArrayShorterThan20Bytes).byteLength;
            const expectedError = new LibBytesRevertErrors.InvalidByteOperationError(
                LibBytesRevertErrors.InvalidByteOperationErrorCodes.LengthGreaterThanOrEqualsTwentyRequired,
                new BigNumber(byteLen),
                new BigNumber(20),
            );
            return expect(
                libBytes.publicWriteAddress(byteArrayShorterThan20Bytes, offset, testAddress).callAsync(),
            ).to.revertWith(expectedError);
        });
        it('should fail if the length between the offset and end of the byte array is too short to hold an address', async () => {
            const byteArray = byteArrayLongerThan32Bytes;
            const badOffset = new BigNumber(ethUtil.toBuffer(byteArray).byteLength);
            const expectedError = new LibBytesRevertErrors.InvalidByteOperationError(
                LibBytesRevertErrors.InvalidByteOperationErrorCodes.LengthGreaterThanOrEqualsTwentyRequired,
                badOffset,
                badOffset.plus(new BigNumber(20)),
            );
            return expect(libBytes.publicWriteAddress(byteArray, badOffset, testAddress).callAsync()).to.revertWith(
                expectedError,
            );
        });
    });

    describe('readBytes32', () => {
        it('should successfully read bytes32 when the bytes32 takes up the whole array', async () => {
            const testBytes32Offset = new BigNumber(0);
            const bytes32 = await libBytes.publicReadBytes32(testBytes32, testBytes32Offset).callAsync();
            return expect(bytes32).to.be.equal(testBytes32);
        });
        it('should successfully read bytes32 when it is offset in the array', async () => {
            const bytes32ByteArrayBuffer = ethUtil.toBuffer(testBytes32);
            const prefixByteArrayBuffer = ethUtil.toBuffer('0xabcdef');
            const combinedByteArrayBuffer = Buffer.concat([prefixByteArrayBuffer, bytes32ByteArrayBuffer]);
            const combinedByteArray = ethUtil.bufferToHex(combinedByteArrayBuffer);
            const testBytes32Offset = new BigNumber(prefixByteArrayBuffer.byteLength);
            const bytes32 = await libBytes.publicReadBytes32(combinedByteArray, testBytes32Offset).callAsync();
            return expect(bytes32).to.be.equal(testBytes32);
        });
        it('should fail if the byte array is too short to hold a bytes32', async () => {
            const offset = new BigNumber(0);
            const byteLen = new BigNumber(fromHex(byteArrayShorterThan32Bytes).length);
            const expectedError = new LibBytesRevertErrors.InvalidByteOperationError(
                LibBytesRevertErrors.InvalidByteOperationErrorCodes.LengthGreaterThanOrEqualsThirtyTwoRequired,
                byteLen,
                new BigNumber(32),
            );
            return expect(libBytes.publicReadBytes32(byteArrayShorterThan32Bytes, offset).callAsync()).to.revertWith(
                expectedError,
            );
        });
        it('should fail if the length between the offset and end of the byte array is too short to hold a bytes32', async () => {
            const badOffset = new BigNumber(ethUtil.toBuffer(testBytes32).byteLength);
            const expectedError = new LibBytesRevertErrors.InvalidByteOperationError(
                LibBytesRevertErrors.InvalidByteOperationErrorCodes.LengthGreaterThanOrEqualsThirtyTwoRequired,
                badOffset,
                badOffset.plus(new BigNumber(32)),
            );
            return expect(libBytes.publicReadBytes32(testBytes32, badOffset).callAsync()).to.revertWith(expectedError);
        });
    });

    describe('writeBytes32', () => {
        it('should successfully write bytes32 when the address takes up the whole array', async () => {
            const byteArray = testBytes32;
            const testBytes32Offset = new BigNumber(0);
            const newByteArray = await libBytes
                .publicWriteBytes32(byteArray, testBytes32Offset, testBytes32B)
                .callAsync();
            return expect(newByteArray).to.be.equal(testBytes32B);
        });
        it('should successfully write bytes32 when it is offset in the array', async () => {
            const bytes32ByteArrayBuffer = ethUtil.toBuffer(testBytes32);
            const prefixByteArrayBuffer = ethUtil.toBuffer('0xabcdef');
            const combinedByteArrayBuffer = Buffer.concat([prefixByteArrayBuffer, bytes32ByteArrayBuffer]);
            const combinedByteArray = ethUtil.bufferToHex(combinedByteArrayBuffer);
            const testBytes32Offset = new BigNumber(prefixByteArrayBuffer.byteLength);
            const newByteArray = await libBytes
                .publicWriteBytes32(combinedByteArray, testBytes32Offset, testBytes32B)
                .callAsync();
            const newByteArrayBuffer = ethUtil.toBuffer(newByteArray);
            const bytes32FromOffsetBuffer = newByteArrayBuffer.slice(prefixByteArrayBuffer.byteLength);
            const bytes32FromOffset = ethUtil.addHexPrefix(ethUtil.bufferToHex(bytes32FromOffsetBuffer));
            return expect(bytes32FromOffset).to.be.equal(testBytes32B);
        });
        it('should fail if the byte array is too short to hold a bytes32', async () => {
            const offset = new BigNumber(0);
            const byteLen = new BigNumber(fromHex(byteArrayShorterThan32Bytes).length);
            const expectedError = new LibBytesRevertErrors.InvalidByteOperationError(
                LibBytesRevertErrors.InvalidByteOperationErrorCodes.LengthGreaterThanOrEqualsThirtyTwoRequired,
                byteLen,
                new BigNumber(32),
            );
            return expect(
                libBytes.publicWriteBytes32(byteArrayShorterThan32Bytes, offset, testBytes32).callAsync(),
            ).to.revertWith(expectedError);
        });
        it('should fail if the length between the offset and end of the byte array is too short to hold a bytes32', async () => {
            const byteArray = byteArrayLongerThan32Bytes;
            const badOffset = new BigNumber(ethUtil.toBuffer(byteArray).byteLength);
            const expectedError = new LibBytesRevertErrors.InvalidByteOperationError(
                LibBytesRevertErrors.InvalidByteOperationErrorCodes.LengthGreaterThanOrEqualsThirtyTwoRequired,
                badOffset,
                badOffset.plus(new BigNumber(32)),
            );
            return expect(libBytes.publicWriteBytes32(byteArray, badOffset, testBytes32).callAsync()).to.revertWith(
                expectedError,
            );
        });
    });

    describe('readUint256', () => {
        it('should successfully read uint256 when the uint256 takes up the whole array', async () => {
            const formattedTestUint256 = new BN(testUint256.toString(10));
            const testUint256AsBuffer = ethUtil.toBuffer(formattedTestUint256);
            const byteArray = ethUtil.bufferToHex(testUint256AsBuffer);
            const testUint256Offset = new BigNumber(0);
            const uint256 = await libBytes.publicReadUint256(byteArray, testUint256Offset).callAsync();
            return expect(uint256).to.bignumber.equal(testUint256);
        });
        it('should successfully read uint256 when it is offset in the array', async () => {
            const prefixByteArrayBuffer = ethUtil.toBuffer('0xabcdef');
            const formattedTestUint256 = new BN(testUint256.toString(10));
            const testUint256AsBuffer = ethUtil.toBuffer(formattedTestUint256);
            const combinedByteArrayBuffer = Buffer.concat([prefixByteArrayBuffer, testUint256AsBuffer]);
            const combinedByteArray = ethUtil.bufferToHex(combinedByteArrayBuffer);
            const testUint256Offset = new BigNumber(prefixByteArrayBuffer.byteLength);
            const uint256 = await libBytes.publicReadUint256(combinedByteArray, testUint256Offset).callAsync();
            return expect(uint256).to.bignumber.equal(testUint256);
        });
        it('should fail if the byte array is too short to hold a uint256', async () => {
            const offset = new BigNumber(0);
            const byteLen = new BigNumber(fromHex(byteArrayShorterThan32Bytes).length);
            const expectedError = new LibBytesRevertErrors.InvalidByteOperationError(
                LibBytesRevertErrors.InvalidByteOperationErrorCodes.LengthGreaterThanOrEqualsThirtyTwoRequired,
                byteLen,
                new BigNumber(32),
            );
            return expect(libBytes.publicReadUint256(byteArrayShorterThan32Bytes, offset).callAsync()).to.revertWith(
                expectedError,
            );
        });
        it('should fail if the length between the offset and end of the byte array is too short to hold a uint256', async () => {
            const formattedTestUint256 = new BN(testUint256.toString(10));
            const testUint256AsBuffer = ethUtil.toBuffer(formattedTestUint256);
            const byteArray = ethUtil.bufferToHex(testUint256AsBuffer);
            const badOffset = new BigNumber(testUint256AsBuffer.byteLength);
            const expectedError = new LibBytesRevertErrors.InvalidByteOperationError(
                LibBytesRevertErrors.InvalidByteOperationErrorCodes.LengthGreaterThanOrEqualsThirtyTwoRequired,
                badOffset,
                badOffset.plus(new BigNumber(32)),
            );
            return expect(libBytes.publicReadUint256(byteArray, badOffset).callAsync()).to.revertWith(expectedError);
        });
    });

    describe('writeUint256', () => {
        it('should successfully write uint256 when the address takes up the whole array', async () => {
            const byteArray = testBytes32;
            const testUint256Offset = new BigNumber(0);
            const newByteArray = await libBytes
                .publicWriteUint256(byteArray, testUint256Offset, testUint256B)
                .callAsync();
            const newByteArrayAsUint256 = new BigNumber(newByteArray, 16);
            return expect(newByteArrayAsUint256).to.be.bignumber.equal(testUint256B);
        });
        it('should successfully write uint256 when it is offset in the array', async () => {
            const bytes32ByteArrayBuffer = ethUtil.toBuffer(testBytes32);
            const prefixByteArrayBuffer = ethUtil.toBuffer('0xabcdef');
            const combinedByteArrayBuffer = Buffer.concat([prefixByteArrayBuffer, bytes32ByteArrayBuffer]);
            const combinedByteArray = ethUtil.bufferToHex(combinedByteArrayBuffer);
            const testUint256Offset = new BigNumber(prefixByteArrayBuffer.byteLength);
            const newByteArray = await libBytes
                .publicWriteUint256(combinedByteArray, testUint256Offset, testUint256B)
                .callAsync();
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
            const byteLen = new BigNumber(fromHex(byteArrayShorterThan32Bytes).length);
            const expectedError = new LibBytesRevertErrors.InvalidByteOperationError(
                LibBytesRevertErrors.InvalidByteOperationErrorCodes.LengthGreaterThanOrEqualsThirtyTwoRequired,
                byteLen,
                new BigNumber(32),
            );
            return expect(
                libBytes.publicWriteUint256(byteArrayShorterThan32Bytes, offset, testUint256).callAsync(),
            ).to.revertWith(expectedError);
        });
        it('should fail if the length between the offset and end of the byte array is too short to hold a uint256', async () => {
            const byteArray = byteArrayLongerThan32Bytes;
            const badOffset = new BigNumber(ethUtil.toBuffer(byteArray).byteLength);
            const expectedError = new LibBytesRevertErrors.InvalidByteOperationError(
                LibBytesRevertErrors.InvalidByteOperationErrorCodes.LengthGreaterThanOrEqualsThirtyTwoRequired,
                badOffset,
                badOffset.plus(new BigNumber(32)),
            );
            return expect(libBytes.publicWriteUint256(byteArray, badOffset, testUint256).callAsync()).to.revertWith(
                expectedError,
            );
        });
    });

    describe('readBytes4', () => {
        // AssertionError: expected promise to be rejected with an error including 'revert' but it was fulfilled with '0x08c379a0'
        it('should revert if byte array has a length < 4', async () => {
            const byteArrayLessThan4Bytes = '0x010101';
            const byteLen = fromHex(byteArrayLessThan4Bytes).length;
            const offset = new BigNumber(0);
            const expectedError = new LibBytesRevertErrors.InvalidByteOperationError(
                LibBytesRevertErrors.InvalidByteOperationErrorCodes.LengthGreaterThanOrEqualsFourRequired,
                new BigNumber(byteLen), // length of byteArrayLessThan4Bytes
                new BigNumber(4),
            );
            return expect(libBytes.publicReadBytes4(byteArrayLessThan4Bytes, offset).callAsync()).to.revertWith(
                expectedError,
            );
        });
        it('should return the first 4 bytes of a byte array of arbitrary length', async () => {
            const first4Bytes = await libBytes
                .publicReadBytes4(byteArrayLongerThan32Bytes, new BigNumber(0))
                .callAsync();
            const expectedFirst4Bytes = byteArrayLongerThan32Bytes.slice(0, 10);
            expect(first4Bytes).to.equal(expectedFirst4Bytes);
        });
        it('should successfully read bytes4 when the bytes4 takes up the whole array', async () => {
            const testBytes4Offset = new BigNumber(0);
            const bytes4 = await libBytes.publicReadBytes4(testBytes4, testBytes4Offset).callAsync();
            return expect(bytes4).to.be.equal(testBytes4);
        });
        it('should successfully read bytes4 when it is offset in the array', async () => {
            const bytes4ByteArrayBuffer = ethUtil.toBuffer(testBytes4);
            const prefixByteArrayBuffer = ethUtil.toBuffer('0xabcdef');
            const combinedByteArrayBuffer = Buffer.concat([prefixByteArrayBuffer, bytes4ByteArrayBuffer]);
            const combinedByteArray = ethUtil.bufferToHex(combinedByteArrayBuffer);
            const testBytes4Offset = new BigNumber(prefixByteArrayBuffer.byteLength);
            const bytes4 = await libBytes.publicReadBytes4(combinedByteArray, testBytes4Offset).callAsync();
            return expect(bytes4).to.be.equal(testBytes4);
        });
        it('should fail if the length between the offset and end of the byte array is too short to hold a bytes4', async () => {
            const badOffset = new BigNumber(ethUtil.toBuffer(testBytes4).byteLength);
            const byteLen = new BigNumber(fromHex(testBytes4).length);
            const expectedError = new LibBytesRevertErrors.InvalidByteOperationError(
                LibBytesRevertErrors.InvalidByteOperationErrorCodes.LengthGreaterThanOrEqualsFourRequired,
                byteLen,
                badOffset.plus(new BigNumber(4)),
            );
            return expect(libBytes.publicReadBytes4(testBytes4, badOffset).callAsync()).to.revertWith(expectedError);
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
                    const resultStr = await libBytes
                        .testMemcpy(memHex, new BigNumber(dest), new BigNumber(source), new BigNumber(length))
                        .callAsync();
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

    describe('slice', () => {
        it('should revert if from > to', async () => {
            const from = new BigNumber(1);
            const to = new BigNumber(0);
            const expectedError = new LibBytesRevertErrors.InvalidByteOperationError(
                LibBytesRevertErrors.InvalidByteOperationErrorCodes.FromLessThanOrEqualsToRequired,
                from,
                to,
            );
            return expect(libBytes.publicSlice(byteArrayLongerThan32Bytes, from, to).callAsync()).to.revertWith(
                expectedError,
            );
        });
        it('should return a byte array of length 0 if from == to', async () => {
            const from = new BigNumber(0);
            const to = from;
            const [result, original] = await libBytes.publicSlice(byteArrayLongerThan32Bytes, from, to).callAsync();
            expect(original).to.eq(byteArrayLongerThan32Bytes);
            expect(result).to.eq(constants.NULL_BYTES);
        });
        it('should return a byte array of length 0 if from == to == b.length', async () => {
            const byteLen = fromHex(byteArrayLongerThan32Bytes).length;
            const from = new BigNumber(byteLen);
            const to = from;
            const [result, original] = await libBytes.publicSlice(byteArrayLongerThan32Bytes, from, to).callAsync();
            expect(original).to.eq(byteArrayLongerThan32Bytes);
            expect(result).to.eq(constants.NULL_BYTES);
        });
        it('should revert if to > input.length', async () => {
            const byteLen: number = (byteArrayLongerThan32Bytes.length - 2) / 2;
            const from = new BigNumber(0);
            const to = new BigNumber(byteLen).plus(1);
            const expectedError = new LibBytesRevertErrors.InvalidByteOperationError(
                LibBytesRevertErrors.InvalidByteOperationErrorCodes.ToLessThanOrEqualsLengthRequired,
                to,
                new BigNumber(byteLen),
            );
            return expect(libBytes.publicSlice(byteArrayLongerThan32Bytes, from, to).callAsync()).to.revertWith(
                expectedError,
            );
        });
        it('should slice a section of the input', async () => {
            const from = new BigNumber(1);
            const to = new BigNumber(2);
            const [result, original] = await libBytes.publicSlice(byteArrayLongerThan32Bytes, from, to).callAsync();
            const expectedResult = `0x${byteArrayLongerThan32Bytes.slice(4, 6)}`;
            expect(original).to.eq(byteArrayLongerThan32Bytes);
            expect(result).to.eq(expectedResult);
        });
        it('should copy the entire input if from = 0 and to = input.length', async () => {
            const byteLen = fromHex(byteArrayLongerThan32Bytes).length;
            const from = new BigNumber(0);
            const to = new BigNumber(byteLen);
            const [result, original] = await libBytes.publicSlice(byteArrayLongerThan32Bytes, from, to).callAsync();
            expect(original).to.eq(byteArrayLongerThan32Bytes);
            expect(result).to.eq(byteArrayLongerThan32Bytes);
        });
    });

    describe('sliceDestructive', () => {
        it('should revert if from > to', async () => {
            const from = new BigNumber(1);
            const to = new BigNumber(0);
            const expectedError = new LibBytesRevertErrors.InvalidByteOperationError(
                LibBytesRevertErrors.InvalidByteOperationErrorCodes.FromLessThanOrEqualsToRequired,
                from,
                to,
            );
            return expect(libBytes.publicSlice(byteArrayLongerThan32Bytes, from, to).callAsync()).to.revertWith(
                expectedError,
            );
        });
        it('should return a byte array of length 0 if from == to', async () => {
            const from = new BigNumber(0);
            const to = from;
            const [result] = await libBytes.publicSliceDestructive(byteArrayLongerThan32Bytes, from, to).callAsync();
            expect(result).to.eq(constants.NULL_BYTES);
        });
        it('should return a byte array of length 0 if from == to == b.length', async () => {
            const byteLen = fromHex(byteArrayLongerThan32Bytes).length;
            const from = new BigNumber(byteLen);
            const to = from;
            const [result] = await libBytes.publicSliceDestructive(byteArrayLongerThan32Bytes, from, to).callAsync();
            expect(result).to.eq(constants.NULL_BYTES);
        });
        it('should revert if to > input.length', async () => {
            const byteLen = fromHex(byteArrayLongerThan32Bytes).length;
            const from = new BigNumber(0);
            const to = new BigNumber(byteLen).plus(1);
            const expectedError = new LibBytesRevertErrors.InvalidByteOperationError(
                LibBytesRevertErrors.InvalidByteOperationErrorCodes.ToLessThanOrEqualsLengthRequired,
                to,
                new BigNumber(byteLen),
            );
            return expect(
                libBytes.publicSliceDestructive(byteArrayLongerThan32Bytes, from, to).callAsync(),
            ).to.revertWith(expectedError);
        });
        it('should slice a section of the input', async () => {
            const from = new BigNumber(1);
            const to = new BigNumber(2);
            const [result] = await libBytes.publicSliceDestructive(byteArrayLongerThan32Bytes, from, to).callAsync();
            const expectedResult = `0x${byteArrayLongerThan32Bytes.slice(4, 6)}`;
            expect(result).to.eq(expectedResult);
        });
        it('should copy the entire input if from = 0 and to = input.length', async () => {
            const byteLen = fromHex(byteArrayLongerThan32Bytes).length;
            const from = new BigNumber(0);
            const to = new BigNumber(byteLen);
            const [result] = await libBytes.publicSliceDestructive(byteArrayLongerThan32Bytes, from, to).callAsync();
            expect(result).to.eq(byteArrayLongerThan32Bytes);
        });
    });

    describe('writeLength', () => {
        it('should return a null byte array if length is set to 0', async () => {
            const result = await libBytes
                .publicWriteLength(byteArrayLongerThan32Bytes, constants.ZERO_AMOUNT, constants.NULL_BYTES)
                .callAsync();
            expect(result).to.eq(constants.NULL_BYTES);
        });
        it('should return the same byte array if length is unchanged', async () => {
            const byteLen = fromHex(byteArrayLongerThan32Bytes).length;
            const result = await libBytes
                .publicWriteLength(byteArrayLongerThan32Bytes, new BigNumber(byteLen), constants.NULL_BYTES)
                .callAsync();
            expect(result).to.eq(byteArrayLongerThan32Bytes);
        });
        it('should shave off lower order bytes if new length is less than original', async () => {
            const byteLen = fromHex(byteArrayLongerThan32Bytes).length;
            const newLen = new BigNumber(byteLen).dividedToIntegerBy(2);
            const result = await libBytes
                .publicWriteLength(byteArrayLongerThan32Bytes, newLen, constants.NULL_BYTES)
                .callAsync();
            expect(result).to.eq(
                byteArrayLongerThan32Bytes.slice(
                    0,
                    newLen
                        .multipliedBy(2)
                        .plus(2)
                        .toNumber(),
                ),
            );
        });
        it("should right pad with 0's if new length is greater than original and no extra bytes are appended", async () => {
            const byteLen = fromHex(byteArrayLongerThan32Bytes).length;
            const newLen = new BigNumber(byteLen).multipliedBy(2);
            const result = await libBytes
                .publicWriteLength(byteArrayLongerThan32Bytes, newLen, constants.NULL_BYTES)
                .callAsync();
            expect(result).to.eq(`${byteArrayLongerThan32Bytes}${'0'.repeat(byteArrayLongerThan32Bytes.length - 2)}`);
        });
        it('should right pad with extra bytes if specified', async () => {
            const byteLen = fromHex(byteArrayLongerThan32Bytes).length;
            const newLen = new BigNumber(byteLen).multipliedBy(2);
            const result = await libBytes
                .publicWriteLength(byteArrayLongerThan32Bytes, newLen, byteArrayLongerThan32Bytes)
                .callAsync();
            expect(result).to.eq(`${byteArrayLongerThan32Bytes}${byteArrayLongerThan32Bytes.slice(2)}`);
        });
        it('should result in the same byte array if length is reduced and reset', async () => {
            const byteLen = fromHex(byteArrayLongerThan32Bytes).length;
            const tempByteLen = new BigNumber(byteLen).dividedToIntegerBy(2);
            return expect(
                libBytes.assertBytesUnchangedAfterLengthReset(byteArrayLongerThan32Bytes, tempByteLen).callAsync(),
            ).to.be.fulfilled('');
        });
        it('should result in the same byte array if length is increased and reset', async () => {
            const byteLen = fromHex(byteArrayLongerThan32Bytes).length;
            const tempByteLen = new BigNumber(byteLen).multipliedBy(2);
            return expect(
                libBytes.assertBytesUnchangedAfterLengthReset(byteArrayLongerThan32Bytes, tempByteLen).callAsync(),
            ).to.be.fulfilled('');
        });
    });
});
// tslint:disable:max-file-line-count
