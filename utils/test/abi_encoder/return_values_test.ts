import * as chai from 'chai';
import 'mocha';

import { AbiEncoder, BigNumber } from '../../src/';
import { chaiSetup } from '../utils/chai_setup';

import * as ReturnValueAbis from './abi_samples/return_value_abis';

chaiSetup.configure();
const expect = chai.expect;

describe('ABI Encoder: Return Value Encoding/Decoding', () => {
    const DECODE_BEYOND_CALL_DATA_ERROR = 'Tried to decode beyond the end of calldata';
    const encodingRules: AbiEncoder.EncodingRules = { shouldOptimize: false }; // optimizer is tested separately.
    const nullEncodedReturnValue = '0x';
    describe('Standard encoding/decoding', () => {
        it('No Return Value', async () => {
            // Decode return value
            const method = new AbiEncoder.Method(ReturnValueAbis.noReturnValues);
            const returnValue = '0x';
            const decodedReturnValue = method.decodeReturnValues(returnValue, { shouldConvertStructsToObjects: false });
            const expectedDecodedReturnValue: any[] = [];
            expect(decodedReturnValue).to.be.deep.equal(expectedDecodedReturnValue);
        });
        it('Single static return value', async () => {
            // Generate Return Value
            const method = new AbiEncoder.Method(ReturnValueAbis.singleStaticReturnValue);
            const returnValue = ['0x01020304'];
            const encodedReturnValue = method.encodeReturnValues(returnValue, encodingRules);
            const decodedReturnValue = method.decodeReturnValues(encodedReturnValue, {
                shouldConvertStructsToObjects: false,
            });
            // Validate decoded return value
            expect(decodedReturnValue).to.be.deep.equal(returnValue);
        });
        it('Multiple static return values', async () => {
            // Generate Return Value
            const method = new AbiEncoder.Method(ReturnValueAbis.multipleStaticReturnValues);
            const returnValue = ['0x01020304', '0x05060708'];
            const encodedReturnValue = method.encodeReturnValues(returnValue, encodingRules);
            const decodedReturnValue = method.decodeReturnValues(encodedReturnValue, {
                shouldConvertStructsToObjects: false,
            });
            // Validate decoded return value
            expect(decodedReturnValue).to.be.deep.equal(returnValue);
        });
        it('Single dynamic return value', async () => {
            // Generate Return Value
            const method = new AbiEncoder.Method(ReturnValueAbis.singleDynamicReturnValue);
            const returnValue = ['0x01020304'];
            const encodedReturnValue = method.encodeReturnValues(returnValue, encodingRules);
            const decodedReturnValue = method.decodeReturnValues(encodedReturnValue, {
                shouldConvertStructsToObjects: false,
            });
            // Validate decoded return value
            expect(decodedReturnValue).to.be.deep.equal(returnValue);
        });
        it('Multiple dynamic return values', async () => {
            // Generate Return Value
            const method = new AbiEncoder.Method(ReturnValueAbis.multipleDynamicReturnValues);
            const returnValue = ['0x01020304', '0x05060708'];
            const encodedReturnValue = method.encodeReturnValues(returnValue, encodingRules);
            const decodedReturnValue = method.decodeReturnValues(encodedReturnValue, {
                shouldConvertStructsToObjects: false,
            });
            // Validate decoded return value
            expect(decodedReturnValue).to.be.deep.equal(returnValue);
        });
        it('Mixed static/dynamic return values', async () => {
            // Generate Return Value
            const method = new AbiEncoder.Method(ReturnValueAbis.mixedStaticAndDynamicReturnValues);
            const returnValue = ['0x01020304', '0x05060708'];
            const encodedReturnValue = method.encodeReturnValues(returnValue, encodingRules);
            const decodedReturnValue = method.decodeReturnValues(encodedReturnValue, {
                shouldConvertStructsToObjects: false,
            });
            // Validate decoded return value
            expect(decodedReturnValue).to.be.deep.equal(returnValue);
        });
        it('Should decode NULL as default value (single; static)', async () => {
            // Generate Return Value
            const method = new AbiEncoder.Method(ReturnValueAbis.singleStaticReturnValue);
            const returnValue = ['0x00000000'];

            const decodedReturnValue = method.decodeReturnValues(nullEncodedReturnValue, {
                shouldConvertStructsToObjects: false,
            });
            // Validate decoded return value
            expect(decodedReturnValue).to.be.deep.equal(returnValue);
        });
        it('Should decode NULL as default value (multiple; static)', async () => {
            // Generate Return Value
            const method = new AbiEncoder.Method(ReturnValueAbis.multipleStaticReturnValues);
            const returnValue = ['0x00000000', '0x00000000'];
            const decodedReturnValue = method.decodeReturnValues(nullEncodedReturnValue, {
                shouldConvertStructsToObjects: false,
            });
            // Validate decoded return value
            expect(decodedReturnValue).to.be.deep.equal(returnValue);
        });
        it('Should decode NULL as default value (single; dynamic)', async () => {
            // Generate Return Value
            const method = new AbiEncoder.Method(ReturnValueAbis.singleDynamicReturnValue);
            const returnValue = ['0x'];
            const decodedReturnValue = method.decodeReturnValues(nullEncodedReturnValue, {
                shouldConvertStructsToObjects: false,
            });
            // Validate decoded return value
            expect(decodedReturnValue).to.be.deep.equal(returnValue);
        });
    });

    describe('Strict encoding/decoding', () => {
        it('No Return Value', async () => {
            // Decode return value
            const method = new AbiEncoder.Method(ReturnValueAbis.noReturnValues);
            const returnValue = '0x';
            const decodedReturnValue = method.strictDecodeReturnValue<void>(returnValue);
            const expectedDecodedReturnValue = undefined;
            expect(decodedReturnValue).to.be.deep.equal(expectedDecodedReturnValue);
        });
        it('Single static return value', async () => {
            // Generate Return Value
            const method = new AbiEncoder.Method(ReturnValueAbis.singleStaticReturnValue);
            const returnValue = ['0x01020304'];
            const encodedReturnValue = method.encodeReturnValues(returnValue, encodingRules);
            const decodedReturnValue = method.strictDecodeReturnValue<string>(encodedReturnValue);
            // Validate decoded return value
            expect(decodedReturnValue).to.be.deep.equal(returnValue[0]);
        });
        it('Multiple static return values', async () => {
            // Generate Return Value
            const method = new AbiEncoder.Method(ReturnValueAbis.multipleStaticReturnValues);
            const returnValue = ['0x01020304', '0x05060708'];
            const encodedReturnValue = method.encodeReturnValues(returnValue, encodingRules);
            const decodedReturnValue = method.strictDecodeReturnValue<[string, string]>(encodedReturnValue);
            // Validate decoded return value
            expect(decodedReturnValue).to.be.deep.equal(returnValue);
        });
        it('Single dynamic return value', async () => {
            // Generate Return Value
            const method = new AbiEncoder.Method(ReturnValueAbis.singleDynamicReturnValue);
            const returnValue = ['0x01020304'];
            const encodedReturnValue = method.encodeReturnValues(returnValue, encodingRules);
            const decodedReturnValue = method.strictDecodeReturnValue<string>(encodedReturnValue);
            // Validate decoded return value
            expect(decodedReturnValue).to.be.deep.equal(returnValue[0]);
        });
        it('Multiple dynamic return values', async () => {
            // Generate Return Value
            const method = new AbiEncoder.Method(ReturnValueAbis.multipleDynamicReturnValues);
            const returnValue = ['0x01020304', '0x05060708'];
            const encodedReturnValue = method.encodeReturnValues(returnValue, encodingRules);
            const decodedReturnValue = method.strictDecodeReturnValue<[string, string]>(encodedReturnValue);
            // Validate decoded return value
            expect(decodedReturnValue).to.be.deep.equal(returnValue);
        });
        it('Struct should include fields', async () => {
            // Generate Return Value
            const method = new AbiEncoder.Method(ReturnValueAbis.structuredReturnValue);
            const returnValue = {
                fillResults: {
                    makerAssetFilledAmount: new BigNumber(50),
                    takerAssetFilledAmount: new BigNumber(40),
                },
            };
            const encodedReturnValue = method.encodeReturnValues(returnValue, encodingRules);
            const decodedReturnValue = method.strictDecodeReturnValue<{
                makerAssetFilledAmount: BigNumber;
                takerAssetFilledAmount: BigNumber;
            }>(encodedReturnValue);
            // Validate decoded return value
            // Note that only the contents of `fillResults`, not the key itself, is decoded.
            // This is by design, as only a struct's contents are encoded and returned by a funciton call.
            expect(decodedReturnValue).to.be.deep.equal(returnValue.fillResults);
        });
        it('Should fail to decode NULL (single; static)', async () => {
            // Generate Return Value
            const method = new AbiEncoder.Method(ReturnValueAbis.singleStaticReturnValue);
            const encodedReturnValue = '0x';
            const decodeReturnValue = () => method.strictDecodeReturnValue<string>(encodedReturnValue);
            // Validate decoded return value
            expect(decodeReturnValue).to.throws(DECODE_BEYOND_CALL_DATA_ERROR);
        });
        it('Should fail to decode NULL (multiple; static)', async () => {
            // Generate Return Value
            const method = new AbiEncoder.Method(ReturnValueAbis.multipleStaticReturnValues);
            const encodedReturnValue = '0x';
            const decodeReturnValue = () => method.strictDecodeReturnValue<[string, string]>(encodedReturnValue);
            // Validate decoded return value
            expect(decodeReturnValue).to.throws(DECODE_BEYOND_CALL_DATA_ERROR);
        });
        it('Should fail to decode NULL (single; dynamic)', async () => {
            // Generate Return Value
            const method = new AbiEncoder.Method(ReturnValueAbis.singleDynamicReturnValue);
            const encodedReturnValue = '0x';
            const decodeReturnValue = () => method.strictDecodeReturnValue<string>(encodedReturnValue);
            // Validate decoded return value
            expect(decodeReturnValue).to.throws(DECODE_BEYOND_CALL_DATA_ERROR);
        });
    });
});
