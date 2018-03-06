import {
    Eth as LedgerEthereumClientFn,
} from '@ledgerhq/hw-app-eth';

import {
    TransportU2F as LedgerBrowserCommunication,
} from '@ledgerhq/hw-transport-u2f';

import { LedgerEthereumClient } from './types';

export { EmptyWalletSubprovider } from './subproviders/empty_wallet_subprovider';
export { FakeGasEstimateSubprovider } from './subproviders/fake_gas_estimate_subprovider';
export { InjectedWeb3Subprovider } from './subproviders/injected_web3';
export { RedundantRPCSubprovider } from './subproviders/redundant_rpc';
export { LedgerSubprovider } from './subproviders/ledger';
export { NonceTrackerSubprovider } from './subproviders/nonce_tracker';
export { ECSignature, LedgerWalletSubprovider, LedgerCommunicationClient, NonceSubproviderErrors } from './types';

/**
 * A factory method for creating a LedgerEthereumClient usable in a browser context.
 * @return LedgerEthereumClient A browser client
 */
export async function ledgerEthereumBrowserClientFactoryAsync(): Promise<LedgerEthereumClient> {
    const ledgerConnection = await LedgerBrowserCommunication.create();
    const ledgerEthClient = new LedgerEthereumClientFn(ledgerConnection);
    return ledgerEthClient;
}
