import { BigNumber } from '@0x/utils';
import { ERC20BridgeSource, GetMarketOrdersOpts } from './types';
/**
 * Valid sources for market sell.
 */
export declare const SELL_SOURCES: ERC20BridgeSource[];
/**
 * Valid sources for market buy.
 */
export declare const BUY_SOURCES: ERC20BridgeSource[];
export declare const DEFAULT_GET_MARKET_ORDERS_OPTS: GetMarketOrdersOpts;
/**
 * Sources to poll for ETH fee price estimates.
 */
export declare const FEE_QUOTE_SOURCES: ERC20BridgeSource[];
export declare const constants: {
    INFINITE_TIMESTAMP_SEC: BigNumber;
    SELL_SOURCES: ERC20BridgeSource[];
    BUY_SOURCES: ERC20BridgeSource[];
    DEFAULT_GET_MARKET_ORDERS_OPTS: GetMarketOrdersOpts;
    ERC20_PROXY_ID: string;
    FEE_QUOTE_SOURCES: ERC20BridgeSource[];
    WALLET_SIGNATURE: string;
    ONE_ETHER: BigNumber;
};
//# sourceMappingURL=constants.d.ts.map