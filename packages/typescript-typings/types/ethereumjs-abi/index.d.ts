declare module 'ethereumjs-abi' {
    const soliditySHA3: (argTypes: string[], args: any[]) => Buffer;
    const soliditySHA256: (argTypes: string[], args: any[]) => Buffer;
    const methodID: (name: string, types: string[]) => Buffer;
}
