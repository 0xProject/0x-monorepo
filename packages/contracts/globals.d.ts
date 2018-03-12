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

declare module 'ethereumjs-abi' {
    const soliditySHA3: (argTypes: string[], args: any[]) => Buffer;
    const soliditySHA256: (argTypes: string[], args: any[]) => Buffer;
    const methodID: (name: string, types: string[]) => Buffer;
}
