import { chaiSetup, expectContractCallFailedAsync, provider, txDefaults, web3Wrapper } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { RevertReason } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';

import { AbiGenDummyContract, artifacts, TestLibDummyContract } from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('AbiGenDummy Contract', () => {
    let abiGenDummy: AbiGenDummyContract;
    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        abiGenDummy = await AbiGenDummyContract.deployFrom0xArtifactAsync(artifacts.AbiGenDummy, provider, txDefaults);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('simplePureFunction', () => {
        it('should call simplePureFunction', async () => {
            const result = await abiGenDummy.simplePureFunction.callAsync();
            expect(result).bignumber.to.equal(new BigNumber(1));
        });
    });
    describe('simplePureFunctionWithInput', () => {
        it('should call simplePureFunctionWithInput', async () => {
            const result = await abiGenDummy.simplePureFunctionWithInput.callAsync(new BigNumber(5));
            expect(result).bignumber.to.equal(new BigNumber(6));
        });
    });
    describe('pureFunctionWithConstant', () => {
        it('should call pureFunctionWithConstant', async () => {
            const result = await abiGenDummy.pureFunctionWithConstant.callAsync();
            expect(result).bignumber.to.equal(new BigNumber(1234));
        });
    });
    describe('simpleRevert', () => {
        it('should call simpleRevert', async () => {
            return expectContractCallFailedAsync(abiGenDummy.simpleRevert.callAsync(), RevertReason.ValidatorError);
        });
    });
    describe('revertWithConstant', () => {
        it('should call revertWithConstant', async () => {
            return expectContractCallFailedAsync(
                abiGenDummy.revertWithConstant.callAsync(),
                RevertReason.ValidatorError,
            );
        });
    });
    describe('simpleRequire', () => {
        it('should call simpleRequire', async () => {
            return expectContractCallFailedAsync(abiGenDummy.simpleRequire.callAsync(), RevertReason.ValidatorError);
        });
    });
    describe('requireWithConstant', () => {
        it('should call requireWithConstant', async () => {
            return expectContractCallFailedAsync(
                abiGenDummy.requireWithConstant.callAsync(),
                RevertReason.ValidatorError,
            );
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
        expect(result).bignumber.to.equal(new BigNumber(2));
    });

    it('should call a library function referencing a constant', async () => {
        const result = await libDummy.publicAddConstant.callAsync(new BigNumber(1));
        expect(result).bignumber.to.equal(new BigNumber(1235));
    });
});
