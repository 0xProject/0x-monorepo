import { ECSignature } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';

export interface ERC20Token {
    address?: string;
    name: string;
    symbol: string;
    decimals: BigNumber;
    ipfsHash: string;
    swarmHash: string;
}

export interface ERC721Token {
    name: string;
    symbol: string;
}

export enum ContractName {
    TokenTransferProxy = 'TokenTransferProxy',
    TokenRegistry = 'TokenRegistry',
    MultiSigWalletWithTimeLock = 'MultiSigWalletWithTimeLock',
    Exchange = 'Exchange',
    ZRXToken = 'ZRXToken',
    DummyToken = 'DummyToken',
    WETH9 = 'WETH9',
    MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress = 'MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress',
    AccountLevels = 'AccountLevels',
    EtherDelta = 'EtherDelta',
    Arbitrage = 'Arbitrage',
}

export interface LedgerCommunicationClient {
    close: () => Promise<void>;
}

export interface LedgerGetAddressResult {
    address: string;
    publicKey: string;
    chainCode: string;
}

export interface ECSignatureString {
    v: string;
    r: string;
    s: string;
}

export interface LedgerGetAddressResult {
    address: string;
    publicKey: string;
    chainCode: string;
}

export interface LedgerEthereumClient {
    // shouldGetChainCode is defined as `true` instead of `boolean` because other types rely on the assumption
    // that we get back the chain code and we don't have dependent types to express it properly
    getAddress: (
        derivationPath: string,
        askForDeviceConfirmation: boolean,
        shouldGetChainCode: true,
    ) => Promise<LedgerGetAddressResult>;
    signTransaction: (derivationPath: string, rawTxHex: string) => Promise<ECSignatureString>;
    signPersonalMessage: (derivationPath: string, messageHex: string) => Promise<ECSignature>;
    transport: LedgerCommunicationClient;
}
