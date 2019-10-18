pragma solidity ^0.5;

contract IKyberNetwork {
    function getExpectedRate(
        address fromToken,
        address toToken,
        uint256 fromAmount
    )
        public
        view
        returns (uint256 expectedRate, uint256 slippageRate);
}
