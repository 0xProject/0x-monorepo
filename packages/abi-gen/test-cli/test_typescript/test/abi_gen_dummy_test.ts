import { BlockchainLifecycle, devConstants, web3Factory } from '@0x/dev-utils';
import { Web3ProviderEngine } from '@0x/subproviders';
import { BigNumber, providerUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as ChaiBigNumber from 'chai-bignumber';
import * as dirtyChai from 'dirty-chai';

import { AbiGenDummyContract, artifacts, TestLibDummyContract } from '../src';

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
    before(async () => {
        providerUtils.startProviderEngine(provider);
        abiGenDummy = await AbiGenDummyContract.deployFrom0xArtifactAsync(artifacts.AbiGenDummy, provider, txDefaults);
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
            return expectContractCallFailedAsync(abiGenDummy.simpleRevert.callAsync(), 'SIMPLE_REVERT');
        });
    });
    describe('revertWithConstant', () => {
        it('should call revertWithConstant', async () => {
            return expectContractCallFailedAsync(abiGenDummy.revertWithConstant.callAsync(), 'REVERT_WITH_CONSTANT');
        });
    });
    describe('simpleRequire', () => {
        it('should call simpleRequire', async () => {
            return expectContractCallFailedAsync(abiGenDummy.simpleRequire.callAsync(), 'SIMPLE_REQUIRE');
        });
    });
    describe('requireWithConstant', () => {
        it('should call requireWithConstant', async () => {
            return expectContractCallFailedAsync(abiGenDummy.requireWithConstant.callAsync(), 'REQUIRE_WITH_CONSTANT');
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
        libDummy = await TestLibDummyContract.deployFrom0xArtifactAsync(artifacts.TestLibDummy, provider, txDefaults);
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

// HACK(xianny): copied from @0x/contracts-test-utils to avoid circular dependency
/**
 * Resolves if the the contract call fails with the given revert reason.
 * @param p a Promise resulting from a contract call
 * @param reason a specific revert reason
 * @returns a new Promise which will reject if the conditions are not met and
 * otherwise resolve with no value.
 */
function expectContractCallFailedAsync<T>(p: Promise<T>, reason: string): Chai.PromisedAssertion {
    const rejectionMessageRegex = new RegExp(`^VM Exception while processing transaction: revert ${reason}$`);
    return expect(p).to.be.rejectedWith(rejectionMessageRegex);
}
