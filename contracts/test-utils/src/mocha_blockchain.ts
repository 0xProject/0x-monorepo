import { BlockchainLifecycle } from '@0x/dev-utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';
import * as mocha from 'mocha';

import { web3Wrapper } from './web3_wrapper';

// tslint:disable: no-namespace only-arrow-functions no-unbound-method
declare global {
    export namespace Mocha {
        export interface BlockchainSuiteState {
            web3Wrapper: Web3Wrapper;
            blockchainLifecycle: BlockchainLifecycle;
        }

        type BlockchainSuiteCallback = (this: ISuiteCallbackContext, state: BlockchainSuiteState) => void;
        type SuiteCallback = (this: ISuiteCallbackContext) => void;
        type BlockchainContextDefinitionCallback<T> = (description: string, callback: BlockchainSuiteCallback) => T;
        type ContextDefinitionCallback<T> = (description: string, callback: SuiteCallback) => T;

        interface BlockchainContextDefinition {
            reset: {
                only: BlockchainContextDefinitionCallback<ISuite>;
                skip: BlockchainContextDefinitionCallback<void>;
                (description: string, callback: BlockchainSuiteCallback): ISuite;
            };
            only: BlockchainContextDefinitionCallback<ISuite>;
            skip: BlockchainContextDefinitionCallback<void>;
            (description: string, callback: BlockchainSuiteCallback): ISuite;
        }
    }
}

// Singleton instance.
let blockchainLifecycle: BlockchainLifecycle | undefined;

function defineBlockchainSuite<T>(
    description: string,
    callback: Mocha.BlockchainSuiteCallback,
    describeCall: Mocha.ContextDefinitionCallback<T>,
): T {
    init();
    return describeCall(
        description,
        function(this: mocha.ISuiteCallbackContext): void {
            callback.call(
                this,
                { web3Wrapper, blockchainLifecycle },
            );
        },
    );
}

function defineResetSuite<T>(
    description: string,
    callback: Mocha.SuiteCallback,
    describeCall: Mocha.ContextDefinitionCallback<T>,
): T {
    return describeCall(
        description,
        function(this: mocha.ISuiteCallbackContext): void {
            if (blockchainLifecycle !== undefined) {
                const _blockchainLifecycle = blockchainLifecycle;
                beforeEach(async () => {
                    return _blockchainLifecycle.startAsync();
                });
                afterEach(async () => {
                    return _blockchainLifecycle.revertAsync();
                });
            }
            callback.call(this);
        },
    );
}

function init(): void {
    if (blockchainLifecycle !== undefined) {
        return;
    }
    // Create the BlockchainLifecycle instance.
    blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
}

/**
 * Like mocha's `describe()`, but sets up a BlockchainLifecycle and Web3Wrapper.
 */
export const blockchainTests: Mocha.BlockchainContextDefinition = _.assign(
    function(description: string, callback: Mocha.BlockchainSuiteCallback): Mocha.ISuite {
        return defineBlockchainSuite(description, callback, describe);
    },
    {
        only(description: string, callback: Mocha.BlockchainSuiteCallback): Mocha.ISuite {
            return defineBlockchainSuite(description, callback, describe.only);
        },
        skip(description: string, callback: Mocha.BlockchainSuiteCallback): void {
            return defineBlockchainSuite(description, callback, describe.skip);
        },
        reset: _.assign(
            function(description: string, callback: Mocha.BlockchainSuiteCallback): Mocha.ISuite {
                return defineBlockchainSuite(
                    description,
                    callback,
                    function(_description: string, _callback: Mocha.SuiteCallback): Mocha.ISuite {
                        return defineResetSuite(_description, _callback, describe);
                    },
                );
            },
            {
                only(description: string, callback: Mocha.BlockchainSuiteCallback): Mocha.ISuite {
                    return defineBlockchainSuite(
                        description,
                        callback,
                        function(_description: string, _callback: Mocha.SuiteCallback): Mocha.ISuite {
                            return defineResetSuite(_description, _callback, describe.only);
                        },
                    );
                },
                skip(description: string, callback: Mocha.BlockchainSuiteCallback): void {
                    return defineBlockchainSuite(
                        description,
                        callback,
                        function(_description: string, _callback: Mocha.SuiteCallback): void {
                            return defineResetSuite(_description, _callback, describe.skip);
                        },
                    );
                },
            },
        ),
    },
) as Mocha.BlockchainContextDefinition;
