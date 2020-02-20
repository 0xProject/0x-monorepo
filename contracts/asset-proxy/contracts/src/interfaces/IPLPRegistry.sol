pragma solidity ^0.5.9;

interface IPLPRegistry {
    function getPoolForMarket(
        address xAsset,
        address yAsset
    ) external view returns (address poolAddress);
}
