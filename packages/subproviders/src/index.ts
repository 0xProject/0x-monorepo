import Eth from '@ledgerhq/hw-app-eth';
import TransportU2F from '@ledgerhq/hw-transport-u2f';

import { LedgerEthereumClient } from './types';
export { Callback, NextCallback } from './types';

export { EmptyWalletSubprovider } from './subproviders/empty_wallet_subprovider';
export { FakeGasEstimateSubprovider } from './subproviders/fake_gas_estimate_subprovider';
export { InjectedWeb3Subprovider } from './subproviders/injected_web3';
export { RedundantRPCSubprovider } from './subproviders/redundant_rpc';
export { LedgerSubprovider } from './subproviders/ledger';
export { GanacheSubprovider } from './subproviders/ganache';
export { Subprovider } from './subproviders/subprovider';
export { NonceTrackerSubprovider } from './subproviders/nonce_tracker';
export {
    ECSignature,
    LedgerWalletSubprovider,
    LedgerCommunicationClient,
    NonceSubproviderErrors,
    LedgerSubproviderConfigs,
} from './types';

/**
 * A factory method for creating a LedgerEthereumClient usable in a browser context.
 * @return LedgerEthereumClient A browser client
 */
export async function ledgerEthereumBrowserClientFactoryAsync(): Promise<LedgerEthereumClient> {
    const ledgerConnection = await TransportU2F.create();
    const ledgerEthClient = new Eth(ledgerConnection);
    return ledgerEthClient;
}
