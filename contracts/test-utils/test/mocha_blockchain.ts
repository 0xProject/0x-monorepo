import * as _ from 'lodash';
import * as process from 'process';

import { blockchainTests, constants, describe, expect } from '../src';

blockchainTests('mocha blockchain extensions', env => {
    describe('blockchainTests()', () => {
        it('passes a valid environment object', () => {
            expect(env.blockchainLifecycle).to.exist('');
            expect(env.provider).to.exist('');
            expect(env.txDefaults).to.exist('');
            expect(env.web3Wrapper).to.exist('');
            // HACK(dorothy-zbornak): tslint seems to get confused by these assertions.
            // tslint:disable: no-unbound-method
            expect(typeof env.getChainIdAsync).to.eq('function');
            expect(typeof env.getAccountAddressesAsync).to.eq('function');
            // tslint:enable: no-unbound-method
        });

        it('initializes the test environment', async () => {
            expect(await env.getChainIdAsync()).to.eq(constants.TESTRPC_CHAIN_ID);
            expect(await env.getAccountAddressesAsync()).to.be.not.empty('');
        });

        describe('modifiers', () => {
            blockchainTests.skip('skip', () => {
                it('does not execute this test', () => {
                    expect.fail();
                });
            });

            blockchainTests('only', () => {
                it.skip("can't test `only` :-(", () => {
                    // no-op.
                });
            });

            blockchainTests.optional('optional', () => {
                it('only runs this with `TEST_ALL` environment flag set', () => {
                    expect(process.env.TEST_ALL).to.be.ok('');
                });
            });

            blockchainTests.resets('resets', () => {
                const originalBlockhainLifecycle = env.blockchainLifecycle;
                const blockchainLifecycleCalls = [] as string[];

                before(() => {
                    // Replace `blockchainLifecycle` with a hooked version.
                    env.blockchainLifecycle = createHookedObject(
                        originalBlockhainLifecycle,
                        methodName => blockchainLifecycleCalls.push(methodName),
                        ['startAsync', 'revertAsync'],
                    );
                });

                after(() => {
                    // Undo the hook.
                    env.blockchainLifecycle = originalBlockhainLifecycle;
                });

                it('calls `blockchainLifecycle.startAsync()` before this test', () => {
                    expect(blockchainLifecycleCalls).to.eql(['startAsync']);
                });

                it('calls `blockchainLifecycle.revertAsync()` after the last test', () => {
                    expect(blockchainLifecycleCalls).to.eql(['startAsync', 'revertAsync', 'startAsync']);
                });
            });
        });

        blockchainTests('nested tests', nestedEnv => {
            it('shares the same environment object', () => {
                expect(nestedEnv).to.eq(env);
            });
        });

        describe('subtests', () => {
            require('./subtests/mocha_blockchain_1').append(env);
        });
    });

    describe('describe extensions', () => {
        describe('modifiers', () => {
            describe.optional('optional', () => {
                it('only runs this with `TEST_ALL` environment flag set', () => {
                    expect(process.env.TEST_ALL).to.be.ok('');
                });
            });
        });
    });
});

function createHookedObject(obj: any, handler: (name: string) => void, methods: string[]): any {
    const hookedMethods = _.map(methods, methodName => {
        // tslint:disable: only-arrow-functions
        return function(this: any, ...args: any[]): any {
            handler(methodName);
            return obj[methodName].call(this, ...args);
        };
    });
    return _.assign(_.clone(obj), _.zipObject(methods, hookedMethods));
}
