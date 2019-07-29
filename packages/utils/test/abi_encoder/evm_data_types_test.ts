/* tslint:disable max-file-line-count */
import * as chai from 'chai';
import * as ethUtil from 'ethereumjs-util';
import 'mocha';

import { AbiEncoder, BigNumber } from '../../src/';
import { chaiSetup } from '../utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

describe('ABI Encoder: EVM Data Type Encoding/Decoding', () => {
    const encodingRules: AbiEncoder.EncodingRules = { shouldOptimize: false }; // optimizer is tested separately.
    const nullEncodedArgs = '0x';
    describe('Array', () => {
        it('Fixed size; Static elements', async () => {
            // Create DataType object
            const testDataItem = { name: 'testArray', type: 'int[2]' };
            const dataType = new AbiEncoder.Array(testDataItem);
            // Construct args to be encoded
            const args = [new BigNumber(5), new BigNumber(6)];
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs =
                '0x00000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000006';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(false));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('Dynamic size; Static elements', async () => {
            // Create DataType object
            const testDataItem = { name: 'testArray', type: 'int[]' };
            const dataType = new AbiEncoder.Array(testDataItem);
            // Construct args to be encoded
            const args = [new BigNumber(5), new BigNumber(6)];
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs =
                '0x000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000006';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('Fixed size; Dynamic elements', async () => {
            // Create DataType object
            const testDataItem = { name: 'testArray', type: 'string[2]' };
            const dataType = new AbiEncoder.Array(testDataItem);
            // Construct args to be encoded
            const args = ['Hello', 'world'];
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs =
                '0x00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000548656c6c6f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005776f726c64000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('Dynamic size; Dynamic elements', async () => {
            // Create DataType object
            const testDataItem = { name: 'testArray', type: 'string[]' };
            const dataType = new AbiEncoder.Array(testDataItem);
            // Construct args to be encoded
            const args = ['Hello', 'world'];
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs =
                '0x000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000548656c6c6f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005776f726c64000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
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
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs =
                '0x0000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000001a000000000000000000000000000000000000000000000000000000000000002800000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000000040102030400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000405060708000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004091011120000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000041011121300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000414151617000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000041819202100000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
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
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs =
                '0x0000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000000000301020304000000000000000000000000000000000000000000000000000000000506070800000000000000000000000000000000000000000000000000000000091011120000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000021011121300000000000000000000000000000000000000000000000000000000141516170000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011819202100000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
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
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs =
                '0x010203040000000000000000000000000000000000000000000000000000000005060708000000000000000000000000000000000000000000000000000000000910111200000000000000000000000000000000000000000000000000000000101112130000000000000000000000000000000000000000000000000000000014151617000000000000000000000000000000000000000000000000000000001819202100000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
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
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs =
                '0x00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000401020304000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004050607080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040910111200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000410111213000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004141516170000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041819202100000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('Static size; Too Few Elements', async () => {
            // Create DataType object
            const testDataItem = { name: 'testArray', type: 'string[3]' };
            const dataType = new AbiEncoder.Array(testDataItem);
            // Construct args to be encoded
            const args = ['Hello', 'world'];
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args, encodingRules);
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
                dataType.encode(args, encodingRules);
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
                dataType.encode(args, encodingRules);
            }).to.throw('Tried to assign NaN value');
        });
        it('Should decode NULL to default values (Fixed size; Static elements)', async () => {
            // Create DataType object
            const testDataItem = { name: 'testArray', type: 'int[2]' };
            const dataType = new AbiEncoder.Array(testDataItem);
            const args = [new BigNumber(0), new BigNumber(0)];
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(nullEncodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
        });
        it('Should decode NULL to default values (Dynamic size; Static elements)', async () => {
            // Create DataType object
            const testDataItem = { name: 'testArray', type: 'int[]' };
            const dataType = new AbiEncoder.Array(testDataItem);
            const args: BigNumber[] = [];
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(nullEncodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
        });
        it('Should decode NULL to default values (Fixed size; Dynamic elements)', async () => {
            // Create DataType object
            const testDataItem = { name: 'testArray', type: 'string[2]' };
            const dataType = new AbiEncoder.Array(testDataItem);
            const args = ['', ''];
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(nullEncodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
        });
        it('Should decode NULL to default values (Dynamic size; Dynamic elements)', async () => {
            // Create DataType object
            const testDataItem = { name: 'testArray', type: 'string[]' };
            const dataType = new AbiEncoder.Array(testDataItem);
            const args: string[] = [];
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(nullEncodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
        });
        it('Should decode NULL to default values (Dynamic Size; Multidimensional; Dynamic Elements)', async () => {
            // Create DataType object
            const testDataItem = { name: 'testArray', type: 'bytes[][]' };
            const dataType = new AbiEncoder.Array(testDataItem);
            const args: string[][] = [];
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(nullEncodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
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
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs =
                '0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffb0000000000000000000000000000000000000000000000000000000000000001';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodingRules: AbiEncoder.DecodingRules = { shouldConvertStructsToObjects: true };
            const decodedArgs = dataType.decode(encodedArgs, decodingRules);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args, encodingRules);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
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
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs =
                '0x00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000d48656c6c6f2c20576f726c6421000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008abcdef0123456789000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodingRules: AbiEncoder.DecodingRules = { shouldConvertStructsToObjects: true };
            const decodedArgs = dataType.decode(encodedArgs, decodingRules);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
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
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs =
                '0x00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodingRules: AbiEncoder.DecodingRules = { shouldConvertStructsToObjects: true };
            const decodedArgs = dataType.decode(encodedArgs, decodingRules);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
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
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs =
                '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodingRules: AbiEncoder.DecodingRules = { shouldConvertStructsToObjects: true };
            const decodedArgs = dataType.decode(encodedArgs, decodingRules);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
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
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs =
                '0x0102030400000000000000000000000000000000000000000000000000000000050607080000000000000000000000000000000000000000000000000000000009101112000000000000000000000000000000000000000000000000000000001314151600000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodingRules: AbiEncoder.DecodingRules = { shouldConvertStructsToObjects: true };
            const decodedArgs = dataType.decode(encodedArgs, decodingRules);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
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
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs =
                '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000004010203040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040506070800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000004091011120000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041314151600000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodingRules: AbiEncoder.DecodingRules = { shouldConvertStructsToObjects: true };
            const decodedArgs = dataType.decode(encodedArgs, decodingRules);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
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
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs =
                '0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffb0000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000d48656c6c6f2c20576f726c6421000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008abcdef0123456789000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodingRules: AbiEncoder.DecodingRules = { shouldConvertStructsToObjects: true };
            const decodedArgs = dataType.decode(encodedArgs, decodingRules);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
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
                dataType.encode(args, encodingRules);
            }).to.throw('Could not assign tuple to object: missing key \'field_2\' in object {"field_1":"-5"}');
        });
        it('Should decode NULL to default values (static elements only)', async () => {
            // Create DataType object
            const testDataItem = {
                name: 'Tuple',
                type: 'tuple',
                components: [{ name: 'field_1', type: 'int32' }, { name: 'field_2', type: 'bool' }],
            };
            const dataType = new AbiEncoder.Tuple(testDataItem);
            // Construct args to be encoded
            const args = { field_1: new BigNumber(0), field_2: false };
            // Decode Encoded Args and validate result
            const decodingRules: AbiEncoder.DecodingRules = { shouldConvertStructsToObjects: true };
            const decodedArgs = dataType.decode(nullEncodedArgs, decodingRules);
            expect(decodedArgs).to.be.deep.equal(args);
        });
        it('Should decode NULL to default values (static and dynamic elements)', async () => {
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
                field_1: new BigNumber(0),
                field_2: '',
                field_3: false,
                field_4: '0x',
            };
            // Decode Encoded Args and validate result
            const decodingRules: AbiEncoder.DecodingRules = { shouldConvertStructsToObjects: true };
            const decodedArgs = dataType.decode(nullEncodedArgs, decodingRules);
            expect(decodedArgs).to.be.deep.equal(args);
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
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs = '0x000000000000000000000000e41d2489571d322189246dafa5ebde1f4699f498';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('Invalid Address - input is not valid hex', async () => {
            // Create DataType object
            const testDataItem = { name: 'Address', type: 'address' };
            const dataType = new AbiEncoder.Address(testDataItem);
            // Construct args to be encoded
            const args = 'e4';
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args, encodingRules);
            }).to.throw(`Invalid address: '${args}'`);
        });
        it('Invalid Address - input is not 20 bytes', async () => {
            // Create DataType object
            const testDataItem = { name: 'Address', type: 'address' };
            const dataType = new AbiEncoder.Address(testDataItem);
            // Construct args to be encoded
            const args = '0xe4';
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args, encodingRules);
            }).to.throw(`Invalid address: '${args}'`);
        });
        it('Should decode NULL to default value of address zero', async () => {
            // Create DataType object
            const testDataItem = { name: 'Address', type: 'address' };
            const dataType = new AbiEncoder.Address(testDataItem);
            const args = '0x0000000000000000000000000000000000000000';
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(nullEncodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
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
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs = '0x0000000000000000000000000000000000000000000000000000000000000001';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('False', async () => {
            // Create DataType object
            const testDataItem = { name: 'Boolean', type: 'bool' };
            const dataType = new AbiEncoder.Bool(testDataItem);
            // Construct args to be encoded
            const args = false;
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs = '0x0000000000000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('Should decode NULL to default value of False', async () => {
            // Create DataType object
            const testDataItem = { name: 'Boolean', type: 'bool' };
            const dataType = new AbiEncoder.Bool(testDataItem);
            const args = false;
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(nullEncodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
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
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs = '0x0000000000000000000000000000000000000000000000000000000000000001';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('Int256 - Negative Base Case', async () => {
            // Create DataType object
            const testDataItem = { name: 'Integer (256)', type: 'int' };
            const dataType = new AbiEncoder.Int(testDataItem);
            // Construct args to be encoded
            const args = new BigNumber(-1);
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('Int256 - Positive Value', async () => {
            // Create DataType object
            const testDataItem = { name: 'Integer (256)', type: 'int' };
            const dataType = new AbiEncoder.Int(testDataItem);
            // Construct args to be encoded
            const args = max256BitInteger;
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs = '0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('Int256 - Negative Value', async () => {
            // Create DataType object
            const testDataItem = { name: 'Integer (256)', type: 'int' };
            const dataType = new AbiEncoder.Int(testDataItem);
            // Construct args to be encoded
            const args = min256BitInteger;
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs = `0x8000000000000000000000000000000000000000000000000000000000000000`;
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('Int256 - Value too large', async () => {
            // Create DataType object
            const testDataItem = { name: 'Integer (256)', type: 'int' };
            const dataType = new AbiEncoder.Int(testDataItem);
            // Construct args to be encoded
            const args = max256BitInteger.plus(1);
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args, encodingRules);
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
                dataType.encode(args, encodingRules);
            }).to.throw();
        });
        it('Int32 - Positive Base Case', async () => {
            // Create DataType object
            const testDataItem = { name: 'Integer (32)', type: 'int32' };
            const dataType = new AbiEncoder.Int(testDataItem);
            // Construct args to be encoded
            const args = new BigNumber(1);
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs = '0x0000000000000000000000000000000000000000000000000000000000000001';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('Int32 - Negative Base Case', async () => {
            // Create DataType object
            const testDataItem = { name: 'Integer (32)', type: 'int32' };
            const dataType = new AbiEncoder.Int(testDataItem);
            // Construct args to be encoded
            const args = new BigNumber(-1);
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('Int32 - Positive Value', async () => {
            // Create DataType object
            const testDataItem = { name: 'Integer (32)', type: 'int32' };
            const dataType = new AbiEncoder.Int(testDataItem);
            // Construct args to be encoded
            const args = max32BitInteger;
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs = '0x000000000000000000000000000000000000000000000000000000007fffffff';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('Int32 - Negative Value', async () => {
            // Create DataType object
            const testDataItem = { name: 'Integer (32)', type: 'int32' };
            const dataType = new AbiEncoder.Int(testDataItem);
            // Construct args to be encoded
            const args = min32BitInteger;
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs = `0xffffffffffffffffffffffffffffffffffffffffffffffffffffffff80000000`;
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('Int32 - Value too large', async () => {
            // Create DataType object
            const testDataItem = { name: 'Integer (32)', type: 'int32' };
            const dataType = new AbiEncoder.Int(testDataItem);
            // Construct args to be encoded
            const args = max32BitInteger.plus(1);
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args, encodingRules);
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
                dataType.encode(args, encodingRules);
            }).to.throw();
        });
        it('Should decode NULL to default value of 0', async () => {
            // Create DataType object
            const testDataItem = { name: 'Integer (256)', type: 'int' };
            const dataType = new AbiEncoder.Int(testDataItem);
            const args = new BigNumber(0);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(nullEncodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
        });
        it('Should fail to decode if not enough bytes in calldata', async () => {
            // Create DataType object
            const testDataItem = { name: 'Integer (256)', type: 'int' };
            const dataType = new AbiEncoder.Int(testDataItem);
            const args = new BigNumber(0);
            const encodedArgs = dataType.encode(args, encodingRules);
            const encodedArgsTruncated = encodedArgs.substr(0, 60);
            // Encode Args and validate result
            expect(() => {
                dataType.decode(encodedArgsTruncated);
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
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs = '0x0000000000000000000000000000000000000000000000000000000000000001';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('UInt256 - Positive Value', async () => {
            // Create DataType object
            const testDataItem = { name: 'Unsigned Integer (256)', type: 'uint' };
            const dataType = new AbiEncoder.UInt(testDataItem);
            // Construct args to be encoded
            const args = max256BitUnsignedInteger;
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('UInt256 - Zero Value', async () => {
            // Create DataType object
            const testDataItem = { name: 'Unsigned Integer (256)', type: 'uint' };
            const dataType = new AbiEncoder.UInt(testDataItem);
            // Construct args to be encoded
            const args = min256BitUnsignedInteger;
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs = `0x0000000000000000000000000000000000000000000000000000000000000000`;
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('UInt256 - Value too large', async () => {
            // Create DataType object
            const testDataItem = { name: 'Unsigned Integer (256)', type: 'uint' };
            const dataType = new AbiEncoder.UInt(testDataItem);
            // Construct args to be encoded
            const args = max256BitUnsignedInteger.plus(1);
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args, encodingRules);
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
                dataType.encode(args, encodingRules);
            }).to.throw();
        });
        it('UInt32 - Positive Base Case', async () => {
            // Create DataType object
            const testDataItem = { name: 'Unsigned Integer (32)', type: 'uint32' };
            const dataType = new AbiEncoder.UInt(testDataItem);
            // Construct args to be encoded
            const args = new BigNumber(1);
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs = '0x0000000000000000000000000000000000000000000000000000000000000001';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('UInt32 - Positive Value', async () => {
            // Create DataType object
            const testDataItem = { name: 'Unsigned Integer (32)', type: 'uint32' };
            const dataType = new AbiEncoder.UInt(testDataItem);
            // Construct args to be encoded
            const args = max32BitUnsignedInteger;
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs = '0x00000000000000000000000000000000000000000000000000000000ffffffff';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('UInt32 - Zero Value', async () => {
            // Create DataType object
            const testDataItem = { name: 'Unsigned Integer (32)', type: 'uint32' };
            const dataType = new AbiEncoder.UInt(testDataItem);
            // Construct args to be encoded
            const args = min32BitUnsignedInteger;
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs = `0x0000000000000000000000000000000000000000000000000000000000000000`;
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('UInt32 - Value too large', async () => {
            // Create DataType object
            const testDataItem = { name: 'Unsigned Integer (32)', type: 'uint32' };
            const dataType = new AbiEncoder.UInt(testDataItem);
            // Construct args to be encoded
            const args = max32BitUnsignedInteger.plus(1);
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args, encodingRules);
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
                dataType.encode(args, encodingRules);
            }).to.throw();
        });
        it('Should decode NULL to default value of 0', async () => {
            // Create DataType object
            const testDataItem = { name: 'Unsigned Integer (256)', type: 'uint' };
            const dataType = new AbiEncoder.UInt(testDataItem);
            const args = new BigNumber(0);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(nullEncodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
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
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs = '0x0500000000000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('Single Byte (bytes1)', async () => {
            // Create DataType object
            const testDataItem = { name: 'Static Bytes1', type: 'bytes1' };
            const dataType = new AbiEncoder.StaticBytes(testDataItem);
            // Construct args to be encoded
            const args = '0x05';
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs = '0x0500000000000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('4 Bytes (bytes4)', async () => {
            // Create DataType object
            const testDataItem = { name: 'Static Bytes4', type: 'bytes4' };
            const dataType = new AbiEncoder.StaticBytes(testDataItem);
            // Construct args to be encoded
            const args = '0x00010203';
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs = '0x0001020300000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('4 Bytes (bytes4); Encoder must pad input', async () => {
            // Create DataType object
            const testDataItem = { name: 'Static Bytes4', type: 'bytes4' };
            const dataType = new AbiEncoder.StaticBytes(testDataItem);
            // Construct args to be encoded
            // Note: There will be padding because this is a bytes32 but we are only passing in 4 bytes.
            const args = '0x1a18';
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs = '0x1a18000000000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const paddedArgs = '0x1a180000';
            expect(decodedArgs).to.be.deep.equal(paddedArgs);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('32 Bytes (bytes32)', async () => {
            // Create DataType object
            const testDataItem = { name: 'Static Bytes32', type: 'bytes32' };
            const dataType = new AbiEncoder.StaticBytes(testDataItem);
            // Construct args to be encoded
            const args = '0x0001020304050607080911121314151617181920212223242526272829303132';
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs = '0x0001020304050607080911121314151617181920212223242526272829303132';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('32 Bytes (bytes32); Encoder must pad input', async () => {
            // Create DataType object
            const testDataItem = { name: 'Static Bytes32', type: 'bytes32' };
            const dataType = new AbiEncoder.StaticBytes(testDataItem);
            // Construct args to be encoded
            // Note: There will be padding because this is a bytes32 but we are only passing in 4 bytes.
            const args = '0x1a18bf61';
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs = '0x1a18bf6100000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            const paddedArgs = '0x1a18bf6100000000000000000000000000000000000000000000000000000000';
            expect(decodedArgs).to.be.deep.equal(paddedArgs);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('Should throw when pass in too many bytes (bytes4)', async () => {
            // Create DataType object
            const testDataItem = { name: 'Static Bytes4', type: 'bytes4' };
            const dataType = new AbiEncoder.StaticBytes(testDataItem);
            // Construct args to be encoded
            const args = '0x0102030405';
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args, encodingRules);
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
                dataType.encode(args, encodingRules);
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
                dataType.encode(args, encodingRules);
            }).to.throw("Tried to encode non-hex value. Value must include '0x' prefix.");
        });
        it('Should throw when pass in bad hex (include a half-byte)', async () => {
            // Create DataType object
            const testDataItem = { name: 'Static Bytes32', type: 'bytes32' };
            const dataType = new AbiEncoder.StaticBytes(testDataItem);
            // Construct args to be encoded
            const args = '0x010';
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args, encodingRules);
            }).to.throw('Tried to assign 0x010, which is contains a half-byte. Use full bytes only.');
        });
        it('Should decode NULL to default value - Single Byte (byte)', async () => {
            // Create DataType object
            const testDataItem = { name: 'Static Byte', type: 'byte' };
            const dataType = new AbiEncoder.StaticBytes(testDataItem);
            const args = '0x00';
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(nullEncodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
        });
        it('Should decode NULL to default value - 4 Bytes (bytes4)', async () => {
            // Create DataType object
            const testDataItem = { name: 'Static Bytes4', type: 'bytes4' };
            const dataType = new AbiEncoder.StaticBytes(testDataItem);
            const args = '0x00000000';
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(nullEncodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
        });
        it('Should decode NULL to default value - 32 Bytes (bytes32)', async () => {
            // Create DataType object
            const testDataItem = { name: 'Static Bytes32', type: 'bytes32' };
            const dataType = new AbiEncoder.StaticBytes(testDataItem);
            const args = '0x0000000000000000000000000000000000000000000000000000000000000000';
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(nullEncodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
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
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs =
                '0x00000000000000000000000000000000000000000000000000000000000000041a18bf6100000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('Spans multiple EVM words', async () => {
            // Create DataType object
            const testDataItem = { name: 'Dynamic Bytes', type: 'bytes' };
            const dataType = new AbiEncoder.DynamicBytes(testDataItem);
            // Construct args to be encoded
            // Note: There will be padding because this is a bytes32 but we are only passing in 4 bytes.
            const bytesLength = 40;
            const args = `0x${'61'.repeat(bytesLength)}`;
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs =
                '0x000000000000000000000000000000000000000000000000000000000000002861616161616161616161616161616161616161616161616161616161616161616161616161616161000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
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
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('Should throw when pass in bad hex (no 0x prefix)', async () => {
            // Create DataType object
            const testDataItem = { name: 'Static Bytes', type: 'bytes' };
            const dataType = new AbiEncoder.DynamicBytes(testDataItem);
            // Construct args to be encoded
            const args = '01';
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args, encodingRules);
            }).to.throw("Tried to encode non-hex value. Value must include '0x' prefix.");
        });
        it('Should throw when pass in bad hex (include a half-byte)', async () => {
            // Create DataType object
            const testDataItem = { name: 'Static Bytes', type: 'bytes' };
            const dataType = new AbiEncoder.DynamicBytes(testDataItem);
            // Construct args to be encoded
            const args = '0x010';
            // Encode Args and validate result
            expect(() => {
                dataType.encode(args, encodingRules);
            }).to.throw('Tried to assign 0x010, which is contains a half-byte. Use full bytes only.');
        });
        it('Should decode NULL to empty byte array', async () => {
            // Create DataType object
            const testDataItem = { name: 'Dynamic Bytes', type: 'bytes' };
            const dataType = new AbiEncoder.DynamicBytes(testDataItem);
            const args = '0x';
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(nullEncodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
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
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs =
                '0x00000000000000000000000000000000000000000000000000000000000000046669766500000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
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
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs =
                '0x000000000000000000000000000000000000000000000000000000000000002861616161616161616161616161616161616161616161616161616161616161616161616161616161000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('String that begins with 0x prefix', async () => {
            // Create DataType object
            const testDataItem = { name: 'String', type: 'string' };
            const dataType = new AbiEncoder.String(testDataItem);
            // Construct args to be encoded
            // Note: There will be padding because this is a bytes32 but we are only passing in 4 bytes.
            const strLength = 40;
            const args = `0x${'a'.repeat(strLength)}`;
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs =
                '0x000000000000000000000000000000000000000000000000000000000000002a30786161616161616161616161616161616161616161616161616161616161616161616161616161616100000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('String that has a multibyte UTF-8 character', async () => {
            // Create DataType object
            const testDataItem = { name: 'String', type: 'string' };
            const dataType = new AbiEncoder.String(testDataItem);
            // Construct args to be encoded
            const args = '👴🏼';
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs =
                '0x0000000000000000000000000000000000000000000000000000000000000008f09f91b4f09f8fbc000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('String that combines single and multibyte UTF-8 characters', async () => {
            // Create DataType object
            const testDataItem = { name: 'String', type: 'string' };
            const dataType = new AbiEncoder.String(testDataItem);
            // Construct args to be encoded
            const args = 'Hello 😀👴🏼😁😂😃 world!';
            // Encode Args and validate result
            const encodedArgs = dataType.encode(args, encodingRules);
            const expectedEncodedArgs =
                '0x000000000000000000000000000000000000000000000000000000000000002548656c6c6f20f09f9880f09f91b4f09f8fbcf09f9881f09f9882f09f988320776f726c6421000000000000000000000000000000000000000000000000000000';
            expect(encodedArgs).to.be.equal(expectedEncodedArgs);
            // Decode Encoded Args and validate result
            const decodedArgs = dataType.decode(encodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
            // Validate signature
            const dataTypeFromSignature = AbiEncoder.create(dataType.getSignature(true));
            const argsEncodedFromSignature = dataTypeFromSignature.encode(args);
            expect(argsEncodedFromSignature).to.be.deep.equal(expectedEncodedArgs);
        });
        it('Should decode NULL to empty string', async () => {
            // Create DataType object
            const testDataItem = { name: 'String', type: 'string' };
            const dataType = new AbiEncoder.String(testDataItem);
            // Decode Encoded Args and validate result
            const args = '';
            const decodedArgs = dataType.decode(nullEncodedArgs);
            expect(decodedArgs).to.be.deep.equal(args);
        });
    });
});
