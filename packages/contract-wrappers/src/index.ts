import { wrappers } from '@0xproject/contracts';

export { ContractWrappers } from './contract_wrappers';
export { ERC20TokenWrapper } from './contract_wrappers/erc20_token_wrapper';
export { ERC721TokenWrapper } from './contract_wrappers/erc721_token_wrapper';
export { EtherTokenWrapper } from './contract_wrappers/ether_token_wrapper';
export { ExchangeWrapper } from './contract_wrappers/exchange_wrapper';
export { ERC20ProxyWrapper } from './contract_wrappers/erc20_proxy_wrapper';
export { ERC721ProxyWrapper } from './contract_wrappers/erc721_proxy_wrapper';
export { ForwarderWrapper } from './contract_wrappers/forwarder_wrapper';
export { OrderValidatorWrapper } from './contract_wrappers/order_validator_wrapper';

export { TransactionEncoder } from './utils/transaction_encoder';

export {
    ContractWrappersError,
    IndexedFilterValues,
    BlockRange,
    ContractWrappersConfig,
    MethodOpts,
    OrderTransactionOpts,
    TransactionOpts,
    OrderStatus,
    OrderInfo,
    EventCallback,
    DecodedLogEvent,
    BalanceAndAllowance,
    OrderAndTraderInfo,
    TraderInfo,
    ValidateOrderFillableOpts,
} from './types';

export { Order, SignedOrder, AssetProxyId } from '@0xproject/types';

export {
    BlockParamLiteral,
    BlockParam,
    ContractEventArg,
    Provider,
    ContractAbi,
    JSONRPCRequestPayload,
    JSONRPCResponsePayload,
    JSONRPCErrorCallback,
    JSONRPCResponseError,
    AbiDefinition,
    LogWithDecodedArgs,
    FunctionAbi,
    EventAbi,
    EventParameter,
    DecodedLogArgs,
    MethodAbi,
    ConstructorAbi,
    FallbackAbi,
    DataItem,
    ConstructorStateMutability,
    StateMutability,
} from 'ethereum-types';

export const WETH9Events = wrappers.WETH9Events;
export type WETH9WithdrawalEventArgs = wrappers.WETH9WithdrawalEventArgs;
export type WETH9ApprovalEventArgs = wrappers.WETH9ApprovalEventArgs;
export type WETH9EventArgs = wrappers.WETH9EventArgs;
export type WETH9DepositEventArgs = wrappers.WETH9DepositEventArgs;
export type WETH9TransferEventArgs = wrappers.WETH9TransferEventArgs;

export type ERC20TokenTransferEventArgs = wrappers.ERC20TokenTransferEventArgs;
export type ERC20TokenApprovalEventArgs = wrappers.ERC20TokenApprovalEventArgs;
export const ERC20TokenEvents = wrappers.ERC20TokenEvents;
export type ERC20TokenEventArgs = wrappers.ERC20TokenEventArgs;

export type ERC721TokenApprovalEventArgs = wrappers.ERC721TokenApprovalEventArgs;
export type ERC721TokenApprovalForAllEventArgs = wrappers.ERC721TokenApprovalForAllEventArgs;
export type ERC721TokenTransferEventArgs = wrappers.ERC721TokenTransferEventArgs;
export const ERC721TokenEvents = wrappers.ERC721TokenEvents;
export type ERC721TokenEventArgs = wrappers.ERC721TokenEventArgs;

export type ExchangeCancelUpToEventArgs = wrappers.ExchangeCancelUpToEventArgs;
export type ExchangeAssetProxyRegisteredEventArgs = wrappers.ExchangeAssetProxyRegisteredEventArgs;
export type ExchangeSignatureValidatorApprovalEventArgs = wrappers.ExchangeSignatureValidatorApprovalEventArgs;
export type ExchangeFillEventArgs = wrappers.ExchangeFillEventArgs;
export type ExchangeCancelEventArgs = wrappers.ExchangeCancelEventArgs;
export type ExchangeEventArgs = wrappers.ExchangeEventArgs;
export const ExchangeEvents = wrappers.ExchangeEvents;

export { AbstractBalanceAndProxyAllowanceFetcher, AbstractOrderFilledCancelledFetcher } from '@0xproject/order-utils';

export { AssetBalanceAndProxyAllowanceFetcher } from './fetchers/asset_balance_and_proxy_allowance_fetcher';
export { OrderFilledCancelledFetcher } from './fetchers/order_filled_cancelled_fetcher';
