import * as chai from 'chai';
import 'mocha';

import { AbiEncoder } from '../../src/';
import { chaiSetup } from '../utils/chai_setup';

import * as ReturnValueAbis from './abi_samples/return_value_abis';

chaiSetup.configure();
const expect = chai.expect;

describe('ABI Encoder: Return Value Encoding/Decoding', () => {
    const encodingRules: AbiEncoder.EncodingRules = { shouldOptimize: false }; // optimizer is tested separately.
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
});
