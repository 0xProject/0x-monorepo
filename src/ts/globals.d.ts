declare module 'chai-bignumber';

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
    const toBuffer: (dataHex: string) => Buffer;
    const hashPersonalMessage: (msg: Buffer) => Buffer;
    const bufferToHex: (buff: Buffer) => string;
    const ecrecover: (msgHashBuff: Buffer, v: number, r: Buffer, s: Buffer) => string;
    const pubToAddress: (pubKey: string) => Buffer;
    const isValidAddress: (address: string) => boolean;
}
