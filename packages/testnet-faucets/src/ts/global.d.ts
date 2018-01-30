declare module 'rollbar';
declare module 'web3-provider-engine';
declare module 'web3-provider-engine/subproviders/rpc';
declare module 'web3-provider-engine/subproviders/nonce-tracker';
declare module 'web3-provider-engine/subproviders/hooked-wallet';

declare module '*.json' {
    const json: any;
    /* tslint:disable */
    export default json;
    /* tslint:enable */
}

// Ethereumjs-tx declarations
declare module 'ethereumjs-tx' {
    class EthereumTx {
        public raw: Buffer[];
        public r: Buffer;
        public s: Buffer;
        public v: Buffer;
        public serialize(): Buffer;
        public sign(buffer: Buffer): void;
        constructor(txParams: any);
    }
    export = EthereumTx;
}

// Define extra params on Request for parameter extraction in middleware
/* tslint:disable */
declare namespace Express {
    export interface Request {
        recipientAddress: string;
        networkId: string;
    }
}
/* tslint:enable */
