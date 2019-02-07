import * as chai from 'chai';
import { MethodAbi } from 'ethereum-types';
import 'mocha';

import { chaiSetup } from './utils/chai_setup';
import { AbiEncoder, TransactionDecoder } from '../src';

chaiSetup.configure();
const expect = chai.expect;

describe('TransactionDecoder', () => {
    it('should successfully add a new ABI and decode tx data for it', async () => {
        // Add new ABI
        const abi: MethodAbi = {
            name: 'foobar',
            type: 'function',
            inputs: [
                {
                    name: 'addr',
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
        const contractAddress = '0x0001020304050607080900010203040506070809';
        const networkId = 1;
        const contractInfo = [
            {
                contractAddress,
                networkId,
            },
        ];
        const transactionDecoder = new TransactionDecoder();
        transactionDecoder.addABI([abi], contractName, contractInfo);
        // Create some tx data
        const foobarEncoder = new AbiEncoder.Method(abi);
        const foobarSignature = foobarEncoder.getSignature();
        const foobarTxData = foobarEncoder.encode([contractAddress]);
        // Decode tx data using contract name
        const decodedTxData = transactionDecoder.decode(foobarTxData, { contractName });
        const expectedFunctionName = abi.name;
        const expectedFunctionArguments = {
            addr: contractAddress,
        };
        expect(decodedTxData.functionName).to.be.equal(expectedFunctionName);
        expect(decodedTxData.functionSignature).to.be.equal(foobarSignature);
        expect(decodedTxData.functionArguments).to.be.deep.equal(expectedFunctionArguments);
        // Decode tx data using contract address
        const decodedTxDataDecodedWithAddress = transactionDecoder.decode(foobarTxData, { contractAddress });
        expect(decodedTxDataDecodedWithAddress).to.be.deep.equal(decodedTxData);
    });
});
