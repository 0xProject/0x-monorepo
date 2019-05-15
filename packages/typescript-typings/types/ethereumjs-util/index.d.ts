declare module 'ethereumjs-util' {
    import BN = require('bn.js');

    interface Signature {
        v: number;
        r: Buffer;
        s: Buffer;
    }

    export const MAX_INTEGER: BN;

    export const TWO_POW256: BN;

    export const SHA3_NULL_S: string;

    export const SHA3_NULL: Buffer;

    export const SHA3_RLP_ARRAY_S: string;

    export const SHA3_RLP_ARRAY: Buffer;

    export const SHA3_RLP_S: string;

    export const SHA3_RLP: Buffer;

    export function zeros(bytes: number): Buffer;

    export function setLength(msg: Buffer | string | number, length: number, right: boolean): Buffer;
    export function setLength(msg: number[], length: number, right: boolean): number[];

    export function setLengthLeft(msg: Buffer | string | number, length: number, right?: boolean): Buffer;
    export function setLengthLeft(msg: number[], length: number, right?: boolean): number[];

    export function setLengthRight(msg: Buffer | string | number, length: number): Buffer;
    export function setLengthRight(msg: number[], length: number): number[];

    export function unpad(a: Buffer): Buffer;
    export function unpad(a: number[]): number[];
    export function unpad(a: string): string;

    export function toBuffer(v: any): Buffer;

    export function bufferToInt(buf: Buffer): number;

    export function bufferToHex(buf: Buffer): string;

    export function fromSigned(num: Buffer): BN;

    export function toUnsigned(num: BN): Buffer;

    export function sha3(a: Buffer | string | number | number[], bits?: number): Buffer;

    export function sha256(a: Buffer | string | number | number[]): Buffer;

    export function ripemd160(a: Buffer | string | number | number[], padded?: boolean): Buffer;

    export function rlphash(a: Buffer | string | number | number[]): Buffer;

    export function isValidPrivate(privateKey: Buffer): boolean;

    export function isValidPublic(publicKey: Buffer, sanitize?: boolean): boolean;

    export function pubToAddress(publicKey: Buffer, sanitize?: boolean): Buffer;
    export function publicToAddress(publicKey: Buffer, sanitize?: boolean): Buffer;

    export function privateToPublic(privateKey: Buffer): Buffer;

    export function importPublic(publicKey: Buffer): Buffer;

    export function ecsign(message: Buffer, privateKey: Buffer): Signature;

    export function hashPersonalMessage(message: Buffer | string): Buffer;

    export function ecrecover(msgHash: Buffer, v: number, r: Buffer, s: Buffer): Buffer;

    export function toRpcSig(v: number, r: Buffer, s: Buffer): string;

    export function fromRpcSig(sig: string): Signature;

    export function privateToAddress(privateKey: Buffer): Buffer;

    export function isValidAddress(address: string): boolean;

    export function toChecksumAddress(address: string): string;

    export function isValidChecksumAddress(address: string): boolean;

    export function generateAddress(from: Buffer | string, nonce: number | string | number[] | Buffer): Buffer;

    export function isPrecompiled(address: Buffer | string): boolean;

    export function addHexPrefix(str: string): string;

    export function stripHexPrefix(str: string): string;

    export function isValidSignature(v: number, r: Buffer | string, s: Buffer | string, homestead?: boolean): boolean;

    export function baToJSON(ba: Buffer): string;
    export function baToJSON(ba: any[]): string[];
}
