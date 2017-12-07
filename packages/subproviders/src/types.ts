import * as _ from 'lodash';
import * as Web3 from 'web3';

export interface LedgerCommunicationClient {
    close_async: () => Promise<void>;
}

/*
 * The LedgerEthereumClient sends Ethereum-specific requests to the Ledger Nano S
 * It uses an internal LedgerCommunicationClient to relay these requests. Currently
 * NodeJs and Browser communication are supported.
 */
export interface LedgerEthereumClient {
    getAddress_async: (derivationPath: string, askForDeviceConfirmation: boolean,
                       shouldGetChainCode: boolean) => Promise<LedgerGetAddressResult>;
    signPersonalMessage_async: (derivationPath: string, messageHex: string) => Promise<ECSignature>;
    signTransaction_async: (derivationPath: string, txHex: string) => Promise<ECSignatureString>;
    comm: LedgerCommunicationClient;
}

export interface ECSignatureString {
    v: string;
    r: string;
    s: string;
}

export interface ECSignature {
    v: number;
    r: string;
    s: string;
}

export type LedgerEthereumClientFactoryAsync = () => Promise<LedgerEthereumClient>;

/*
 * networkId: The ethereum networkId to set as the chainId from EIP155
 * ledgerConnectionType: Environment in which you wish to connect to Ledger (nodejs or browser)
 * derivationPath: Initial derivation path to use e.g 44'/60'/0'
 * accountFetchingConfigs: configs related to fetching accounts from a Ledger
 */
export interface LedgerSubproviderConfigs {
    networkId: number;
    ledgerEthereumClientFactoryAsync: LedgerEthereumClientFactoryAsync;
    derivationPath?: string;
    accountFetchingConfigs?: AccountFetchingConfigs;
}

/*
 * numAddressesToReturn: Number of addresses to return from 'eth_accounts' call
 * shouldAskForOnDeviceConfirmation: Whether you wish to prompt the user on their Ledger
 *                                   before fetching their addresses
 */
export interface AccountFetchingConfigs {
    numAddressesToReturn?: number;
    shouldAskForOnDeviceConfirmation?: boolean;
}

export interface SignatureData {
    hash: string;
    r: string;
    s: string;
    v: number;
}

export interface LedgerGetAddressResult {
    address: string;
}

export interface LedgerWalletSubprovider {
    getPath: () => string;
    setPath: (path: string) => void;
    setPathIndex: (pathIndex: number) => void;
}

export interface PartialTxParams {
    nonce: string;
    gasPrice?: string;
    gas: string;
    to: string;
    from?: string;
    value?: string;
    data?: string;
    chainId: number; // EIP 155 chainId - mainnet: 1, ropsten: 3
}

export type DoneCallback = (err?: Error) => void;

export interface JSONRPCPayload {
    params: any[];
    method: string;
}

export interface LedgerCommunication {
    close_async: () => Promise<void>;
}

export interface ResponseWithTxParams {
    raw: string;
    tx: PartialTxParams;
}

export enum LedgerSubproviderErrors {
    TooOldLedgerFirmware = 'TOO_OLD_LEDGER_FIRMWARE',
    FromAddressMissingOrInvalid = 'FROM_ADDRESS_MISSING_OR_INVALID',
    DataMissingForSignPersonalMessage = 'DATA_MISSING_FOR_SIGN_PERSONAL_MESSAGE',
    SenderInvalidOrNotSupplied = 'SENDER_INVALID_OR_NOT_SUPPLIED',
    MultipleOpenConnectionsDisallowed = 'MULTIPLE_OPEN_CONNECTIONS_DISALLOWED',
}
