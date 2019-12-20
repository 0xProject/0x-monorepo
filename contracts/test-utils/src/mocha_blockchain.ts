import { BlockchainLifecycle, web3Factory } from '@0x/dev-utils';
import { RPCSubprovider, Web3ProviderEngine } from '@0x/subproviders';
import { providerUtils } from '@0x/utils';
import { TxData, Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';
import * as mocha from 'mocha';
import * as process from 'process';

import { provider, providerConfigs, txDefaults, web3Wrapper } from './web3_wrapper';

// tslint:disable: no-namespace only-arrow-functions no-unbound-method max-classes-per-file

export type ISuite = mocha.ISuite;
export type ISuiteCallbackContext = mocha.ISuiteCallbackContext;
export type SuiteCallback = (this: ISuiteCallbackContext) => void;
export type ContextDefinitionCallback<T> = (description: string, callback: SuiteCallback) => T;
export type BlockchainSuiteCallback = (this: ISuiteCallbackContext, env: BlockchainTestsEnvironment) => void;
export type BlockchainContextDefinitionCallback<T> = (description: string, callback: BlockchainSuiteCallback) => T;
export interface ContextDefinition extends mocha.IContextDefinition {
    optional: ContextDefinitionCallback<ISuite | void>;
}

/**
 * Interface for `blockchainTests()`.
 */
export interface BlockchainContextDefinition {
    (description: string, callback: BlockchainSuiteCallback): ISuite;
    only: BlockchainContextDefinitionCallback<ISuite>;
    skip: BlockchainContextDefinitionCallback<void>;
    optional: BlockchainContextDefinitionCallback<ISuite | void>;
    resets: BlockchainContextDefinitionCallback<ISuite | void> & {
        only: BlockchainContextDefinitionCallback<ISuite>;
        skip: BlockchainContextDefinitionCallback<void>;
        optional: BlockchainContextDefinitionCallback<ISuite | void>;
    };
    fork: BlockchainContextDefinitionCallback<ISuite | void> & {
        only: BlockchainContextDefinitionCallback<ISuite>;
        skip: BlockchainContextDefinitionCallback<void>;
        optional: BlockchainContextDefinitionCallback<ISuite | void>;
        resets: BlockchainContextDefinitionCallback<ISuite | void>;
    };
    live: BlockchainContextDefinitionCallback<ISuite | void> & {
        only: BlockchainContextDefinitionCallback<ISuite>;
        skip: BlockchainContextDefinitionCallback<void>;
        optional: BlockchainContextDefinitionCallback<ISuite | void>;
    };
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

class BlockchainTestsEnvironmentBase {
    public blockchainLifecycle!: BlockchainLifecycle;
    public provider!: Web3ProviderEngine;
    public txDefaults!: Partial<TxData>;
    public web3Wrapper!: Web3Wrapper;

    public async getChainIdAsync(): Promise<number> {
        return providerUtils.getChainIdAsync(this.provider);
    }

    public async getAccountAddressesAsync(): Promise<string[]> {
        return this.web3Wrapper.getAvailableAddressesAsync();
    }
}

interface BlockchainEnvironmentFactory {
    create(): BlockchainTestsEnvironment;
}

/**
 * `BlockchainTestsEnvironment` that uses the default ganache provider.
 */
export class StandardBlockchainTestsEnvironmentSingleton extends BlockchainTestsEnvironmentBase {
    private static _instance: StandardBlockchainTestsEnvironmentSingleton | undefined;

    // Create or retrieve the singleton instance of this class.
    public static create(): StandardBlockchainTestsEnvironmentSingleton {
        if (StandardBlockchainTestsEnvironmentSingleton._instance === undefined) {
            StandardBlockchainTestsEnvironmentSingleton._instance = new StandardBlockchainTestsEnvironmentSingleton();
        }
        return StandardBlockchainTestsEnvironmentSingleton._instance;
    }

    // Get the singleton instance of this class.
    public static getInstance(): StandardBlockchainTestsEnvironmentSingleton | undefined {
        return StandardBlockchainTestsEnvironmentSingleton._instance;
    }

    protected constructor() {
        super();
        this.blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
        this.provider = provider;
        this.txDefaults = txDefaults;
        this.web3Wrapper = web3Wrapper;
    }
}

/**
 * `BlockchainTestsEnvironment` that uses a forked ganache provider.
 */
export class ForkedBlockchainTestsEnvironmentSingleton extends BlockchainTestsEnvironmentBase {
    private static _instance: ForkedBlockchainTestsEnvironmentSingleton | undefined;

    // Create or retrieve the singleton instance of this class.
    public static create(): ForkedBlockchainTestsEnvironmentSingleton {
        if (ForkedBlockchainTestsEnvironmentSingleton._instance === undefined) {
            ForkedBlockchainTestsEnvironmentSingleton._instance = new ForkedBlockchainTestsEnvironmentSingleton();
        }
        return ForkedBlockchainTestsEnvironmentSingleton._instance;
    }

    protected static _createWeb3Provider(forkHost: string): Web3ProviderEngine {
        return web3Factory.getRpcProvider({
            ...providerConfigs,
            fork: forkHost,
            blockTime: 0,
            locked: false,
        });
    }

    // Get the singleton instance of this class.
    public static getInstance(): ForkedBlockchainTestsEnvironmentSingleton | undefined {
        return ForkedBlockchainTestsEnvironmentSingleton._instance;
    }

    protected constructor() {
        super();
        this.txDefaults = txDefaults;
        this.provider = process.env.FORK_RPC_URL
            ? ForkedBlockchainTestsEnvironmentSingleton._createWeb3Provider(process.env.FORK_RPC_URL)
            : // Create a dummy provider if no RPC backend supplied.
              createDummyProvider();
        this.web3Wrapper = new Web3Wrapper(this.provider);
        this.blockchainLifecycle = new BlockchainLifecycle(this.web3Wrapper);
    }
}

/**
 * `BlockchainTestsEnvironment` that uses a live web3 provider.
 */
export class LiveBlockchainTestsEnvironmentSingleton extends BlockchainTestsEnvironmentBase {
    private static _instance: LiveBlockchainTestsEnvironmentSingleton | undefined;

    // Create or retrieve the singleton instance of this class.
    public static create(): LiveBlockchainTestsEnvironmentSingleton {
        if (LiveBlockchainTestsEnvironmentSingleton._instance === undefined) {
            LiveBlockchainTestsEnvironmentSingleton._instance = new LiveBlockchainTestsEnvironmentSingleton();
        }
        return LiveBlockchainTestsEnvironmentSingleton._instance;
    }

    protected static _createWeb3Provider(rpcHost: string): Web3ProviderEngine {
        const providerEngine = new Web3ProviderEngine();
        providerEngine.addProvider(new RPCSubprovider(rpcHost));
        providerUtils.startProviderEngine(providerEngine);
        return providerEngine;
    }

    // Get the singleton instance of this class.
    public static getInstance(): LiveBlockchainTestsEnvironmentSingleton | undefined {
        return LiveBlockchainTestsEnvironmentSingleton._instance;
    }

    protected constructor() {
        super();
        this.txDefaults = txDefaults;
        this.provider = process.env.LIVE_RPC_URL
            ? LiveBlockchainTestsEnvironmentSingleton._createWeb3Provider(process.env.LIVE_RPC_URL)
            : // Create a dummy provider if no RPC backend supplied.
              createDummyProvider();
        this.web3Wrapper = new Web3Wrapper(this.provider);
        const snapshotHandlerAsync = async (): Promise<void> => {
            throw new Error('Snapshots are not supported with a live provider.');
        };
        this.blockchainLifecycle = {
            startAsync: snapshotHandlerAsync,
            revertAsync: snapshotHandlerAsync,
        } as any;
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
}) as ContextDefinition;

/**
 * Like mocha's `describe()`, but sets up a blockchain environment for you.
 */
export const blockchainTests: BlockchainContextDefinition = _.assign(
    function(description: string, callback: BlockchainSuiteCallback): ISuite {
        return defineBlockchainSuite(StandardBlockchainTestsEnvironmentSingleton, description, callback, describe);
    },
    {
        only(description: string, callback: BlockchainSuiteCallback): ISuite {
            return defineBlockchainSuite(
                StandardBlockchainTestsEnvironmentSingleton,
                description,
                callback,
                describe.only,
            );
        },
        skip(description: string, callback: BlockchainSuiteCallback): void {
            return defineBlockchainSuite(
                StandardBlockchainTestsEnvironmentSingleton,
                description,
                callback,
                describe.skip,
            );
        },
        optional(description: string, callback: BlockchainSuiteCallback): ISuite | void {
            return defineBlockchainSuite(
                StandardBlockchainTestsEnvironmentSingleton,
                description,
                callback,
                process.env.TEST_ALL ? describe : describe.skip,
            );
        },
        fork: _.assign(
            function(description: string, callback: BlockchainSuiteCallback): ISuite | void {
                return defineBlockchainSuite(
                    ForkedBlockchainTestsEnvironmentSingleton,
                    description,
                    callback,
                    process.env.FORK_RPC_URL ? describe : describe.skip,
                );
            },
            {
                only(description: string, callback: BlockchainSuiteCallback): ISuite | void {
                    return defineBlockchainSuite(
                        ForkedBlockchainTestsEnvironmentSingleton,
                        description,
                        callback,
                        process.env.FORK_RPC_URL ? describe.only : describe.skip,
                    );
                },
                skip(description: string, callback: BlockchainSuiteCallback): void {
                    return defineBlockchainSuite(
                        ForkedBlockchainTestsEnvironmentSingleton,
                        description,
                        callback,
                        describe.skip,
                    );
                },
                optional(description: string, callback: BlockchainSuiteCallback): ISuite | void {
                    return defineBlockchainSuite(
                        ForkedBlockchainTestsEnvironmentSingleton,
                        description,
                        callback,
                        process.env.FORK_RPC_URL ? describe.optional : describe.skip,
                    );
                },
                resets(description: string, callback: BlockchainSuiteCallback): ISuite | void {
                    return defineResetsBlockchainSuite(
                        ForkedBlockchainTestsEnvironmentSingleton,
                        description,
                        callback,
                        process.env.FORK_RPC_URL ? describe : describe.skip,
                    );
                },
            },
        ),
        live: _.assign(
            function(description: string, callback: BlockchainSuiteCallback): ISuite | void {
                return defineBlockchainSuite(
                    LiveBlockchainTestsEnvironmentSingleton,
                    description,
                    callback,
                    process.env.LIVE_RPC_URL ? describe : describe.skip,
                );
            },
            {
                only(description: string, callback: BlockchainSuiteCallback): ISuite | void {
                    return defineBlockchainSuite(
                        LiveBlockchainTestsEnvironmentSingleton,
                        description,
                        callback,
                        process.env.LIVE_RPC_URL ? describe.only : describe.skip,
                    );
                },
                skip(description: string, callback: BlockchainSuiteCallback): void {
                    return defineBlockchainSuite(
                        LiveBlockchainTestsEnvironmentSingleton,
                        description,
                        callback,
                        describe.skip,
                    );
                },
                optional(description: string, callback: BlockchainSuiteCallback): ISuite | void {
                    return defineBlockchainSuite(
                        LiveBlockchainTestsEnvironmentSingleton,
                        description,
                        callback,
                        process.env.LIVE_RPC_URL ? describe.optional : describe.skip,
                    );
                },
            },
        ),
        resets: _.assign(
            function(description: string, callback: BlockchainSuiteCallback): ISuite {
                return defineResetsBlockchainSuite(
                    StandardBlockchainTestsEnvironmentSingleton,
                    description,
                    callback,
                    describe,
                );
            },
            {
                only(description: string, callback: BlockchainSuiteCallback): ISuite {
                    return defineResetsBlockchainSuite(
                        StandardBlockchainTestsEnvironmentSingleton,
                        description,
                        callback,
                        describe.only,
                    );
                },
                skip(description: string, callback: BlockchainSuiteCallback): void {
                    return defineResetsBlockchainSuite(
                        StandardBlockchainTestsEnvironmentSingleton,
                        description,
                        callback,
                        describe.skip,
                    );
                },
                optional(description: string, callback: BlockchainSuiteCallback): ISuite | void {
                    return defineResetsBlockchainSuite(
                        StandardBlockchainTestsEnvironmentSingleton,
                        description,
                        callback,
                        describe.optional,
                    );
                },
            },
        ),
    },
) as BlockchainContextDefinition;

function defineBlockchainSuite<T>(
    envFactory: BlockchainEnvironmentFactory,
    description: string,
    callback: BlockchainSuiteCallback,
    describeCall: ContextDefinitionCallback<T>,
): T {
    return describeCall(description, function(this: ISuiteCallbackContext): void {
        callback.call(this, envFactory.create());
    });
}

function defineResetsBlockchainSuite<T>(
    envFactory: BlockchainEnvironmentFactory,
    description: string,
    callback: BlockchainSuiteCallback,
    describeCall: ContextDefinitionCallback<T>,
): T {
    return describeCall(description, function(this: ISuiteCallbackContext): void {
        const env = envFactory.create();
        beforeEach(async () => env.blockchainLifecycle.startAsync());
        afterEach(async () => env.blockchainLifecycle.revertAsync());
        callback.call(this, env);
    });
}

function createDummyProvider(): Web3ProviderEngine {
    return {
        addProvider: _.noop,
        on: _.noop,
        send: _.noop,
        sendAsync: _.noop,
        start: _.noop,
        stop: _.noop,
    };
}
