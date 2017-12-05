import {
    comm_node as LedgerNodeCommunication,
    comm_u2f as LedgerBrowserCommunication,
    eth as LedgerEthereumClientFn,
} from 'ledgerco';

import {LedgerEthereumClient} from './types';

export {InjectedWeb3Subprovider} from './subproviders/injected_web3';
export {RedundantRPCSubprovider} from './subproviders/redundant_rpc';
export {
    LedgerSubprovider,
} from './subproviders/ledger';
export {
    ECSignature,
    LedgerWalletSubprovider,
    LedgerCommunicationClient,
} from './types';

export async function ledgerEthereumBrowserClientFactoryAsync(): Promise<LedgerEthereumClient> {
    const ledgerConnection = await LedgerBrowserCommunication.create_async();
    const ledgerEthClient = new LedgerEthereumClientFn(ledgerConnection);
    return ledgerEthClient;
}

export async function ledgerEthereumNodeJsClientFactoryAsync(): Promise<LedgerEthereumClient> {
    const ledgerConnection = await LedgerNodeCommunication.create_async();
    const ledgerEthClient = new LedgerEthereumClientFn(ledgerConnection);
    return ledgerEthClient;
}
