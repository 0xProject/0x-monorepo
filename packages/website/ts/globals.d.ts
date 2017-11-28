declare module 'react-tooltip';
declare module 'react-router-hash-link';
declare module 'es6-promisify';
declare module 'truffle-contract';
declare module 'ethereumjs-util';
declare module 'keccak';
declare module 'web3-provider-engine';
declare module 'whatwg-fetch';
declare module 'react-html5video';
declare module 'web3-provider-engine/subproviders/filters';
declare module 'thenby';
declare module 'react-highlight';
declare module 'react-recaptcha';
declare module 'react-document-title';
declare module 'ledgerco';
declare module 'ethereumjs-tx';

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

// semver-sort declarations
declare module 'semver-sort' {
    const desc: (versions: string[]) => string[];
}

// xml-js declarations
declare interface XML2JSONOpts {
    compact?: boolean;
    spaces?: number;
}
declare module 'xml-js' {
    const xml2json: (xml: string, opts: XML2JSONOpts) => string;
}

// This will be defined by default in TS 2.4
// Source: https://github.com/Microsoft/TypeScript/issues/12364
interface System {
    import<T>(module: string): Promise<T>;
}
declare var System: System;

// ethereum-address declarations
declare module 'ethereum-address' {
    export const isAddress: (address: string) => boolean;
}

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

// blockies declarations
declare interface BlockiesIcon {
    toDataURL(): string;
}
declare interface BlockiesConfig {
    seed: string;
}
declare function blockies(config: BlockiesConfig): BlockiesIcon;
declare module 'blockies' {
    export = blockies;
}

// is-mobile declarations
declare function isMobile(): boolean;
declare module 'is-mobile' {
    export = isMobile;
}

// web3-provider-engine declarations
declare class Subprovider {}
declare module 'web3-provider-engine/subproviders/subprovider' {
    export = Subprovider;
}

// tslint:disable-next-line:max-classes-per-file
declare class RpcSubprovider {
    constructor(options: {rpcUrl: string});
    public handleRequest(payload: any, next: any, end: (err?: Error, data?: any) =>  void): void;
}
declare module 'web3-provider-engine/subproviders/rpc' {
    export = RpcSubprovider;
}
// tslint:disable-next-line:max-classes-per-file
declare class HookedWalletSubprovider {
    constructor(wallet: any);
}
declare module 'web3-provider-engine/subproviders/hooked-wallet' {
    export = HookedWalletSubprovider;
}

declare interface Artifact {
    abi: any;
    networks: {
        [networkId: number]: {
            address: string;
        };
    };
}
