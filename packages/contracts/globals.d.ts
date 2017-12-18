declare module 'bn.js';
declare module 'ethereumjs-abi';
declare module 'chai-bignumber';
declare module 'dirty-chai';

// HACK: In order to merge the bignumber declaration added by chai-bignumber to the chai Assertion
// interface we must use `namespace` as the Chai definitelyTyped definition does. Since we otherwise
// disallow `namespace`, we disable tslint for the following.
/* tslint:disable */
declare namespace Chai {
    interface Assertion {
        bignumber: Assertion;
    }
}
/* tslint:enable */

declare module '*.json' {
    const json: any;
    /* tslint:disable */
    export default json;
    /* tslint:enable */
}

declare module 'solc' {
    export function compile(sources: any, optimizerEnabled: number, findImports: (importPath: string) => any): any;
    export function setupMethods(solcBin: any): any;
}

declare module 'web3-eth-abi' {
    export function encodeParameters(typesArray: string[], parameters: any[]): string;
}

// Truffle injects the following into the global scope
declare var artifacts: any;
declare var contract: any;
