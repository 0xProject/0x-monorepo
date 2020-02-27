"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Represents the varying smart contracts that can consume a valid swap quote
 */
var ExtensionContractType;
(function (ExtensionContractType) {
    ExtensionContractType["Forwarder"] = "FORWARDER";
    ExtensionContractType["None"] = "NONE";
})(ExtensionContractType = exports.ExtensionContractType || (exports.ExtensionContractType = {}));
/**
 * Possible error messages thrown by an SwapQuoterConsumer instance or associated static methods.
 */
var SwapQuoteConsumerError;
(function (SwapQuoteConsumerError) {
    SwapQuoteConsumerError["InvalidMarketSellOrMarketBuySwapQuote"] = "INVALID_MARKET_BUY_SELL_SWAP_QUOTE";
    SwapQuoteConsumerError["InvalidForwarderSwapQuote"] = "INVALID_FORWARDER_SWAP_QUOTE_PROVIDED";
    SwapQuoteConsumerError["NoAddressAvailable"] = "NO_ADDRESS_AVAILABLE";
    SwapQuoteConsumerError["SignatureRequestDenied"] = "SIGNATURE_REQUEST_DENIED";
    SwapQuoteConsumerError["TransactionValueTooLow"] = "TRANSACTION_VALUE_TOO_LOW";
})(SwapQuoteConsumerError = exports.SwapQuoteConsumerError || (exports.SwapQuoteConsumerError = {}));
/**
 * Possible error messages thrown by an SwapQuoter instance or associated static methods.
 */
var SwapQuoterError;
(function (SwapQuoterError) {
    SwapQuoterError["NoEtherTokenContractFound"] = "NO_ETHER_TOKEN_CONTRACT_FOUND";
    SwapQuoterError["StandardRelayerApiError"] = "STANDARD_RELAYER_API_ERROR";
    SwapQuoterError["InsufficientAssetLiquidity"] = "INSUFFICIENT_ASSET_LIQUIDITY";
    SwapQuoterError["AssetUnavailable"] = "ASSET_UNAVAILABLE";
    SwapQuoterError["NoGasPriceProvidedOrEstimated"] = "NO_GAS_PRICE_PROVIDED_OR_ESTIMATED";
})(SwapQuoterError = exports.SwapQuoterError || (exports.SwapQuoterError = {}));
/**
 * Represents two main market operations supported by asset-swapper.
 */
var MarketOperation;
(function (MarketOperation) {
    MarketOperation["Sell"] = "Sell";
    MarketOperation["Buy"] = "Buy";
})(MarketOperation = exports.MarketOperation || (exports.MarketOperation = {}));
/**
 * Represents varying order takerFee types that can be pruned for by OrderPruner.
 */
var OrderPrunerPermittedFeeTypes;
(function (OrderPrunerPermittedFeeTypes) {
    OrderPrunerPermittedFeeTypes["NoFees"] = "NO_FEES";
    OrderPrunerPermittedFeeTypes["MakerDenominatedTakerFee"] = "MAKER_DENOMINATED_TAKER_FEE";
    OrderPrunerPermittedFeeTypes["TakerDenominatedTakerFee"] = "TAKER_DENOMINATED_TAKER_FEE";
})(OrderPrunerPermittedFeeTypes = exports.OrderPrunerPermittedFeeTypes || (exports.OrderPrunerPermittedFeeTypes = {}));
//# sourceMappingURL=types.js.map