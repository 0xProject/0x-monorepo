pragma solidity ^0.5.9;

interface IPLPRouter {
    function getPoolForMarket(address token1, address token2) external view returns (address poolAddress);
}