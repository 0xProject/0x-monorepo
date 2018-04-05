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

declare module 'web3-provider-engine/subproviders/nonce-tracker';
declare module 'web3-provider-engine/subproviders/hooked-wallet';
declare module 'web3-provider-engine/subproviders/filters';
// web3-provider-engine declarations
declare module 'web3-provider-engine/subproviders/subprovider' {
    class Subprovider {}
    export = Subprovider;
}
declare module 'web3-provider-engine/subproviders/rpc' {
    import { JSONRPCRequestPayload } from '@0xproject/types';
    class RpcSubprovider {
        constructor(options: { rpcUrl: string });
        public handleRequest(
            payload: JSONRPCRequestPayload,
            next: () => void,
            end: (err: Error | null, data?: any) => void,
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
    import { JSONRPCRequestPayload } from '@0xproject/types';
    class FixtureSubprovider {
        constructor(staticResponses: any);
        public handleRequest(
            payload: JSONRPCRequestPayload,
            next: () => void,
            end: (err: Error | null, data?: any) => void,
        ): void;
    }
    export = FixtureSubprovider;
}
