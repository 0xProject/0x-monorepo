declare module 'web3-provider-engine' {
    class Web3ProviderEngine {
        public on(event: string, handler: () => void): void;
        public send(payload: any): void;
        public sendAsync(payload: any, callback: (error: any, response: any) => void): void;
        public addProvider(provider: any): void;
        public start(): void;
        public stop(): void;
    }
    export = Web3ProviderEngine;
}
