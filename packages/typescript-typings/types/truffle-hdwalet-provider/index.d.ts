declare module 'truffle-hdwallet-provider' {
    import { JSONRPCRequestPayload, JSONRPCResponsePayload } from '@0xproject/types';
    import * as Web3 from 'web3';
    class HDWalletProvider implements Web3.Provider {
        constructor(mnemonic: string, rpcUrl: string);
        public sendAsync(
            payload: JSONRPCRequestPayload,
            callback: (err: Error, result: JSONRPCResponsePayload) => void,
        ): void;
    }
    export = HDWalletProvider;
}
