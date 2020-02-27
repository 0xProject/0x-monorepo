import { BigNumber } from '@0x/utils';
import { MarketOperation, SignedOrderWithFillableAmounts, SwapQuote } from '../../src/types';
import { ProtocolFeeUtils } from '../../src/utils/protocol_fee_utils';
/**
 * Creates a swap quote given orders.
 */
export declare function getFullyFillableSwapQuoteWithNoFeesAsync(makerAssetData: string, takerAssetData: string, orders: SignedOrderWithFillableAmounts[], operation: MarketOperation, gasPrice: BigNumber, protocolFeeUtils: ProtocolFeeUtils): Promise<SwapQuote>;
//# sourceMappingURL=swap_quote.d.ts.map