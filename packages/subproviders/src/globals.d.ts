declare module 'dirty-chai';
declare module 'es6-promisify';

// tslint:disable:max-classes-per-file
// tslint:disable:class-name
// tslint:disable:async-suffix
// tslint:disable:completed-docs

// Ethereumjs-tx declarations
declare module 'ethereumjs-tx' {
    class EthereumTx {
        public raw: Buffer[];
        public r: Buffer;
        public s: Buffer;
        public v: Buffer;
        public nonce: Buffer;
        public serialize(): Buffer;
        public getSenderAddress(): Buffer;
        constructor(txParams: any);
    }
    export = EthereumTx;
}

// Ledgerco declarations
interface ECSignatureString {
    v: string;
    r: string;
    s: string;
}
interface ECSignature {
    v: number;
    r: string;
    s: string;
}

interface LedgerTransport {
    close(): Promise<void>;
}

declare module '@ledgerhq/hw-app-eth' {
    class Eth {
        public transport: LedgerTransport;
        constructor(transport: LedgerTransport);
        public getAddress(
            path: string,
            boolDisplay?: boolean,
            boolChaincode?: boolean,
        ): Promise<{ publicKey: string; address: string; chainCode: string }>;
        public signTransaction(path: string, rawTxHex: string): Promise<ECSignatureString>;
        public getAppConfiguration(): Promise<{ arbitraryDataEnabled: number; version: string }>;
        public signPersonalMessage(path: string, messageHex: string): Promise<ECSignature>;
    }
    export default Eth;
}

declare module '@ledgerhq/hw-transport-u2f' {
    export default class TransportU2F implements LedgerTransport {
        public static create(): Promise<LedgerTransport>;
        public close(): Promise<void>;
    }
}

declare module '@ledgerhq/hw-transport-node-hid' {
    export default class TransportNodeHid implements LedgerTransport {
        public static create(): Promise<LedgerTransport>;
        public close(): Promise<void>;
    }
}

// web3-provider-engine declarations
declare module 'web3-provider-engine/subproviders/subprovider' {
    class Subprovider {}
    export = Subprovider;
}
declare module 'web3-provider-engine/subproviders/rpc' {
    import * as Web3 from 'web3';
    class RpcSubprovider {
        constructor(options: { rpcUrl: string });
        public handleRequest(
            payload: Web3.JSONRPCRequestPayload,
            next: () => void,
            end: (err: Error | null, data?: any) => void,
        ): void;
    }
    export = RpcSubprovider;
}
declare module 'web3-provider-engine' {
    class Web3ProviderEngine {
        public on(event: string, handler: () => void): void;
        public send(payload: any): void;
        public sendAsync(payload: any, callback: (error: any, response: any) => void): void;
        public addProvider(provider: any): void;
        public start(): void;
        public stop(): void;
    }
    export = Web3ProviderEngine;
}
declare module 'web3-provider-engine/util/rpc-cache-utils' {
    class ProviderEngineRpcUtils {
        public static blockTagForPayload(payload: any): string | null;
    }
    export = ProviderEngineRpcUtils;
}
declare module 'web3-provider-engine/subproviders/fixture' {
    import * as Web3 from 'web3';
    class FixtureSubprovider {
        constructor(staticResponses: any);
        public handleRequest(
            payload: Web3.JSONRPCRequestPayload,
            next: () => void,
            end: (err: Error | null, data?: any) => void,
        ): void;
    }
    export = FixtureSubprovider;
}

// hdkey declarations
declare module 'hdkey' {
    class HDNode {
        public publicKey: Buffer;
        public chainCode: Buffer;
        public constructor();
        public derive(path: string): HDNode;
    }
    export = HDNode;
}

declare module '*.json' {
    const json: any;
    /* tslint:disable */
    export default json;
    /* tslint:enable */
}

// ganache-core declarations
declare module 'ganache-core' {
    import * as Web3 from 'web3';
    export interface GanacheOpts {
        verbose: boolean;
        logger: {
            log(msg: string): void;
        };
        port: number;
        networkId: number;
        mnemonic: string;
    }
    // tslint:disable-next-line:completed-docs
    export function provider(opts: GanacheOpts): Web3.Provider;
}
