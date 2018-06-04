// tslint:disable:max-classes-per-file
// tslint:disable:class-name
// tslint:disable:async-suffix
// tslint:disable:completed-docs

// Ethereumjs-tx declarations

// Ledgerco declarations
interface ECSignatureString {
    v: string;
    r: string;
    s: string;
}
interface ECSignature {
    v: number;
    r: string;
    s: string;
}
interface ECSignatureBuffer {
    v: number;
    r: Buffer;
    s: Buffer;
}

interface LedgerTransport {
    close(): Promise<void>;
}

declare module '@ledgerhq/hw-app-eth' {
    class Eth {
        public transport: LedgerTransport;
        constructor(transport: LedgerTransport);
        public getAddress(
            path: string,
            boolDisplay?: boolean,
            boolChaincode?: boolean,
        ): Promise<{ publicKey: string; address: string; chainCode: string }>;
        public signTransaction(path: string, rawTxHex: string): Promise<ECSignatureString>;
        public getAppConfiguration(): Promise<{ arbitraryDataEnabled: number; version: string }>;
        public signPersonalMessage(path: string, messageHex: string): Promise<ECSignature>;
    }
    export default Eth;
}

declare module '@ledgerhq/hw-transport-u2f' {
    export default class TransportU2F implements LedgerTransport {
        public static create(): Promise<LedgerTransport>;
        public close(): Promise<void>;
    }
}

declare module '@ledgerhq/hw-transport-node-hid' {
    export default class TransportNodeHid implements LedgerTransport {
        public static create(): Promise<LedgerTransport>;
        public close(): Promise<void>;
    }
}

declare module '*.json' {
    const json: any;
    /* tslint:disable */
    export default json;
    /* tslint:enable */
}

// eth-lightwallet declarations
declare module 'eth-lightwallet' {
    export class signing {
      public static signTx(keystore: keystore, pwDerivedKey: Uint8Array, rawTx: string, signingAddress: string): string;
      public static signMsg(keystore: keystore, pwDerivedKey: Uint8Array, rawMsg: string, signingAddress: string): ECSignatureBuffer;
      public static signMsgHash(keystore: keystore, pwDerivedKey: Uint8Array, msgHash: string, signingAddress: string): ECSignatureBuffer;
      public static concatSig(signature: any): string;
    }
    export class keystore {
        public static createVault(options: any, callback?: (error: Error, keystore: keystore) => void): keystore;
        public static generateRandomSeed(): string;
        public static isSeedValid(seed: string): boolean;
        public static deserialize(keystore: string): keystore;
        public serialize(): string;
        public keyFromPassword(password: string, callback?: (error: Error, pwDerivedKey: Uint8Array) => void): Uint8Array;
        public isDerivedKeyCorrect(pwDerivedKey: Uint8Array): boolean;
        public generateNewAddress(pwDerivedKey: Uint8Array, numberOfAddresses: number): void;
        public getSeed(pwDerivedKey: Uint8Array): string;
        public exportPrivateKey(address: string, pwDerivedKey: Uint8Array): string;
        public getAddresses(): string[];
    }
}
