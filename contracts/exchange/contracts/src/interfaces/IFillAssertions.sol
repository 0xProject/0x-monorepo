pragma solidity ^0.5.9;

import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibFillResults.sol";


contract IFillAssertions {
    function _assertFillableOrder(
        LibOrder.Order memory order,
        LibOrder.OrderInfo memory orderInfo,
        address takerAddress,
        bytes memory signature
    )
        internal
        view;

    function _updateFilledState(
        LibOrder.Order memory order,
        address takerAddress,
        bytes32 orderHash,
        uint256 orderTakerAssetFilledAmount,
        LibFillResults.FillResults memory fillResults
    )
        internal;

    function _assertValidFill(
        LibOrder.Order memory order,
        LibOrder.OrderInfo memory orderInfo,
        uint256 takerAssetFillAmount,  // TODO: use FillResults
        uint256 takerAssetFilledAmount,
        uint256 makerAssetFilledAmount
    )
        internal
        view;
}
