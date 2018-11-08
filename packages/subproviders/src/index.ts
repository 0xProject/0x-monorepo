import Eth from '@ledgerhq/hw-app-eth';
import TransportU2F from '@ledgerhq/hw-transport-u2f';
export import Web3ProviderEngine = require('web3-provider-engine');

import { LedgerEthereumClient } from './types';

/**
 * A factory method for creating a LedgerEthereumClient usable in a browser context.
 * @return LedgerEthereumClient A browser client for the LedgerSubprovider
 */
export async function ledgerEthereumBrowserClientFactoryAsync(): Promise<LedgerEthereumClient> {
    const ledgerConnection = await TransportU2F.create();
    const ledgerEthClient = new Eth(ledgerConnection);
    return ledgerEthClient;
}

export { prependSubprovider } from './utils/subprovider_utils';

export { EmptyWalletSubprovider } from './subproviders/empty_wallet_subprovider';
export { FakeGasEstimateSubprovider } from './subproviders/fake_gas_estimate_subprovider';
export { SignerSubprovider } from './subproviders/signer';
export { RedundantSubprovider } from './subproviders/redundant_subprovider';
export { LedgerSubprovider } from './subproviders/ledger';
export { RPCSubprovider } from './subproviders/rpc_subprovider';
export { GanacheSubprovider } from './subproviders/ganache';
export { Subprovider } from './subproviders/subprovider';
export { NonceTrackerSubprovider } from './subproviders/nonce_tracker';
export { PrivateKeyWalletSubprovider } from './subproviders/private_key_wallet';
export { MnemonicWalletSubprovider } from './subproviders/mnemonic_wallet';
export { MetamaskSubprovider } from './subproviders/metamask_subprovider';
export { EthLightwalletSubprovider } from './subproviders/eth_lightwallet_subprovider';

export {
    Callback,
    ErrorCallback,
    NextCallback,
    LedgerCommunicationClient,
    LedgerEthereumClient,
    NonceSubproviderErrors,
    LedgerSubproviderConfigs,
    PartialTxParams,
    JSONRPCRequestPayloadWithMethod,
    ECSignatureString,
    AccountFetchingConfigs,
    LedgerEthereumClientFactoryAsync,
    OnNextCompleted,
    MnemonicWalletSubproviderConfigs,
    LedgerGetAddressResult,
} from './types';

export { ECSignature, EIP712Object, EIP712ObjectValue, EIP712TypedData, EIP712Types, EIP712Parameter } from '@0x/types';

export {
    JSONRPCRequestPayload,
    Provider,
    JSONRPCResponsePayload,
    JSONRPCErrorCallback,
    JSONRPCResponseError,
} from 'ethereum-types';
