import * as chai from 'chai';
import { MethodAbi } from 'ethereum-types';
import 'mocha';

import { AbiDecoder, AbiEncoder } from '../src';

import { chaiSetup } from './utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

describe('AbiDecoder', () => {
    it('should successfully add a new ABI and decode calldata for it', async () => {
        // Add new ABI
        const abi: MethodAbi = {
            name: 'foobar',
            type: 'function',
            inputs: [
                {
                    name: 'testAddress',
                    type: 'address',
                },
            ],
            outputs: [
                {
                    name: 'butter',
                    type: 'string',
                },
            ],
            constant: false,
            payable: false,
            stateMutability: 'pure',
        };
        const contractName = 'newContract';
        const testAddress = '0x0001020304050607080900010203040506070809';
        const abiDecoder = new AbiDecoder([]);
        abiDecoder.addABI([abi], contractName);
        // Create some tx data
        const foobarEncoder = new AbiEncoder.Method(abi);
        const foobarSignature = foobarEncoder.getSignature();
        const foobarTxData = foobarEncoder.encode([testAddress]);
        // Decode tx data using contract name
        const decodedTxData = abiDecoder.decodeCalldataOrThrow(foobarTxData, contractName);
        const expectedFunctionName = abi.name;
        const expectedFunctionArguments = { testAddress };
        expect(decodedTxData.functionName).to.be.equal(expectedFunctionName);
        expect(decodedTxData.functionSignature).to.be.equal(foobarSignature);
        expect(decodedTxData.functionArguments).to.be.deep.equal(expectedFunctionArguments);
    });
});
