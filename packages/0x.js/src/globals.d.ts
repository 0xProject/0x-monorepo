/// <reference types='chai-typescript-typings' />
/// <reference types='chai-as-promised-typescript-typings' />
declare module 'web3_beta';
declare module 'chai-bignumber';
declare module 'dirty-chai';
declare module 'request-promise-native';
declare module 'web3-provider-engine';
declare module 'web3-provider-engine/subproviders/rpc';

// HACK: In order to merge the bignumber declaration added by chai-bignumber to the chai Assertion
// interface we must use `namespace` as the Chai definitelyTyped definition does. Since we otherwise
// disallow `namespace`, we disable tslint for the following.
/* tslint:disable */
declare namespace Chai {
    interface Assertion {
        bignumber: Assertion;
        // HACK: In order to comply with chai-as-promised we make eventually a `PromisedAssertion` not an `Assertion`
        eventually: PromisedAssertion;
    }
}
/* tslint:enable */

declare module '*.json' {
    const json: any;
    /* tslint:disable */
    export default json;
    /* tslint:enable */
}

// find-version declarations
declare function findVersions(version: string): string[];
declare module 'find-versions' {
    export = findVersions;
}

// compare-version declarations
declare function compareVersions(firstVersion: string, secondVersion: string): number;
declare module 'compare-versions' {
    export = compareVersions;
}

declare module 'ethereumjs-abi' {
    const soliditySHA3: (argTypes: string[], args: any[]) => Buffer;
}

// truffle-hdwallet-provider declarations
declare module 'truffle-hdwallet-provider' {
    import * as Web3 from 'web3';
    class HDWalletProvider implements Web3.Provider {
        constructor(mnemonic: string, rpcUrl: string);
        public sendAsync(
            payload: Web3.JSONRPCRequestPayload,
            callback: (err: Error, result: Web3.JSONRPCResponsePayload) => void,
        ): void;
    }
    export = HDWalletProvider;
}

// abi-decoder declarations
interface DecodedLogArg {}
interface DecodedLog {
    name: string;
    events: DecodedLogArg[];
}
declare module 'abi-decoder' {
    import * as Web3 from 'web3';
    const addABI: (abi: Web3.AbiDefinition) => void;
    const decodeLogs: (logs: Web3.LogEntry[]) => DecodedLog[];
}

declare module 'web3/lib/solidity/coder' {
    const decodeParams: (types: string[], data: string) => any[];
}
