pragma solidity ^0.4.24;

contract MixinErrorMessages {
    string constant VALUE_GT_ZERO = "msg.value must be greater than 0";
    string constant FEE_PROPORTION_TOO_LARGE = "feeProportion is larger than MAX_FEE";
    string constant TAKER_ASSET_ZRX = "order taker asset must be ZRX";
    string constant TAKER_ASSET_WETH = "order taker asset must be Wrapped ETH";
    string constant SAME_ASSET_TYPE = "all orders must be the same asset type";
    string constant NOT_ACCEPTABLE_THRESHOLD = "traded amount did not meet acceptable threshold";
    string constant UNSUPPORTED_TOKEN_PROXY = "unsupported token proxy";
    string constant ASSET_AMOUNT_MATCH_ORDER_SIZE = "assetAmount must match size of orders";
    string constant DEFAULT_FUNCTION_WETH_CONTRACT_ONLY = "Default function only allowed by WETH contract";
}