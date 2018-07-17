declare module 'ethereumjs-util' {
    export function soliditySHA3(argTypes: string[], args: any[]): Buffer;
    export function soliditySHA256(argTypes: string[], args: any[]): Buffer;
    export function methodID(name: string, types: string[]): Buffer;
    export function simpleEncode(signature: string, ...args: any[]): Buffer;
    export function rawDecode(signature: string[], data: Buffer): any[];
}
