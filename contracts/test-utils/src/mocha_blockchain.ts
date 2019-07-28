import { BlockchainLifecycle } from '@0x/dev-utils';
import { Web3ProviderEngine } from '@0x/subproviders';
import { providerUtils } from '@0x/utils';
import { TxData, Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';
// Import ambient declarations (and clobber Jest).
import 'mocha';

import { provider, txDefaults, web3Wrapper } from './web3_wrapper';

// tslint:disable: no-namespace only-arrow-functions no-unbound-method

// Extend Mocha ambient definitions.
declare global {
    export namespace Mocha {
        type BlockchainSuiteCallback = (this: ISuiteCallbackContext, env: BlockchainTestsEnvironment) => void;
        type SuiteCallback = (this: ISuiteCallbackContext) => void;
        type BlockchainContextDefinitionCallback<T> = (description: string, callback: BlockchainSuiteCallback) => T;
        type ContextDefinitionCallback<T> = (description: string, callback: SuiteCallback) => T;

        interface BlockchainContextDefinition {
            resets: {
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

/**
 * Describes the test environment prepared by `blockchainTests()`.
 */
export class BlockchainTestsEnvironment {
    private static _instance: BlockchainTestsEnvironment | undefined;

    public blockchainLifecycle: BlockchainLifecycle;
    public provider: Web3ProviderEngine;
    public txDefaults: Partial<TxData>;
    public web3Wrapper: Web3Wrapper;

    // Create or retrieve the singleton instance of this class.
    public static create(): BlockchainTestsEnvironment {
        if (BlockchainTestsEnvironment._instance === undefined) {
            BlockchainTestsEnvironment._instance = new BlockchainTestsEnvironment();
        }
        return BlockchainTestsEnvironment._instance;
    }

    // Get the singleton instance of this class.
    public static getInstance(): BlockchainTestsEnvironment | undefined {
        return BlockchainTestsEnvironment._instance;
    }

    public async getChainIdAsync(): Promise<number> {
        return providerUtils.getChainIdAsync(this.provider);
    }

    public async getAccountAddressesAsync(): Promise<string[]> {
        return this.web3Wrapper.getAvailableAddressesAsync();
    }

    protected constructor() {
        this.blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
        this.provider = provider;
        this.txDefaults = txDefaults;
        this.web3Wrapper = web3Wrapper;
    }
}

function defineBlockchainSuite<T>(
    description: string,
    callback: Mocha.BlockchainSuiteCallback,
    describeCall: Mocha.ContextDefinitionCallback<T>,
): T {
    return describeCall(
        description,
        function(this: Mocha.ISuiteCallbackContext): void {
            callback.call(
                this,
                BlockchainTestsEnvironment.create(),
            );
        },
    );
}

function defineResetsSuite<T>(
    description: string,
    callback: Mocha.SuiteCallback,
    describeCall: Mocha.ContextDefinitionCallback<T>,
): T {
    return describeCall(
        description,
        function(this: Mocha.ISuiteCallbackContext): void {
            const env = BlockchainTestsEnvironment.getInstance();
            if (env !== undefined) {
                const _blockchainLifecycle = env.blockchainLifecycle;
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
        resets: _.assign(
            function(description: string, callback: Mocha.BlockchainSuiteCallback): Mocha.ISuite {
                return defineBlockchainSuite(
                    description,
                    callback,
                    function(_description: string, _callback: Mocha.SuiteCallback): Mocha.ISuite {
                        return defineResetsSuite(_description, _callback, describe);
                    },
                );
            },
            {
                only(description: string, callback: Mocha.BlockchainSuiteCallback): Mocha.ISuite {
                    return defineBlockchainSuite(
                        description,
                        callback,
                        function(_description: string, _callback: Mocha.SuiteCallback): Mocha.ISuite {
                            return defineResetsSuite(_description, _callback, describe.only);
                        },
                    );
                },
                skip(description: string, callback: Mocha.BlockchainSuiteCallback): void {
                    return defineBlockchainSuite(
                        description,
                        callback,
                        function(_description: string, _callback: Mocha.SuiteCallback): void {
                            return defineResetsSuite(_description, _callback, describe.skip);
                        },
                    );
                },
            },
        ),
    },
) as Mocha.BlockchainContextDefinition;
