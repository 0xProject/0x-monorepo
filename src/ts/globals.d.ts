declare type ETHAddressBuff = Buffer;

declare interface Schema {
    id: string;
}

declare module 'ethereumjs-util' {
    const toBuffer: (dataHex: string) => Buffer;
    const hashPersonalMessage: (msg: Buffer) => Buffer;
    const bufferToHex: (buff: Buffer) => string;
    const ecrecover: (msgHashBuff: Buffer, v: number, r: Buffer, s: Buffer) => string;
    const pubToAddress: (pubKey: string) => ETHAddressBuff;
    const isValidAddress: (address: string) => boolean;
}
