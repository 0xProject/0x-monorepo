/// <reference types='chai-typescript-typings' />
/// <reference types='chai-as-promised-typescript-typings' />
declare module 'bn.js';
declare module 'dirty-chai';
declare module 'ledgerco';
declare module 'ethereumjs-tx';
declare module 'es6-promisify';
declare module 'ethereum-address';
declare module 'debug';

// tslint:disable:max-classes-per-file
// tslint:disable:class-name
// tslint:disable:completed-docs
declare module 'ledgerco' {
    interface comm {
        close_async: Promise<void>;
        create_async: Promise<void>;
    }
    export class comm_node implements comm {
        public create_async: Promise<void>;
        public close_async: Promise<void>;
    }
    export class comm_u2f implements comm {
        public create_async: Promise<void>;
        public close_async: Promise<void>;
    }
}

// Semaphore-async-await declarations
declare module 'semaphore-async-await' {
    class Semaphore {
        constructor(permits: number);
        public wait(): void;
        public signal(): void;
    }
    export default Semaphore;
}

// web3-provider-engine declarations
declare module 'web3-provider-engine/subproviders/subprovider' {
    class Subprovider {}
    export = Subprovider;
}
declare module 'web3-provider-engine/subproviders/rpc' {
    import * as Web3 from 'web3';
    class RpcSubprovider {
        constructor(options: {rpcUrl: string});
        public handleRequest(
            payload: Web3.JSONRPCRequestPayload, next: () => void, end: (err: Error|null, data?: any) =>  void,
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
// tslint:enable:max-classes-per-file
// tslint:enable:class-name
// tslint:enable:completed-docs
