// eth-lightwallet declarations
declare module 'eth-lightwallet' {
    import { ECSignatureBuffer } from '@0xproject/types';

    interface signing {
        signTx(keystore: keystore, pwDerivedKey: Uint8Array, rawTx: string, signingAddress: string): string;
        signMsg(
            keystore: keystore,
            pwDerivedKey: Uint8Array,
            rawMsg: string,
            signingAddress: string,
        ): ECSignatureBuffer;
        signMsgHash(
            keystore: keystore,
            pwDerivedKey: Uint8Array,
            msgHash: string,
            signingAddress: string,
        ): ECSignatureBuffer;
        concatSig(signature: any): string;
    }
    export const signing: signing;

    export class keystore {
        public static createVault(options: any, callback?: (error: Error, keystore: keystore) => void): keystore;
        public static generateRandomSeed(): string;
        public static isSeedValid(seed: string): boolean;
        public static deserialize(keystore: string): keystore;
        public serialize(): string;
        public keyFromPassword(
            password: string,
            callback?: (error: Error, pwDerivedKey: Uint8Array) => void,
        ): Uint8Array;
        public isDerivedKeyCorrect(pwDerivedKey: Uint8Array): boolean;
        public generateNewAddress(pwDerivedKey: Uint8Array, numberOfAddresses: number): void;
        public getSeed(pwDerivedKey: Uint8Array): string;
        public exportPrivateKey(address: string, pwDerivedKey: Uint8Array): string;
        public getAddresses(): string[];
    }
}
