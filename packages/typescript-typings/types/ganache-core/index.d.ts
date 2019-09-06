declare module 'ganache-core' {
    import EthereumTypes = require('ethereum-types');
    export interface GanacheOpts {
        verbose?: boolean;
        logger?: {
            log(msg: string): void;
        };
        port?: number;
        network_id?: number;
        networkId?: number;
        mnemonic?: string;
        gasLimit?: number;
        vmErrorsOnRPCResponse?: boolean;
        db_path?: string;
        total_accounts?: number;
    }
    export function provider(opts: GanacheOpts): EthereumTypes.Provider;
}
