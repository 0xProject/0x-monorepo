declare module 'solc' {
    export function compile(sources: any, optimizerEnabled: number, findImports: (importPath: string) => any): any;
    export function setupMethods(solcBin: any): any;
}

declare module 'web3-eth-abi' {
    export function encodeParameters(typesArray: string[], parameters: any[]): string;
}
