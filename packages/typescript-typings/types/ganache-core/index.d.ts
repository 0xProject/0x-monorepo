declare module 'ganache-core' {
    import { Provider } from '@0xproject/types';
    export interface GanacheOpts {
        verbose?: boolean;
        logger?: {
            log(msg: string): void;
        };
        port?: number;
        network_id?: number;
        mnemonic?: string;
    }
    // tslint:disable-next-line:completed-docs
    export function provider(opts: GanacheOpts): Provider;
}
