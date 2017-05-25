declare type ETHPublicKey = string;
declare type ETHAddressHex = string;
declare type HexString = string;
declare type ETHAddressBuff = Buffer;

declare module 'ethereumjs-util' {
    const toBuffer: (data: HexString) => Buffer;
    const hashPersonalMessage: (msg: Buffer) => Buffer;
    const bufferToHex: (buff: Buffer) => HexString;
    const ecrecover: (msgHashBuff: Buffer, v: number, r: Buffer, s: Buffer) => ETHPublicKey;
    const pubToAddress: (pubKey: ETHPublicKey) => ETHAddressBuff;
}
