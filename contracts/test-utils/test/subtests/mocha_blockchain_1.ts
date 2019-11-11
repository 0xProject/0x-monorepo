import { expect } from '../../src/chai_setup';
import { blockchainTests, BlockchainTestsEnvironment } from '../../src/mocha_blockchain';

// tslint:disable: no-default-export completed-docs
export function append(env: BlockchainTestsEnvironment): void {
    blockchainTests('imported subtests', subtestsEnv => {
        it('shares the same environment object', () => {
            expect(subtestsEnv).to.eq(env);
        });
    });
}
