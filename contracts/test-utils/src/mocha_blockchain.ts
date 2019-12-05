import { BlockchainLifecycle } from '@0x/dev-utils';
import { Web3ProviderEngine } from '@0x/subproviders';
import { providerUtils } from '@0x/utils';
import { TxData, Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';
import * as mocha from 'mocha';
import * as process from 'process';

import { provider, txDefaults, web3Wrapper } from './web3_wrapper';

// tslint:disable: no-namespace only-arrow-functions no-unbound-method

export type ISuite = mocha.ISuite;
export type ISuiteCallbackContext = mocha.ISuiteCallbackContext;
export type SuiteCallback = (this: ISuiteCallbackContext) => void;
export type ContextDefinitionCallback<T> = (description: string, callback: SuiteCallback) => T;
export type BlockchainSuiteCallback = (this: ISuiteCallbackContext, env: BlockchainTestsEnvironment) => void;
export type BlockchainContextDefinitionCallback<T> = (description: string, callback: BlockchainSuiteCallback) => T;
export interface ContextDefinition extends mocha.IContextDefinition {
    optional: ContextDefinitionCallback<ISuite | void>;
    fork: ContextDefinitionCallback<ISuite | void>;
}

/**
 * Interface for `blockchainTests()`.
 */
export interface BlockchainContextDefinition extends BlockchainContextDefinitionPartial {
    resets: BlockchainContextDefinitionPartial;
}

interface BlockchainContextDefinitionPartial {
    only: BlockchainContextDefinitionCallback<ISuite>;
    skip: BlockchainContextDefinitionCallback<void>;
    optional: BlockchainContextDefinitionCallback<ISuite | void>;
    fork: BlockchainContextDefinitionCallback<ISuite | void>;
    (description: string, callback: BlockchainSuiteCallback): ISuite;
}

/**
 * Describes the environment object passed into the `blockchainTests()` callback.
 */
export interface BlockchainTestsEnvironment {
    blockchainLifecycle: BlockchainLifecycle;
    provider: Web3ProviderEngine;
    txDefaults: Partial<TxData>;
    web3Wrapper: Web3Wrapper;
    getChainIdAsync(): Promise<number>;
    getAccountAddressesAsync(): Promise<string[]>;
}

/**
 * Concret implementation of `BlockchainTestsEnvironment`.
 */
export class BlockchainTestsEnvironmentSingleton {
    private static _instance: BlockchainTestsEnvironmentSingleton | undefined;

    public blockchainLifecycle: BlockchainLifecycle;
    public provider: Web3ProviderEngine;
    public txDefaults: Partial<TxData>;
    public web3Wrapper: Web3Wrapper;

    // Create or retrieve the singleton instance of this class.
    public static create(): BlockchainTestsEnvironmentSingleton {
        if (BlockchainTestsEnvironmentSingleton._instance === undefined) {
            BlockchainTestsEnvironmentSingleton._instance = new BlockchainTestsEnvironmentSingleton();
        }
        return BlockchainTestsEnvironmentSingleton._instance;
    }

    // Get the singleton instance of this class.
    public static getInstance(): BlockchainTestsEnvironmentSingleton | undefined {
        return BlockchainTestsEnvironmentSingleton._instance;
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

// The original `describe()` global provided by mocha.
const mochaDescribe = (global as any).describe as mocha.IContextDefinition;

/**
 * An augmented version of mocha's `describe()`.
 */
export const describe = _.assign(mochaDescribe, {
    optional(description: string, callback: SuiteCallback): ISuite | void {
        const describeCall = process.env.TEST_ALL ? mochaDescribe : mochaDescribe.skip;
        return describeCall(description, callback);
    },
    fork(description: string, callback: SuiteCallback): ISuite | void {
        const describeCall = process.env.FORK_RPC_URL ? mochaDescribe.only : mochaDescribe.skip;
        return describeCall(description, callback);
    },
}) as ContextDefinition;

/**
 * Like mocha's `describe()`, but sets up a blockchain environment on first call.
 */
export const blockchainTests: BlockchainContextDefinition = _.assign(
    function(description: string, callback: BlockchainSuiteCallback): ISuite {
        return defineBlockchainSuite(description, callback, describe);
    },
    {
        only(description: string, callback: BlockchainSuiteCallback): ISuite {
            return defineBlockchainSuite(description, callback, describe.only);
        },
        skip(description: string, callback: BlockchainSuiteCallback): void {
            return defineBlockchainSuite(description, callback, describe.skip);
        },
        optional(description: string, callback: BlockchainSuiteCallback): ISuite | void {
            return defineBlockchainSuite(description, callback, process.env.TEST_ALL ? describe : describe.skip);
        },
        fork(description: string, callback: BlockchainSuiteCallback): ISuite | void {
            return defineBlockchainSuite(
                description,
                callback,
                process.env.FORK_RPC_URL ? describe.only : describe.skip,
            );
        },
        resets: _.assign(
            function(description: string, callback: BlockchainSuiteCallback): ISuite {
                return defineBlockchainSuite(description, callback, function(
                    _description: string,
                    _callback: SuiteCallback,
                ): ISuite {
                    return defineResetsSuite(_description, _callback, describe);
                });
            },
            {
                only(description: string, callback: BlockchainSuiteCallback): ISuite {
                    return defineBlockchainSuite(description, callback, function(
                        _description: string,
                        _callback: SuiteCallback,
                    ): ISuite {
                        return defineResetsSuite(_description, _callback, describe.only);
                    });
                },
                skip(description: string, callback: BlockchainSuiteCallback): void {
                    return defineBlockchainSuite(description, callback, function(
                        _description: string,
                        _callback: SuiteCallback,
                    ): void {
                        return defineResetsSuite(_description, _callback, describe.skip);
                    });
                },
                optional(description: string, callback: BlockchainSuiteCallback): ISuite | void {
                    return defineBlockchainSuite(description, callback, function(
                        _description: string,
                        _callback: SuiteCallback,
                    ): ISuite | void {
                        return defineResetsSuite(_description, _callback, describe.optional);
                    });
                },
                fork(description: string, callback: BlockchainSuiteCallback): ISuite | void {
                    return defineBlockchainSuite(description, callback, function(
                        _description: string,
                        _callback: SuiteCallback,
                    ): ISuite | void {
                        return defineResetsSuite(_description, _callback, describe.fork);
                    });
                },
            },
        ),
    },
) as BlockchainContextDefinition;

function defineBlockchainSuite<T>(
    description: string,
    callback: BlockchainSuiteCallback,
    describeCall: ContextDefinitionCallback<T>,
): T {
    const env = BlockchainTestsEnvironmentSingleton.create();
    return describeCall(description, function(this: ISuiteCallbackContext): void {
        before(async () => env.blockchainLifecycle.startAsync());
        after(async () => env.blockchainLifecycle.revertAsync());
        callback.call(this, env);
    });
}

function defineResetsSuite<T>(
    description: string,
    callback: SuiteCallback,
    describeCall: ContextDefinitionCallback<T>,
): T {
    return describeCall(description, function(this: ISuiteCallbackContext): void {
        const env = BlockchainTestsEnvironmentSingleton.getInstance();
        if (env !== undefined) {
            beforeEach(async () => env.blockchainLifecycle.startAsync());
            afterEach(async () => env.blockchainLifecycle.revertAsync());
        }
        callback.call(this);
    });
}
