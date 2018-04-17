declare module 'hdkey' {
    class HDNode {
        public static fromMasterSeed(seed: Buffer): HDNode;
        public publicKey: Buffer;
        public privateKey: Buffer;
        public chainCode: Buffer;
        public constructor();
        public derive(path: string): HDNode;
    }
    export = HDNode;
}
