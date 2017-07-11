/// <reference types='chai-typescript-typings' />
/// <reference types='chai-as-promised-typescript-typings' />
declare module 'chai-bignumber';
declare module 'dirty-chai';
declare module 'bn.js';
declare module 'request-promise-native';
declare module 'web3-provider-engine';
declare module 'web3-provider-engine/subproviders/rpc';

// HACK: In order to merge the bignumber declaration added by chai-bignumber to the chai Assertion
// interface we must use `namespace` as the Chai definitelyTyped definition does. Since we otherwise
// disallow `namespace`, we disable tslint for the following.
/* tslint:disable */
declare namespace Chai {
    interface NumberComparer {
        (value: number|BigNumber.BigNumber, message?: string): Assertion;
    }
    interface NumericComparison {
        greaterThan: NumberComparer;
    }
    interface Assertion {
        bignumber: Assertion;
        // HACK: In order to comply with chai-as-promised we make eventually a `PromisedAssertion` not an `Assertion`
        eventually: PromisedAssertion;
    }
}
/* tslint:enable */

// jsonschema declarations
// Source: https://github.com/tdegrunt/jsonschema/blob/master/lib/index.d.ts
declare interface Schema {
    id?: string;
    $schema?: string;
    title?: string;
    description?: string;
    multipleOf?: number;
    maximum?: number;
    exclusiveMaximum?: boolean;
    minimum?: number;
    exclusiveMinimum?: boolean;
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    additionalItems?: boolean | Schema;
    items?: Schema | Schema[];
    maxItems?: number;
    minItems?: number;
    uniqueItems?: boolean;
    maxProperties?: number;
    minProperties?: number;
    required?: string[];
    additionalProperties?: boolean | Schema;
    definitions?: {
        [name: string]: Schema;
    };
    properties?: {
        [name: string]: Schema;
    };
    patternProperties?: {
        [name: string]: Schema;
    };
    dependencies?: {
        [name: string]: Schema | string[];
    };
    'enum'?: any[];
    type?: string | string[];
    allOf?: Schema[];
    anyOf?: Schema[];
    oneOf?: Schema[];
    not?: Schema;
    // This is the only property that's not defined in https://github.com/tdegrunt/jsonschema/blob/master/lib/index.d.ts
    // There is an open issue for that: https://github.com/tdegrunt/jsonschema/issues/194
    // There is also an opened PR: https://github.com/tdegrunt/jsonschema/pull/218/files
    // As soon as it gets merged we should be good to use types from 'jsonschema' package
    $ref?: string;
}

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
declare interface ContractInstance {
    address: string;
}
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

// es6-promisify declarations
declare function promisify(original: any, settings?: any): ((...arg: any[]) => Promise<any>);
declare module 'es6-promisify' {
    export = promisify;
}

declare module 'ethereumjs-abi' {
    const soliditySHA3: (argTypes: string[], args: any[]) => Buffer;
}

// truffle-hdwallet-provider declarations
declare class HDWalletProvider {
    constructor(mnemonic: string, rpcUrl: string);
}
declare module 'truffle-hdwallet-provider' {
    export = HDWalletProvider;
}
