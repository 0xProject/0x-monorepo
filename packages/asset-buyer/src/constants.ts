import { BigNumber } from '@0xproject/utils';

export const constants = {
    ZERO_AMOUNT: new BigNumber(0),
    NULL_ADDRESS: '0x0000000000000000000000000000000000000000',
    MAINNET_NETWORK_ID: 1,
    DEFAULT_SLIPPAGE_PERCENTAGE: 0.2, // 20% slippage protection
    DEFAULT_ORDER_REFRESH_INTERVAL_MS: 10000, // 10 seconds
    DEFAULT_FEE_PERCENTAGE: 0,
    ETHER_TOKEN_DECIMALS: 18,
};
