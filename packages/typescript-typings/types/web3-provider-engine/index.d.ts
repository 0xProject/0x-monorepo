declare module 'web3-provider-engine' {
    import { Provider, JSONRPCRequestPayload, JSONRPCResponsePayload } from 'ethereum-types';
    interface Web3ProviderEngineOptions {
        pollingInterval?: number;
        blockTracker?: any;
        blockTrackerProvider?: any;
    }
    class Web3ProviderEngine implements Provider {
        constructor(options?: Web3ProviderEngineOptions);
        public on(event: string, handler: () => void): void;
        public send(payload: JSONRPCRequestPayload): void;
        public sendAsync(
            payload: JSONRPCRequestPayload,
            callback: (error: null | Error, response: JSONRPCResponsePayload) => void,
        ): void;
        public addProvider(provider: any): void;
        // start block polling
        public start(callback?: () => void): void;
        // stop block polling
        public stop(): void;
    }
    export = Web3ProviderEngine;
}

declare module 'web3-provider-engine/subproviders/nonce-tracker';
declare module 'web3-provider-engine/subproviders/hooked-wallet';
declare module 'web3-provider-engine/subproviders/filters';
// web3-provider-engine declarations
declare module 'web3-provider-engine/subproviders/subprovider' {
    class Subprovider {}
    export = Subprovider;
}
declare module 'web3-provider-engine/subproviders/rpc' {
    import { JSONRPCRequestPayload, JSONRPCResponsePayload } from 'ethereum-types';
    class RpcSubprovider {
        constructor(options: { rpcUrl: string });
        public handleRequest(
            payload: JSONRPCRequestPayload,
            next: () => void,
            end: (err: Error | null, data?: JSONRPCResponsePayload) => void,
        ): void;
    }
    export = RpcSubprovider;
}
declare module 'web3-provider-engine/util/rpc-cache-utils' {
    class ProviderEngineRpcUtils {
        public static blockTagForPayload(payload: any): string | null;
    }
    export = ProviderEngineRpcUtils;
}
declare module 'web3-provider-engine/subproviders/fixture' {
    import { JSONRPCRequestPayload, JSONRPCResponsePayload } from 'ethereum-types';
    class FixtureSubprovider {
        constructor(staticResponses: any);
        public handleRequest(
            payload: JSONRPCRequestPayload,
            next: () => void,
            end: (err: Error | null, data?: JSONRPCResponsePayload) => void,
        ): void;
    }
    export = FixtureSubprovider;
}
