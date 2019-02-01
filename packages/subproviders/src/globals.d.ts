declare module '*.json' {
    const json: any;
    /* tslint:disable */
    export default json;
    /* tslint:enable */
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
