declare module 'chai-bignumber';

declare type ETHPublicKey = string;
declare type ETHAddressHex = string;
declare type ETHAddressBuff = Buffer;

declare interface Schema {
    id: string;
}

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

declare module 'ethereumjs-util' {
    const toBuffer: (data: string) => Buffer;
    const hashPersonalMessage: (msg: Buffer) => Buffer;
    const bufferToHex: (buff: Buffer) => string;
    const ecrecover: (msgHashBuff: Buffer, v: number, r: Buffer, s: Buffer) => ETHPublicKey;
    const pubToAddress: (pubKey: ETHPublicKey) => ETHAddressBuff;
}
