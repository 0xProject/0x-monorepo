declare module 'ethereumjs-tx' {
    class EthereumTx {
        public raw: Buffer[];
        public r: Buffer;
        public s: Buffer;
        public v: Buffer;
        public nonce: Buffer;
        public serialize(): Buffer;
        public sign(buffer: Buffer): void;
        public getSenderAddress(): Buffer;
        constructor(txParams: any);
    }
    export = EthereumTx;
}
