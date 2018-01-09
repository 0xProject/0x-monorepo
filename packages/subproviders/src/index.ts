import {
    comm_node as LedgerNodeCommunication,
    comm_u2f as LedgerBrowserCommunication,
    eth as LedgerEthereumClientFn,
} from 'ledgerco';

import { LedgerEthereumClient } from './types';

export { InjectedWeb3Subprovider } from './subproviders/injected_web3';
export { RedundantRPCSubprovider } from './subproviders/redundant_rpc';
export { LedgerSubprovider } from './subproviders/ledger';
export { ECSignature, LedgerWalletSubprovider, LedgerCommunicationClient } from './types';

/**
 * A factory method for creating a LedgerEthereumClient usable in a browser context.
 * @return LedgerEthereumClient A browser client
 */
export async function ledgerEthereumBrowserClientFactoryAsync(): Promise<LedgerEthereumClient> {
    const ledgerConnection = await LedgerBrowserCommunication.create_async();
    const ledgerEthClient = new LedgerEthereumClientFn(ledgerConnection);
    return ledgerEthClient;
}

/**
 * A factory for creating a LedgerEthereumClient usable in a Node.js context.
 * @return LedgerEthereumClient A Node.js client
 */
export async function ledgerEthereumNodeJsClientFactoryAsync(): Promise<LedgerEthereumClient> {
    const ledgerConnection = await LedgerNodeCommunication.create_async();
    const ledgerEthClient = new LedgerEthereumClientFn(ledgerConnection);
    return ledgerEthClient;
}
