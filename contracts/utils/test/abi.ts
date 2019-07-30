import { chaiSetup, provider, txDefaults, web3Wrapper } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';

import { artifacts, TestAbiContract } from '../src';

chaiSetup.configure();
const expect = chai.expect;

const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('TestAbi', () => {
    let testAbi: TestAbiContract;
    const runTestAsync = async (contractMethod: any, input: any, output: any) => {
        const transaction = contractMethod.getABIEncodedTransactionData(input);
        // try decoding transaction
        const decodedInput = contractMethod.getABIDecodedTransactionData(transaction);
        expect(decodedInput, 'decoded input').to.be.deep.equal(input);
        // execute transaction
        const rawOutput = await web3Wrapper.callAsync({
            to: testAbi.address,
            data: transaction,
        });
        // try decoding output
        const decodedOutput = contractMethod.getABIDecodedReturnData(rawOutput);
        expect(decodedOutput, 'decoded output').to.be.deep.equal(output);
    };
    before(async () => {
        testAbi = await TestAbiContract.deployFrom0xArtifactAsync(artifacts.TestAbi, provider, txDefaults, artifacts);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('Encoding/Decoding Transaction Data and Return Values', () => {
        it('should successfully encode/decode (no input / no output)', async () => {
            const input = undefined;
            const output = undefined;
            await runTestAsync(testAbi.noInputNoOutput, input, output);
        });
        it('should successfully encode/decode (no input / simple output)', async () => {
            const input = undefined;
            const output = new BigNumber(1991);
            await runTestAsync(testAbi.noInputSimpleOutput, input, output);
        });
        it('should successfully encode/decode (simple input / no output)', async () => {
            const input = new BigNumber(1991);
            const output = undefined;
            await runTestAsync(testAbi.simpleInputNoOutput, input, output);
        });
        it('should successfully encode/decode (simple input / simple output)', async () => {
            const input = new BigNumber(16);
            const output = new BigNumber(1991);
            await runTestAsync(testAbi.simpleInputSimpleOutput, input, output);
        });
        it('should successfully encode/decode (complex input / complex output)', async () => {
            const input = {
                foo: new BigNumber(1991),
                bar: '0x1234',
                car: 'zoom zoom',
            };
            const output = {
                input,
                lorem: '0x12345678',
                ipsum: '0x87654321',
                dolor: 'amet',
            };
            await runTestAsync(testAbi.complexInputComplexOutput, input, output);
        });
        it('should successfully encode/decode (multi-input / multi-output)', async () => {
            const input = [new BigNumber(1991), '0x1234', 'zoom zoom'];
            const output = ['0x12345678', '0x87654321', 'amet'];
            const transaction = testAbi.multiInputMultiOutput.getABIEncodedTransactionData(
                input[0] as BigNumber,
                input[1] as string,
                input[2] as string,
            );
            // try decoding transaction
            const decodedInput = testAbi.multiInputMultiOutput.getABIDecodedTransactionData(transaction);
            expect(decodedInput, 'decoded input').to.be.deep.equal(input);
            // execute transaction
            const rawOutput = await web3Wrapper.callAsync({
                to: testAbi.address,
                data: transaction,
            });
            // try decoding output
            const decodedOutput = testAbi.multiInputMultiOutput.getABIDecodedReturnData(rawOutput);
            expect(decodedOutput, 'decoded output').to.be.deep.equal(output);
        });
    });
});
