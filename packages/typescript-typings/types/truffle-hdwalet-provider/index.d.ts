declare module 'truffle-hdwallet-provider' {
    import { JSONRPCRequestPayload, JSONRPCResponsePayload, Provider } from '@0xproject/types';
    class HDWalletProvider implements Provider {
        constructor(mnemonic: string, rpcUrl: string);
        public sendAsync(
            payload: JSONRPCRequestPayload,
            callback: (err: Error, result: JSONRPCResponsePayload) => void,
        ): void;
    }
    export = HDWalletProvider;
}
