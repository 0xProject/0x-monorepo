pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;


interface IExchange {

    struct Order {
        address makerAddress;
        address takerAddress;
        address feeRecipientAddress;
        address senderAddress;
        uint256 makerAssetAmount;
        uint256 takerAssetAmount;
        uint256 makerFee;
        uint256 takerFee;
        uint256 expirationTimeSeconds;
        uint256 salt;
        bytes makerAssetData;
        bytes takerAssetData;
        // bytes makerFeeAssetData;
        // bytes takerFeeAssetData;
    }

    struct OrderInfo {
        uint8 orderStatus;
        bytes32 orderHash;
        uint256 orderTakerAssetFilledAmount;
    }

    function getOrderInfo(Order calldata order)
        external
        view
        returns (OrderInfo memory orderInfo);
}
