/* tslint:disable max-file-line-count */
import * as chai from 'chai';
import * as ethUtil from 'ethereumjs-util';
import 'mocha';

import { AbiEncoder, BigNumber } from '../../src/';
import { chaiSetup } from '../utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

describe('ABI Encoder: EVM Data Type Encoding/Decoding', () => {
    describe('Array', () => {
        it('Fixed size; Static elements', async () => {
            // Create DataType object
            const testDataItem = { name: 'testArray', type: 'int[2]' };
            const dataType = new AbiEncoder.Array(testDataItem);
            // Construct args to be encoded
            const args = [new BigNumber(5), new BigNumber(6)];
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs =
                '0x00000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000006';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('Dynamic size; Static elements', async () => {
            // Create DataType object
            const testDataItem = { name: 'testArray', type: 'int[]' };
            const dataType = new AbiEncoder.Array(testDataItem);
            // Construct args to be encoded
            const args = [new BigNumber(5), new BigNumber(6)];
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs =
                '0x000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000006';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('Fixed size; Dynamic elements', async () => {
            // Create DataType object
            const testDataItem = { name: 'testArray', type: 'string[2]' };
            const dataType = new AbiEncoder.Array(testDataItem);
            // Construct args to be encoded
            const args = ['Hello', 'world'];
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs =
                '0x00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000548656c6c6f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005776f726c64000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('Dynamic size; Dynamic elements', async () => {
            // Create DataType object
            const testDataItem = { name: 'testArray', type: 'string[]' };
            const dataType = new AbiEncoder.Array(testDataItem);
            // Construct args to be encoded
            const args = ['Hello', 'world'];
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs =
                '0x000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000548656c6c6f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005776f726c64000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('Dynamic Size; Multidimensional; Dynamic Elements', async () => {
            // Create DataType object
            const testDataItem = { name: 'testArray', type: 'bytes[][]' };
            const dataType = new AbiEncoder.Array(testDataItem);
            // Construct args to be encoded
            const array1 = ['0x01020304', '0x05060708', '0x09101112'];
            const array2 = ['0x10111213', '0x14151617'];
            const array3 = ['0x18192021'];
            const args = [array1, array2, array3];
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs =
                '0x0000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000001a000000000000000000000000000000000000000000000000000000000000002800000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000000040102030400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000405060708000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004091011120000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000041011121300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000414151617000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000041819202100000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('Dynamic Size; Multidimensional; Static Elements', async () => {
            // Create DataType object
            const testDataItem = { name: 'testArray', type: 'bytes4[][]' };
            const dataType = new AbiEncoder.Array(testDataItem);
            // Construct args to be encoded
            const array1 = ['0x01020304', '0x05060708', '0x09101112'];
            const array2 = ['0x10111213', '0x14151617'];
            const array3 = ['0x18192021'];
            const args = [array1, array2, array3];
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs =
                '0x0000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000000000301020304000000000000000000000000000000000000000000000000000000000506070800000000000000000000000000000000000000000000000000000000091011120000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000021011121300000000000000000000000000000000000000000000000000000000141516170000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011819202100000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('Static Size; Multidimensional; Static Elements', async () => {
            // Create DataType object
            const testDataItem = { name: 'testArray', type: 'bytes4[3][2]' };
            const dataType = new AbiEncoder.Array(testDataItem);
            // Construct args to be encoded
            const array1 = ['0x01020304', '0x05060708', '0x09101112'];
            const array2 = ['0x10111213', '0x14151617', '0x18192021'];
            const args = [array1, array2];
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs =
                '0x010203040000000000000000000000000000000000000000000000000000000005060708000000000000000000000000000000000000000000000000000000000910111200000000000000000000000000000000000000000000000000000000101112130000000000000000000000000000000000000000000000000000000014151617000000000000000000000000000000000000000000000000000000001819202100000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('Static Size; Multidimensional; Dynamic Elements', async () => {
            // Create DataType object
            const testDataItem = { name: 'testArray', type: 'bytes[3][2]' };
            const dataType = new AbiEncoder.Array(testDataItem);
            // Construct args to be encoded
            const array1 = ['0x01020304', '0x05060708', '0x09101112'];
            const array2 = ['0x10111213', '0x14151617', '0x18192021'];
            const args = [array1, array2];
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs =
                '0x00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000401020304000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004050607080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040910111200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000410111213000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004141516170000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041819202100000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('Static size; Too Few Elements', async () => {
            // Create DataType object
            const testDataItem = { name: 'testArray', type: 'string[3]' };
            const dataType = new AbiEncoder.Array(testDataItem);
            // Construct args to be encoded
            const args = ['Hello', 'world'];
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args);
            }).to.throw('Expected array of 3 elements, but got array of length 2');
        });
        it('Static size; Too Many Elements', async () => {
            // Create DataType object
            const testDataItem = { name: 'testArray', type: 'string[1]' };
            const dataType = new AbiEncoder.Array(testDataItem);
            // Construct args to be encoded
            const args = ['Hello', 'world'];
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args);
            }).to.throw('Expected array of 1 elements, but got array of length 2');
        });
        it('Element Type Mismatch', async () => {
            // Create DataType object
            const testDataItem = { name: 'testArray', type: 'uint[]' };
            const dataType = new AbiEncoder.Array(testDataItem);
            // Construct args to be encoded
            const args = [new BigNumber(1), 'Bad Argument'];
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args);
            }).to.throw();
        });
    });

    describe('Tuple', () => {
        it('Static elements only', async () => {
            // Create DataType object
            const testDataItem = {
                name: 'Tuple',
                type: 'tuple',
                components: [{ name: 'field_1', type: 'int32' }, { name: 'field_2', type: 'bool' }],
            };
            const dataType = new AbiEncoder.Tuple(testDataItem);
            // Construct args to be encoded
            const args = { field_1: new BigNumber(-5), field_2: true };
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs =
                '0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffb0000000000000000000000000000000000000000000000000000000000000001';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodingRules: AbiEncoder.DecodingRules = { structsAsObjects: true };
            const decodedArgs = dataType.decode(encodedArgs, decodingRules);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('Dynamic elements only', async () => {
            // Create DataType object
            const testDataItem = {
                name: 'Tuple',
                type: 'tuple',
                components: [{ name: 'field_1', type: 'string' }, { name: 'field_2', type: 'bytes' }],
            };
            const dataType = new AbiEncoder.Tuple(testDataItem);
            // Construct args to be encoded
            const args = { field_1: 'Hello, World!', field_2: '0xabcdef0123456789' };
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs =
                '0x00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000d48656c6c6f2c20576f726c6421000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008abcdef0123456789000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodingRules: AbiEncoder.DecodingRules = { structsAsObjects: true };
            const decodedArgs = dataType.decode(encodedArgs, decodingRules);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('Nested Static Array', async () => {
            // Create DataType object
            const testDataItem = {
                name: 'Tuple',
                type: 'tuple',
                components: [{ name: 'field', type: 'uint[2]' }],
            };
            const dataType = new AbiEncoder.Tuple(testDataItem);
            // Construct args to be encoded
            const args = { field: [new BigNumber(1), new BigNumber(2)] };
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs =
                '0x00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodingRules: AbiEncoder.DecodingRules = { structsAsObjects: true };
            const decodedArgs = dataType.decode(encodedArgs, decodingRules);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('Nested Dynamic Array', async () => {
            // Create DataType object
            const testDataItem = {
                name: 'Tuple',
                type: 'tuple',
                components: [{ name: 'field', type: 'uint[]' }],
            };
            const dataType = new AbiEncoder.Tuple(testDataItem);
            // Construct args to be encoded
            const args = { field: [new BigNumber(1), new BigNumber(2)] };
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs =
                '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodingRules: AbiEncoder.DecodingRules = { structsAsObjects: true };
            const decodedArgs = dataType.decode(encodedArgs, decodingRules);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('Nested Static Multidimensional Array', async () => {
            // Create DataType object
            const testDataItem = {
                name: 'Tuple',
                type: 'tuple',
                components: [{ name: 'field', type: 'bytes4[2][2]' }],
            };
            const dataType = new AbiEncoder.Tuple(testDataItem);
            // Construct args to be encoded
            const array1 = ['0x01020304', '0x05060708'];
            const array2 = ['0x09101112', '0x13141516'];
            const args = { field: [array1, array2] };
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs =
                '0x0102030400000000000000000000000000000000000000000000000000000000050607080000000000000000000000000000000000000000000000000000000009101112000000000000000000000000000000000000000000000000000000001314151600000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodingRules: AbiEncoder.DecodingRules = { structsAsObjects: true };
            const decodedArgs = dataType.decode(encodedArgs, decodingRules);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('Nested Dynamic Multidimensional Array', async () => {
            // Create DataType object
            const testDataItem = {
                name: 'Tuple',
                type: 'tuple',
                components: [{ name: 'field', type: 'bytes[2][2]' }],
            };
            const dataType = new AbiEncoder.Tuple(testDataItem);
            // Construct args to be encoded
            const array1 = ['0x01020304', '0x05060708'];
            const array2 = ['0x09101112', '0x13141516'];
            const args = { field: [array1, array2] };
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs =
                '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000004010203040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040506070800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000004091011120000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041314151600000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodingRules: AbiEncoder.DecodingRules = { structsAsObjects: true };
            const decodedArgs = dataType.decode(encodedArgs, decodingRules);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('Static and dynamic elements mixed', async () => {
            // Create DataType object
            const testDataItem = {
                name: 'Tuple',
                type: 'tuple',
                components: [
                    { name: 'field_1', type: 'int32' },
                    { name: 'field_2', type: 'string' },
                    { name: 'field_3', type: 'bool' },
                    { name: 'field_4', type: 'bytes' },
                ],
            };
            const dataType = new AbiEncoder.Tuple(testDataItem);
            // Construct args to be encoded
            const args = {
                field_1: new BigNumber(-5),
                field_2: 'Hello, World!',
                field_3: true,
                field_4: '0xabcdef0123456789',
            };
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs =
                '0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffb0000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000d48656c6c6f2c20576f726c6421000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008abcdef0123456789000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodingRules: AbiEncoder.DecodingRules = { structsAsObjects: true };
            const decodedArgs = dataType.decode(encodedArgs, decodingRules);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('Missing Key', async () => {
            // Create DataType object
            const testDataItem = {
                name: 'Tuple',
                type: 'tuple',
                components: [{ name: 'field_1', type: 'int32' }, { name: 'field_2', type: 'bool' }],
            };
            const dataType = new AbiEncoder.Tuple(testDataItem);
            // Construct args to be encoded
            const args = { field_1: new BigNumber(-5) };
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args);
            }).to.throw('Could not assign tuple to object: missing keys field_2');
        });
        it('Bad Key', async () => {
            // Create DataType object
            const testDataItem = {
                name: 'Tuple',
                type: 'tuple',
                components: [{ name: 'field_1', type: 'int32' }, { name: 'field_2', type: 'bool' }],
            };
            const dataType = new AbiEncoder.Tuple(testDataItem);
            // Construct args to be encoded
            const args = { unknown_field: new BigNumber(-5) };
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args);
            }).to.throw("Could not assign tuple to object: unrecognized key 'unknown_field' in object Tuple");
        });
    });

    describe('Address', () => {
        it('Valid Address', async () => {
            // Create DataType object
            const testDataItem = { name: 'Address', type: 'address' };
            const dataType = new AbiEncoder.Address(testDataItem);
            // Construct args to be encoded
            const args = '0xe41d2489571d322189246dafa5ebde1f4699f498';
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs = '0x000000000000000000000000e41d2489571d322189246dafa5ebde1f4699f498';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('Invalid Address - input is not valid hex', async () => {
            // Create DataType object
            const testDataItem = { name: 'Address', type: 'address' };
            const dataType = new AbiEncoder.Address(testDataItem);
            // Construct args to be encoded
            const args = 'e4';
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args);
            }).to.throw(AbiEncoder.Address.ERROR_MESSAGE_ADDRESS_MUST_START_WITH_0X);
        });
        it('Invalid Address - input is not 20 bytes', async () => {
            // Create DataType object
            const testDataItem = { name: 'Address', type: 'address' };
            const dataType = new AbiEncoder.Address(testDataItem);
            // Construct args to be encoded
            const args = '0xe4';
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args);
            }).to.throw(AbiEncoder.Address.ERROR_MESSAGE_ADDRESS_MUST_BE_20_BYTES);
        });
    });

    describe('Bool', () => {
        it('True', async () => {
            // Create DataType object
            const testDataItem = { name: 'Boolean', type: 'bool' };
            const dataType = new AbiEncoder.Bool(testDataItem);
            // Construct args to be encoded
            const args = true;
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs = '0x0000000000000000000000000000000000000000000000000000000000000001';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('False', async () => {
            // Create DataType object
            const testDataItem = { name: 'Boolean', type: 'bool' };
            const dataType = new AbiEncoder.Bool(testDataItem);
            // Construct args to be encoded
            const args = false;
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs = '0x0000000000000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
    });

    describe('Integer', () => {
        /* tslint:disable custom-no-magic-numbers */
        const max256BitInteger = new BigNumber(2).pow(255).minus(1);
        const min256BitInteger = new BigNumber(2).pow(255).times(-1);
        const max32BitInteger = new BigNumber(2).pow(31).minus(1);
        const min32BitInteger = new BigNumber(2).pow(31).times(-1);
        /* tslint:enable custom-no-magic-numbers */

        it('Int256 - Positive Base Case', async () => {
            // Create DataType object
            const testDataItem = { name: 'Integer (256)', type: 'int' };
            const dataType = new AbiEncoder.Int(testDataItem);
            // Construct args to be encoded
            const args = new BigNumber(1);
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs = '0x0000000000000000000000000000000000000000000000000000000000000001';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('Int256 - Negative Base Case', async () => {
            // Create DataType object
            const testDataItem = { name: 'Integer (256)', type: 'int' };
            const dataType = new AbiEncoder.Int(testDataItem);
            // Construct args to be encoded
            const args = new BigNumber(-1);
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('Int256 - Positive Value', async () => {
            // Create DataType object
            const testDataItem = { name: 'Integer (256)', type: 'int' };
            const dataType = new AbiEncoder.Int(testDataItem);
            // Construct args to be encoded
            const args = max256BitInteger;
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs = '0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('Int256 - Negative Value', async () => {
            // Create DataType object
            const testDataItem = { name: 'Integer (256)', type: 'int' };
            const dataType = new AbiEncoder.Int(testDataItem);
            // Construct args to be encoded
            const args = min256BitInteger;
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs = `0x8000000000000000000000000000000000000000000000000000000000000000`;
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('Int256 - Value too large', async () => {
            // Create DataType object
            const testDataItem = { name: 'Integer (256)', type: 'int' };
            const dataType = new AbiEncoder.Int(testDataItem);
            // Construct args to be encoded
            const args = max256BitInteger.plus(1);
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args);
            }).to.throw();
        });
        it('Int256 - Value too small', async () => {
            // Create DataType object
            const testDataItem = { name: 'Integer (256)', type: 'int' };
            const dataType = new AbiEncoder.Int(testDataItem);
            // Construct args to be encoded
            const args = min256BitInteger.minus(1);
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args);
            }).to.throw();
        });
        it('Int32 - Positive Base Case', async () => {
            // Create DataType object
            const testDataItem = { name: 'Integer (32)', type: 'int32' };
            const dataType = new AbiEncoder.Int(testDataItem);
            // Construct args to be encoded
            const args = new BigNumber(1);
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs = '0x0000000000000000000000000000000000000000000000000000000000000001';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('Int32 - Negative Base Case', async () => {
            // Create DataType object
            const testDataItem = { name: 'Integer (32)', type: 'int32' };
            const dataType = new AbiEncoder.Int(testDataItem);
            // Construct args to be encoded
            const args = new BigNumber(-1);
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('Int32 - Positive Value', async () => {
            // Create DataType object
            const testDataItem = { name: 'Integer (32)', type: 'int32' };
            const dataType = new AbiEncoder.Int(testDataItem);
            // Construct args to be encoded
            const args = max32BitInteger;
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs = '0x000000000000000000000000000000000000000000000000000000007fffffff';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('Int32 - Negative Value', async () => {
            // Create DataType object
            const testDataItem = { name: 'Integer (32)', type: 'int32' };
            const dataType = new AbiEncoder.Int(testDataItem);
            // Construct args to be encoded
            const args = min32BitInteger;
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs = `0xffffffffffffffffffffffffffffffffffffffffffffffffffffffff80000000`;
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('Int32 - Value too large', async () => {
            // Create DataType object
            const testDataItem = { name: 'Integer (32)', type: 'int32' };
            const dataType = new AbiEncoder.Int(testDataItem);
            // Construct args to be encoded
            const args = max32BitInteger.plus(1);
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args);
            }).to.throw();
        });
        it('Int32 - Value too small', async () => {
            // Create DataType object
            const testDataItem = { name: 'Integer (32)', type: 'int32' };
            const dataType = new AbiEncoder.Int(testDataItem);
            // Construct args to be encoded
            const args = min32BitInteger.minus(1);
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args);
            }).to.throw();
        });
    });

    describe('Unsigned Integer', () => {
        /* tslint:disable custom-no-magic-numbers */
        const max256BitUnsignedInteger = new BigNumber(2).pow(256).minus(1);
        const min256BitUnsignedInteger = new BigNumber(0);
        const max32BitUnsignedInteger = new BigNumber(2).pow(32).minus(1);
        const min32BitUnsignedInteger = new BigNumber(0);
        /* tslint:enable custom-no-magic-numbers */

        it('UInt256 - Positive Base Case', async () => {
            // Create DataType object
            const testDataItem = { name: 'Unsigned Integer (256)', type: 'uint' };
            const dataType = new AbiEncoder.UInt(testDataItem);
            // Construct args to be encoded
            const args = new BigNumber(1);
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs = '0x0000000000000000000000000000000000000000000000000000000000000001';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('UInt256 - Positive Value', async () => {
            // Create DataType object
            const testDataItem = { name: 'Unsigned Integer (256)', type: 'uint' };
            const dataType = new AbiEncoder.UInt(testDataItem);
            // Construct args to be encoded
            const args = max256BitUnsignedInteger;
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('UInt256 - Zero Value', async () => {
            // Create DataType object
            const testDataItem = { name: 'Unsigned Integer (256)', type: 'uint' };
            const dataType = new AbiEncoder.UInt(testDataItem);
            // Construct args to be encoded
            const args = min256BitUnsignedInteger;
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs = `0x0000000000000000000000000000000000000000000000000000000000000000`;
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('UInt256 - Value too large', async () => {
            // Create DataType object
            const testDataItem = { name: 'Unsigned Integer (256)', type: 'uint' };
            const dataType = new AbiEncoder.UInt(testDataItem);
            // Construct args to be encoded
            const args = max256BitUnsignedInteger.plus(1);
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args);
            }).to.throw();
        });
        it('UInt256 - Value too small', async () => {
            // Create DataType object
            const testDataItem = { name: 'Unsigned Integer (256)', type: 'uint' };
            const dataType = new AbiEncoder.UInt(testDataItem);
            // Construct args to be encoded
            const args = min256BitUnsignedInteger.minus(1);
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args);
            }).to.throw();
        });
        it('UInt32 - Positive Base Case', async () => {
            // Create DataType object
            const testDataItem = { name: 'Unsigned Integer (32)', type: 'uint32' };
            const dataType = new AbiEncoder.UInt(testDataItem);
            // Construct args to be encoded
            const args = new BigNumber(1);
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs = '0x0000000000000000000000000000000000000000000000000000000000000001';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('UInt32 - Positive Value', async () => {
            // Create DataType object
            const testDataItem = { name: 'Unsigned Integer (32)', type: 'uint32' };
            const dataType = new AbiEncoder.UInt(testDataItem);
            // Construct args to be encoded
            const args = max32BitUnsignedInteger;
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs = '0x00000000000000000000000000000000000000000000000000000000ffffffff';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('UInt32 - Zero Value', async () => {
            // Create DataType object
            const testDataItem = { name: 'Unsigned Integer (32)', type: 'uint32' };
            const dataType = new AbiEncoder.UInt(testDataItem);
            // Construct args to be encoded
            const args = min32BitUnsignedInteger;
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs = `0x0000000000000000000000000000000000000000000000000000000000000000`;
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('UInt32 - Value too large', async () => {
            // Create DataType object
            const testDataItem = { name: 'Unsigned Integer (32)', type: 'uint32' };
            const dataType = new AbiEncoder.UInt(testDataItem);
            // Construct args to be encoded
            const args = max32BitUnsignedInteger.plus(1);
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args);
            }).to.throw();
        });
        it('UInt32 - Value too small', async () => {
            // Create DataType object
            const testDataItem = { name: 'Unsigned Integer (32)', type: 'uint32' };
            const dataType = new AbiEncoder.UInt(testDataItem);
            // Construct args to be encoded
            const args = min32BitUnsignedInteger.minus(1);
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args);
            }).to.throw();
        });
    });

    describe('Static Bytes', () => {
        it('Single Byte (byte)', async () => {
            // Create DataType object
            const testDataItem = { name: 'Static Byte', type: 'byte' };
            const dataType = new AbiEncoder.StaticBytes(testDataItem);
            // Construct args to be encoded
            const args = '0x05';
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs = '0x0500000000000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('Single Byte (bytes1)', async () => {
            // Create DataType object
            const testDataItem = { name: 'Static Bytes1', type: 'bytes1' };
            const dataType = new AbiEncoder.StaticBytes(testDataItem);
            // Construct args to be encoded
            const args = '0x05';
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs = '0x0500000000000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('4 Bytes (bytes4)', async () => {
            // Create DataType object
            const testDataItem = { name: 'Static Bytes4', type: 'bytes4' };
            const dataType = new AbiEncoder.StaticBytes(testDataItem);
            // Construct args to be encoded
            const args = '0x00010203';
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs = '0x0001020300000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('4 Bytes (bytes4); Encoder must pad input', async () => {
            // Create DataType object
            const testDataItem = { name: 'Static Bytes4', type: 'bytes4' };
            const dataType = new AbiEncoder.StaticBytes(testDataItem);
            // Construct args to be encoded
            // Note: There will be padding because this is a bytes32 but we are only passing in 4 bytes.
            const args = '0x1a18';
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs = '0x1a18000000000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const paddedArgs = '0x1a180000';
            const paddedArgsAsJson = JSON.stringify(paddedArgs);
            expect(decodedArgsAsJson).to.be.equal(paddedArgsAsJson);
        });
        it('32 Bytes (bytes32)', async () => {
            // Create DataType object
            const testDataItem = { name: 'Static Bytes32', type: 'bytes32' };
            const dataType = new AbiEncoder.StaticBytes(testDataItem);
            // Construct args to be encoded
            const args = '0x0001020304050607080911121314151617181920212223242526272829303132';
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs = '0x0001020304050607080911121314151617181920212223242526272829303132';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('32 Bytes (bytes32); Encoder must pad input', async () => {
            // Create DataType object
            const testDataItem = { name: 'Static Bytes32', type: 'bytes32' };
            const dataType = new AbiEncoder.StaticBytes(testDataItem);
            // Construct args to be encoded
            // Note: There will be padding because this is a bytes32 but we are only passing in 4 bytes.
            const args = '0x1a18bf61';
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs = '0x1a18bf6100000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const paddedArgs = '0x1a18bf6100000000000000000000000000000000000000000000000000000000';
            const paddedArgsAsJson = JSON.stringify(paddedArgs);
            expect(decodedArgsAsJson).to.be.equal(paddedArgsAsJson);
        });
        it('Should throw when pass in too many bytes (bytes4)', async () => {
            // Create DataType object
            const testDataItem = { name: 'Static Bytes4', type: 'bytes4' };
            const dataType = new AbiEncoder.StaticBytes(testDataItem);
            // Construct args to be encoded
            const args = '0x0102030405';
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args);
            }).to.throw(
                'Tried to assign 0x0102030405 (5 bytes), which exceeds max bytes that can be stored in a bytes4',
            );
        });
        it('Should throw when pass in too many bytes (bytes32)', async () => {
            // Create DataType object
            const testDataItem = { name: 'Static Bytes32', type: 'bytes32' };
            const dataType = new AbiEncoder.StaticBytes(testDataItem);
            // Construct args to be encoded
            const args = '0x010203040506070809101112131415161718192021222324252627282930313233';
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args);
            }).to.throw(
                'Tried to assign 0x010203040506070809101112131415161718192021222324252627282930313233 (33 bytes), which exceeds max bytes that can be stored in a bytes32',
            );
        });
        it('Should throw when pass in bad hex (no 0x prefix)', async () => {
            // Create DataType object
            const testDataItem = { name: 'Static Bytes32', type: 'bytes32' };
            const dataType = new AbiEncoder.StaticBytes(testDataItem);
            // Construct args to be encoded
            const args = '0102030405060708091011121314151617181920212223242526272829303132';
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args);
            }).to.throw("Tried to encode non-hex value. Value must inlcude '0x' prefix.");
        });
        it('Should throw when pass in bad hex (include a half-byte)', async () => {
            // Create DataType object
            const testDataItem = { name: 'Static Bytes32', type: 'bytes32' };
            const dataType = new AbiEncoder.StaticBytes(testDataItem);
            // Construct args to be encoded
            const args = '0x010';
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args);
            }).to.throw('Tried to assign 0x010, which is contains a half-byte. Use full bytes only.');
        });
    });

    describe('Dynamic Bytes', () => {
        it('Fits into one EVM word', async () => {
            // Create DataType object
            const testDataItem = { name: 'Dynamic Bytes', type: 'bytes' };
            const dataType = new AbiEncoder.DynamicBytes(testDataItem);
            // Construct args to be encoded
            // Note: There will be padding because this is a bytes32 but we are only passing in 4 bytes.
            const args = '0x1a18bf61';
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs =
                '0x00000000000000000000000000000000000000000000000000000000000000041a18bf6100000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('Spans multiple EVM words', async () => {
            // Create DataType object
            const testDataItem = { name: 'Dynamic Bytes', type: 'bytes' };
            const dataType = new AbiEncoder.DynamicBytes(testDataItem);
            // Construct args to be encoded
            // Note: There will be padding because this is a bytes32 but we are only passing in 4 bytes.
            const bytesLength = 40;
            const args = '0x' + '61'.repeat(bytesLength);
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs =
                '0x000000000000000000000000000000000000000000000000000000000000002861616161616161616161616161616161616161616161616161616161616161616161616161616161000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('Input as Buffer', async () => {
            // Create DataType object
            const testDataItem = { name: 'Dynamic Bytes', type: 'bytes' };
            const dataType = new AbiEncoder.DynamicBytes(testDataItem);
            // Construct args to be encoded
            // Note: There will be padding because this is a bytes32 but we are only passing in 4 bytes.
            const args = '0x1a18bf61';
            const argsAsBuffer = ethUtil.toBuffer(args);
            // Encode Args and validate result
            const encodedArgs = dataType.encode(argsAsBuffer);
            const expectedEncodedArgs =
                '0x00000000000000000000000000000000000000000000000000000000000000041a18bf6100000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('Should throw when pass in bad hex (no 0x prefix)', async () => {
            // Create DataType object
            const testDataItem = { name: 'Static Bytes', type: 'bytes' };
            const dataType = new AbiEncoder.DynamicBytes(testDataItem);
            // Construct args to be encoded
            const args = '01';
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args);
            }).to.throw("Tried to encode non-hex value. Value must inlcude '0x' prefix.");
        });
        it('Should throw when pass in bad hex (include a half-byte)', async () => {
            // Create DataType object
            const testDataItem = { name: 'Static Bytes', type: 'bytes' };
            const dataType = new AbiEncoder.DynamicBytes(testDataItem);
            // Construct args to be encoded
            const args = '0x010';
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args);
            }).to.throw('Tried to assign 0x010, which is contains a half-byte. Use full bytes only.');
        });
    });

    describe('String', () => {
        it('Fits into one EVM word', async () => {
            // Create DataType object
            const testDataItem = { name: 'String', type: 'string' };
            const dataType = new AbiEncoder.String(testDataItem);
            // Construct args to be encoded
            // Note: There will be padding because this is a bytes32 but we are only passing in 4 bytes.
            const args = 'five';
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs =
                '0x00000000000000000000000000000000000000000000000000000000000000046669766500000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('Spans multiple EVM words', async () => {
            // Create DataType object
            const testDataItem = { name: 'String', type: 'string' };
            const dataType = new AbiEncoder.String(testDataItem);
            // Construct args to be encoded
            // Note: There will be padding because this is a bytes32 but we are only passing in 4 bytes.
            const bytesLength = 40;
            const args = 'a'.repeat(bytesLength);
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs =
                '0x000000000000000000000000000000000000000000000000000000000000002861616161616161616161616161616161616161616161616161616161616161616161616161616161000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
        it('String that begins with 0x prefix', async () => {
            // Create DataType object
            const testDataItem = { name: 'String', type: 'string' };
            const dataType = new AbiEncoder.String(testDataItem);
            // Construct args to be encoded
            // Note: There will be padding because this is a bytes32 but we are only passing in 4 bytes.
            const strLength = 40;
            const args = '0x' + 'a'.repeat(strLength);
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args);
            const expectedEncodedArgs =
                '0x000000000000000000000000000000000000000000000000000000000000002a30786161616161616161616161616161616161616161616161616161616161616161616161616161616100000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const decodedArgsAsJson = JSON.stringify(decodedArgs);
            const argsAsJson = JSON.stringify(args);
            expect(decodedArgsAsJson).to.be.equal(argsAsJson);
        });
    });
});
