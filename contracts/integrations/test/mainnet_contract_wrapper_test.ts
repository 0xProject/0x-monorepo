import { blockchainTests, expect } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';

import { TestContractWrapperContract } from './wrappers';

blockchainTests.live('Contract wrapper mainnet callAsync revert behavior tests', env => {
    // Mainnet address of the `TestContractWrapper` contract.
    const TEST_CONTRACT_ADDRESS = '0x3C120F51aa2360E6C7078dbc849591dd14F21405';
    const REVERT_STRING = 'ERROR';
    const VALID_RESULT = new BigNumber('0xf984f922a56ea9a20a32a32f0f60f2d216ff0c0a0d16c986a97a7f1897a6613b');
    let testContract: TestContractWrapperContract;

    before(async () => {
        testContract = new TestContractWrapperContract(TEST_CONTRACT_ADDRESS, env.provider, env.txDefaults);
    });

    describe('callAsync()', () => {
        it('can decode valid result', async () => {
            const result = await testContract.returnValid().callAsync();
            expect(result).to.bignumber.eq(VALID_RESULT);
        });

        it('can decode an empty result', async () => {
            const result = await testContract.returnEmpty().callAsync();
            expect(result).to.eq(undefined);
        });

        it('catches a string revert', async () => {
            const tx = testContract.throwStringRevert().callAsync();
            return expect(tx).to.revertWith(REVERT_STRING);
        });

        it('catches an empty revert', async () => {
            const tx = testContract.throwEmptyRevert().callAsync();
            return expect(tx).to.be.rejectedWith('reverted with no data');
        });

        it('catches invalid opcode', async () => {
            const tx = testContract.throwInvalidOpcode().callAsync();
            return expect(tx).to.be.rejectedWith('reverted with no data');
        });

        it('catches a forced empty result', async () => {
            const tx = testContract.returnForcedEmpty().callAsync();
            return expect(tx).to.be.rejectedWith('reverted with no data');
        });

        it('catches a truncated result', async () => {
            const tx = testContract.returnTruncated().callAsync();
            return expect(tx).to.be.rejectedWith('decode beyond the end of calldata');
        });
    });
});
