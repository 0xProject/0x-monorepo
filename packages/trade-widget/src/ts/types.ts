import { Order, SignedOrder } from '0x.js';
import { ContractAbi } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';

export interface Styles {
    [name: string]: React.CSSProperties;
}

export enum ContractName {
  Forwarder = 'Forwarder',
}
export interface Artifact {
    contract_name: ContractName;
    networks: {
        [networkId: number]: {
            abi: ContractAbi;
            solc_version: string;
            keccak256: string;
            optimizer_enabled: number;
            unlinked_binary: string;
            updated_at: number;
            address: string;
            constructor_args: string;
        };
    };
}

export enum AssetToken {
    ZRX = 'ZRX',
    BAT = 'BAT',
    WETH = 'WETH',
}

export interface TokenBalances {
    [token: string]: BigNumber;
}
export interface AccountTokenBalances {
    [address: string]: TokenBalances;
}
export interface AccountWeiBalances {
    [address: string]: BigNumber;
}

export enum ActionTypes {
    UpdateNetworkId = 'UPDATE_NETWORK_ID',
    UpdateSelectedToken = 'UPDATE_SELECTED_TOKEN',
    UpdateUserAddress = 'UPDATE_USER_ACCOUNT',
    UpdateUserWeiBalance = 'UPDATE_USER_WEI_BALANCE',
    UpdateUserTokenBalance = 'UPDATE_USER_TOKEN_BALANCE',
    TransactionSubmitted = 'TRANSACTION_SUBMITTED',
    TransactionMined = 'TRANSACTION_MINED',
    QuoteRequested = 'QUOTE_REQUESTED',
    QuoteReceived = 'QUOTE_RECEIVED',
    QuoteRequestFailed = 'QUOTE_REQUEST_FAILED',
}
export interface Action {
    type: ActionTypes;
    data?: any;
}

export declare type OrderUpdateCallback = (order: SignedOrder) => any;
export declare type QuoteRequest = (amount: BigNumber, pair: TokenPair) => Promise<Quote>;
export interface LiquidityProvider {
    requestQuoteAsync(amount: BigNumber, pair: TokenPair, networkId: number): Promise<Quote>;
}

export interface TokenPair {
    maker: AssetToken;
    taker: AssetToken;
}
export interface Quote {
    pair: TokenPair;
    orders: SignedOrder[];
    amount: BigNumber;
    maxAmount: BigNumber; // Helps prevent re-fetching if the user wants to buy more
    networkId: number;
}
