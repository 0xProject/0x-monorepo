import * as chai from 'chai';
import 'mocha';

import { AbiEncoder, BigNumber } from '../../src/';
import { chaiSetup } from '../utils/chai_setup';

import * as AbiSamples from './abi_samples/constructor_abis';

chaiSetup.configure();
const expect = chai.expect;

describe.only('ABI Encoder: Constructor Encoding', () => {
    const encodingRules: AbiEncoder.EncodingRules = { shouldOptimize: false }; // optimizer is tested separately.
    it('Encodes the constructor arguments with the bytecode', async () => {
        const method = new AbiEncoder.Constructor(AbiSamples.simpleAbi);
        const args = [new BigNumber(1), 'abcd'];
        const bytecode = '0x0';
        const calldata = method.encode(bytecode, args, encodingRules);
        const expectedCallData =
            '0x00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000046162636400000000000000000000000000000000000000000000000000000000';
        expect(calldata).to.eql(expectedCallData);
    });
    it('Encodes the constructor arguments with the bytecode', async () => {
        const method = new AbiEncoder.Constructor(AbiSamples.noArgumentConstructor);
        const bytecode = '0x1234';
        const calldata = method.encode(bytecode, [], encodingRules);
        expect(calldata).to.eql(bytecode);
    });
});
