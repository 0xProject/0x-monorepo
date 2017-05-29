declare module 'chai-bignumber';
declare module 'bn.js';
declare module 'request-promise-native';
declare module 'web3-provider-engine';
declare module 'web3-provider-engine/subproviders/rpc';
declare module 'find-versions';
declare module 'compare-versions';

declare interface Schema {
    id: string;
}

// HACK: In order to merge the bignumber declaration added by chai-bignumber to the chai Assertion
// interface we must use `namespace` as the Chai definitelyTyped definition does. Since we otherwise
// disallow `namespace`, we disable tslint for the following.
/* tslint:disable */
declare namespace Chai {
    interface Assertion {
        bignumber: Assertion;
        eventually: Assertion;
    }
}
/* tslint:enable */

declare module '*.json' {
    const json: any;
    /* tslint:disable */
    export default json;
    /* tslint:enable */
}

declare module 'ethereumjs-util' {
    const toBuffer: (dataHex: string) => Buffer;
    const hashPersonalMessage: (msg: Buffer) => Buffer;
    const bufferToHex: (buff: Buffer) => string;
    const ecrecover: (msgHashBuff: Buffer, v: number, r: Buffer, s: Buffer) => string;
    const pubToAddress: (pubKey: string) => Buffer;
    const isValidAddress: (address: string) => boolean;
    const bufferToInt: (buffer: Buffer) => number;
    const fromRpcSig: (signature: string) => {v: number, r: Buffer, s: Buffer};
}

// truffle-contract declarations
declare interface ContractInstance {}
declare interface ContractFactory {
    setProvider: (providerObj: any) => void;
    deployed: () => ContractInstance;
    at: (address: string) => ContractInstance;
}
declare interface Artifact {
    networks: {[networkId: number]: any};
}
declare function contract(artifacts: Artifact): ContractFactory;
declare module 'truffle-contract' {
    export = contract;
}

// es6-promisify declarations
declare function promisify(original: any, settings?: any): ((...arg: any[]) => Promise<any>);
declare module 'es6-promisify' {
    export = promisify;
}

declare module 'ethereumjs-abi' {
    const soliditySHA3: (argTypes: string[], args: any[]) => Buffer;
}
