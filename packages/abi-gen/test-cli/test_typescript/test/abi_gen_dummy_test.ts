import { BlockchainLifecycle, devConstants, web3Factory } from '@0x/dev-utils';
import { Web3ProviderEngine } from '@0x/subproviders';
import { BigNumber, providerUtils, StringRevertError } from '@0x/utils';
import { BlockParamLiteral, Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as ChaiBigNumber from 'chai-bignumber';
import * as dirtyChai from 'dirty-chai';
import * as Sinon from 'sinon';

import {
    AbiGenDummyContract,
    AbiGenDummyEvents,
    AbiGenDummyWithdrawalEventArgs,
    artifacts,
    TestLibDummyContract,
} from '../src';

const txDefaults = {
    from: devConstants.TESTRPC_FIRST_ADDRESS,
    gas: devConstants.GAS_LIMIT,
};

const provider: Web3ProviderEngine = web3Factory.getRpcProvider({ shouldUseInProcessGanache: true });
const web3Wrapper = new Web3Wrapper(provider);

chai.config.includeStack = true;
chai.use(ChaiBigNumber());
chai.use(dirtyChai);
chai.use(chaiAsPromised);
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('AbiGenDummy Contract', () => {
    let abiGenDummy: AbiGenDummyContract;
    const runTestAsync = async (contractMethod: any, input: any, output: any) => {
        const transaction = contractMethod.getABIEncodedTransactionData(input);
        // try decoding transaction
        const decodedInput = contractMethod.getABIDecodedTransactionData(transaction);
        expect(decodedInput, 'decoded input').to.be.deep.equal(input);
        // execute transaction
        const rawOutput = await web3Wrapper.callAsync({
            to: abiGenDummy.address,
            data: transaction,
        });
        // try decoding output
        const decodedOutput = contractMethod.getABIDecodedReturnData(rawOutput);
        expect(decodedOutput, 'decoded output').to.be.deep.equal(output);
    };
    before(async () => {
        providerUtils.startProviderEngine(provider);
        abiGenDummy = await AbiGenDummyContract.deployFrom0xArtifactAsync(
            artifacts.AbiGenDummy,
            provider,
            txDefaults,
            artifacts,
        );
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('simplePureFunction', () => {
        it('should call simplePureFunction', async () => {
            const result = await abiGenDummy.simplePureFunction.callAsync();
            expect(result).to.deep.equal(new BigNumber(1));
        });
    });
    describe('simplePureFunctionWithInput', () => {
        it('should call simplePureFunctionWithInput', async () => {
            const result = await abiGenDummy.simplePureFunctionWithInput.callAsync(new BigNumber(5));
            expect(result).to.deep.equal(new BigNumber(6));
        });
    });
    describe('pureFunctionWithConstant', () => {
        it('should call pureFunctionWithConstant', async () => {
            const result = await abiGenDummy.pureFunctionWithConstant.callAsync();
            expect(result).to.deep.equal(new BigNumber(1234));
        });
    });
    describe('simpleRevert', () => {
        it('should call simpleRevert', async () => {
            expect(abiGenDummy.simpleRevert.callAsync())
                .to.eventually.be.rejectedWith(StringRevertError)
                .and.deep.equal(new StringRevertError('SIMPLE_REVERT'));
        });
    });
    describe('revertWithConstant', () => {
        it('should call revertWithConstant', async () => {
            expect(abiGenDummy.revertWithConstant.callAsync())
                .to.eventually.be.rejectedWith(StringRevertError)
                .and.deep.equal(new StringRevertError('REVERT_WITH_CONSTANT'));
        });
    });
    describe('simpleRequire', () => {
        it('should call simpleRequire', async () => {
            expect(abiGenDummy.simpleRequire.callAsync())
                .to.eventually.be.rejectedWith(StringRevertError)
                .and.deep.equal(new StringRevertError('SIMPLE_REQUIRE'));
        });
    });
    describe('requireWithConstant', () => {
        it('should call requireWithConstant', async () => {
            expect(abiGenDummy.requireWithConstant.callAsync())
                .to.eventually.be.rejectedWith(StringRevertError)
                .and.deep.equal(new StringRevertError('REQUIRE_WITH_CONSTANT'));
        });
    });

    describe('struct handling', () => {
        const sampleStruct = {
            aDynamicArrayOfBytes: ['0x3078313233', '0x3078333231'],
            anInteger: new BigNumber(5),
            aString: 'abc',
            someBytes: '0x3078313233',
        };
        it('should be able to handle struct output', async () => {
            const result = await abiGenDummy.structOutput.callAsync();
            expect(result).to.deep.equal(sampleStruct);
        });
    });

    describe('ecrecoverFn', () => {
        it('should implement ecrecover', async () => {
            const signerAddress = devConstants.TESTRPC_FIRST_ADDRESS;
            const message = '0x6927e990021d23b1eb7b8789f6a6feaf98fe104bb0cf8259421b79f9a34222b0';
            const signature = await web3Wrapper.signMessageAsync(signerAddress, message);

            // tslint:disable:custom-no-magic-numbers
            const r = `0x${signature.slice(2, 66)}`;
            const s = `0x${signature.slice(66, 130)}`;
            const v = signature.slice(130, 132);
            const v_decimal = parseInt(v, 16) + 27; // v: (0 or 1) => (27 or 28)
            // tslint:enable:custom-no-magic-numbers

            const result = await abiGenDummy.ecrecoverFn.callAsync(message, v_decimal, r, s);
            expect(result).to.equal(signerAddress);
        });
    });

    describe('validate and send transaction', () => {
        it('should call validateAndSendTransactionAsync', async () => {
            const txHash = await abiGenDummy.nonPureMethod.validateAndSendTransactionAsync();
            const hexRegex = /^0x[a-fA-F0-9]+$/;
            expect(txHash.match(hexRegex)).to.deep.equal([txHash]);
        });
    });

    describe('event subscription', () => {
        const indexFilterValues = {};
        const emptyCallback = () => {}; // tslint:disable-line:no-empty
        let stubs: Sinon.SinonStub[] = [];

        afterEach(() => {
            stubs.forEach(s => s.restore());
            stubs = [];
        });
        it('should return a subscription token', done => {
            const subscriptionToken = abiGenDummy.subscribe(
                AbiGenDummyEvents.Withdrawal,
                indexFilterValues,
                emptyCallback,
            );
            expect(subscriptionToken).to.be.a('string');
            done();
        });
        it('should allow unsubscribeAll to be called successfully after an error', done => {
            abiGenDummy.subscribe(AbiGenDummyEvents.Withdrawal, indexFilterValues, emptyCallback);
            stubs.push(
                Sinon.stub((abiGenDummy as any)._web3Wrapper, 'getBlockIfExistsAsync').throws(
                    new Error('JSON RPC error'),
                ),
            );
            abiGenDummy.unsubscribeAll();
            done();
        });
    });

    describe('getLogsAsync', () => {
        const blockRange = {
            fromBlock: 0,
            toBlock: BlockParamLiteral.Latest,
        };
        it('should get logs with decoded args emitted by EventWithStruct', async () => {
            await abiGenDummy.emitSimpleEvent.awaitTransactionSuccessAsync();
            const eventName = AbiGenDummyEvents.SimpleEvent;
            const indexFilterValues = {};
            const logs = await abiGenDummy.getLogsAsync(eventName, blockRange, indexFilterValues);
            expect(logs).to.have.length(1);
            expect(logs[0].event).to.be.equal(eventName);
        });
        it('should only get the logs with the correct event name', async () => {
            await abiGenDummy.emitSimpleEvent.awaitTransactionSuccessAsync();
            const differentEventName = AbiGenDummyEvents.Withdrawal;
            const indexFilterValues = {};
            const logs = await abiGenDummy.getLogsAsync(differentEventName, blockRange, indexFilterValues);
            expect(logs).to.have.length(0);
        });
        it('should only get the logs with the correct indexed fields', async () => {
            const [addressOne, addressTwo] = await web3Wrapper.getAvailableAddressesAsync();
            await abiGenDummy.withdraw.awaitTransactionSuccessAsync(new BigNumber(1), { from: addressOne });
            await abiGenDummy.withdraw.awaitTransactionSuccessAsync(new BigNumber(1), { from: addressTwo });
            const eventName = AbiGenDummyEvents.Withdrawal;
            const indexFilterValues = {
                _owner: addressOne,
            };
            const logs = await abiGenDummy.getLogsAsync<AbiGenDummyWithdrawalEventArgs>(
                eventName,
                blockRange,
                indexFilterValues,
            );
            expect(logs).to.have.length(1);
            const args = logs[0].args;
            expect(args._owner).to.be.equal(addressOne);
        });
    });

    describe('withAddressInput', () => {
        it('should normalize address inputs to lowercase', async () => {
            const xAddress = devConstants.TESTRPC_FIRST_ADDRESS.toUpperCase();
            const yAddress = devConstants.TESTRPC_FIRST_ADDRESS;
            const a = new BigNumber(1);
            const b = new BigNumber(2);
            const c = new BigNumber(3);
            const output = await abiGenDummy.withAddressInput.callAsync(xAddress, a, b, yAddress, c);

            expect(output).to.equal(xAddress.toLowerCase());
        });
    });

    describe('Encoding/Decoding Transaction Data and Return Values', () => {
        it('should successfully encode/decode (no input / no output)', async () => {
            const input = undefined;
            const output = undefined;
            await runTestAsync(abiGenDummy.noInputNoOutput, input, output);
        });
        it('should successfully encode/decode (no input / simple output)', async () => {
            const input = undefined;
            const output = new BigNumber(1991);
            await runTestAsync(abiGenDummy.noInputSimpleOutput, input, output);
        });
        it('should successfully encode/decode (simple input / no output)', async () => {
            const input = new BigNumber(1991);
            const output = undefined;
            await runTestAsync(abiGenDummy.simpleInputNoOutput, input, output);
        });
        it('should successfully encode/decode (simple input / simple output)', async () => {
            const input = new BigNumber(16);
            const output = new BigNumber(1991);
            await runTestAsync(abiGenDummy.simpleInputSimpleOutput, input, output);
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
            await runTestAsync(abiGenDummy.complexInputComplexOutput, input, output);
        });
        it('should successfully encode/decode (multi-input / multi-output)', async () => {
            const input = [new BigNumber(1991), '0x1234', 'zoom zoom'];
            const output = ['0x12345678', '0x87654321', 'amet'];
            const transaction = abiGenDummy.multiInputMultiOutput.getABIEncodedTransactionData(
                input[0] as BigNumber,
                input[1] as string,
                input[2] as string,
            );
            // try decoding transaction
            const decodedInput = abiGenDummy.multiInputMultiOutput.getABIDecodedTransactionData(transaction);
            expect(decodedInput, 'decoded input').to.be.deep.equal(input);
            // execute transaction
            const rawOutput = await web3Wrapper.callAsync({
                to: abiGenDummy.address,
                data: transaction,
            });
            // try decoding output
            const decodedOutput = abiGenDummy.multiInputMultiOutput.getABIDecodedReturnData(rawOutput);
            expect(decodedOutput, 'decoded output').to.be.deep.equal(output);
        });
    });
});

describe('Lib dummy contract', () => {
    let libDummy: TestLibDummyContract;
    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        libDummy = await TestLibDummyContract.deployFrom0xArtifactAsync(
            artifacts.TestLibDummy,
            provider,
            txDefaults,
            artifacts,
        );
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    it('should call a library function', async () => {
        const result = await libDummy.publicAddOne.callAsync(new BigNumber(1));
        expect(result).to.deep.equal(new BigNumber(2));
    });

    it('should call a library function referencing a constant', async () => {
        const result = await libDummy.publicAddConstant.callAsync(new BigNumber(1));
        expect(result).to.deep.equal(new BigNumber(1235));
    });
});
