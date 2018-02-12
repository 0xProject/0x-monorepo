declare module 'solc' {
    // tslint:disable:completed-docs
    export function compile(sources: any, optimizerEnabled: number, findImports: (importPath: string) => any): any;
    export function setupMethods(solcBin: any): any;
    // tslint:enable:completed-docs
}

declare module 'web3-eth-abi' {
    // tslint:disable-next-line:completed-docs
    export function encodeParameters(typesArray: string[], parameters: any[]): string;
}
