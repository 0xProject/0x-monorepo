declare module 'bn.js' {
    import { Buffer } from 'buffer';

    type Endianness = 'le' | 'be';

    class BN {
        constructor(num: number | string | number[] | Buffer, base?: number, endian?: Endianness);
        public clone(): BN;
        public toString(base?: number, length?: number): string;
        public toNumber(): number;
        public toJSON(): string;
        public toArray(endian?: Endianness, length?: number): number[];
        public toBuffer(endian?: Endianness, length?: number): Buffer;
        public bitLength(): number;
        public zeroBits(): number;
        public byteLength(): number;
        public isNeg(): boolean;
        public isEven(): boolean;
        public isOdd(): boolean;
        public isZero(): boolean;
        public cmp(b: any): number;
        public lt(b: any): boolean;
        public lte(b: any): boolean;
        public gt(b: any): boolean;
        public gte(b: any): boolean;
        public eq(b: any): boolean;
        public isBN(b: any): boolean;

        public neg(): BN;
        public abs(): BN;
        public add(b: BN): BN;
        public sub(b: BN): BN;
        public mul(b: BN): BN;
        public sqr(): BN;
        public pow(b: BN): BN;
        public div(b: BN): BN;
        public mod(b: BN): BN;
        public divRound(b: BN): BN;

        public or(b: BN): BN;
        public and(b: BN): BN;
        public xor(b: BN): BN;
        public setn(b: number): BN;
        public shln(b: number): BN;
        public shrn(b: number): BN;
        public testn(b: number): boolean;
        public maskn(b: number): BN;
        public bincn(b: number): BN;
        public notn(w: number): BN;

        public gcd(b: BN): BN;
        public egcd(b: BN): { a: BN; b: BN; gcd: BN };
        public invm(b: BN): BN;
    }

    export = BN;
}
