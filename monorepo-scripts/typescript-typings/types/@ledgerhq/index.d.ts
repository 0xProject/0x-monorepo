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
