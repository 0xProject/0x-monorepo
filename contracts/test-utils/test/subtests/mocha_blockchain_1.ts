import { blockchainTests, BlockchainTestsEnvironment, expect } from '../../src';

// tslint:disable: no-default-export completed-docs
export function append(env: BlockchainTestsEnvironment): void {
    blockchainTests('imported subtests', subtestsEnv => {
        it('shares the same environment object', () => {
            expect(subtestsEnv).to.eq(env);
        });
    });
}
