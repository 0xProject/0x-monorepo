declare module 'ganache-core' {
    const GanacheProvider = require('ethereum-types').GanacheProvider;
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
    }
    export function provider(opts: GanacheOpts): GanacheProvider;
}
