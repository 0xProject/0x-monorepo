import { BigNumber } from '@0x/utils';
import { OrderPrunerOpts, SwapQuoteExecutionOpts, SwapQuoteGetOutputOpts, SwapQuoteRequestOpts, SwapQuoterOpts } from './types';
export declare const constants: {
    ETH_GAS_STATION_API_BASE_URL: string;
    PROTOCOL_FEE_MULTIPLIER: BigNumber;
    NULL_BYTES: string;
    ZERO_AMOUNT: BigNumber;
    NULL_ADDRESS: string;
    MAINNET_CHAIN_ID: number;
    DEFAULT_ORDER_PRUNER_OPTS: OrderPrunerOpts;
    ETHER_TOKEN_DECIMALS: number;
    ONE_AMOUNT: BigNumber;
    ONE_SECOND_MS: number;
    DEFAULT_SWAP_QUOTER_OPTS: SwapQuoterOpts;
    DEFAULT_FORWARDER_SWAP_QUOTE_GET_OPTS: SwapQuoteGetOutputOpts;
    DEFAULT_FORWARDER_SWAP_QUOTE_EXECUTE_OPTS: SwapQuoteExecutionOpts;
    DEFAULT_SWAP_QUOTE_REQUEST_OPTS: SwapQuoteRequestOpts;
    DEFAULT_PER_PAGE: number;
    NULL_ERC20_ASSET_DATA: string;
    PROTOCOL_FEE_UTILS_POLLING_INTERVAL_IN_MS: number;
    MARKET_UTILS_AMOUNT_BUFFER_PERCENTAGE: number;
    BRIDGE_ASSET_DATA_PREFIX: string;
    DEFAULT_CURVE_OPTS: {
        [source: string]: {
            version: number;
            curveAddress: string;
            tokens: string[];
        };
    };
};
//# sourceMappingURL=constants.d.ts.map