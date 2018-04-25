pragma solidity ^0.4.21;
pragma experimental ABIEncoderV2;

import "../protocol/Exchange/Exchange.sol";
import "../protocol/AssetProxyDispatcher/IAssetProxy.sol";
import "../protocol/AssetProxyDispatcher/IAssetProxyDispatcher.sol";
import "../utils/SafeMath/SafeMath.sol";
import { WETH9 as EtherToken } from "../tokens/WETH9/WETH9.sol";
import "../tokens/ZrxToken/ZrxToken.sol";
import "../utils/LibBytes/LibBytes.sol";

contract MixinForwarderCore is
    LibOrder,
    LibBytes,
    SafeMath
{
    uint16  constant PERCENTAGE_DENOMINATOR = 10000; // 9800 == 98%, 10000 == 100%
    uint16  constant public MAX_FEE = 1000; // 10%
    uint16  constant ALLOWABLE_EXCHANGE_PERCENTAGE = 9800; // 98%
    uint256 constant MAX_UINT = 2 ** 256 - 1;

    // Revert Strings
    string constant ERROR_FAILED_TO_FILL_ALL_ORDERS = "FAILED_TO_FILL_ALL_ORDERS";
    string constant ERROR_UNACCEPTABLE_THRESHOLD = "UNACCEPTABLE_THRESHOLD";
    string constant ERROR_INVALID_INPUT = "INVALID_INPUT";
    string constant ERROR_TRANSFER_FAILED = "TRANSFER_FAILED";

    Exchange EXCHANGE;
    IAssetProxyDispatcher TRANSFER_PROXY;
    EtherToken ETHER_TOKEN;
    ZRXToken ZRX_TOKEN;
    mapping (address => uint256) public balanceOf;

    /// @dev Checks whether the amount of tokens sold against the amount of tokens requested
    ///      is within a certain threshold. This ensures the caller gets a fair deal when
    ///      performing any token fee abstraction. Threshold is 98%. If fee abstraction costs more than
    ///      2% of the total transaction, we return false.
    /// @param requestedTokenAmount The amount the user requested, or sent in to a payable function
    /// @param soldTokenAmount The amount of the token that was sold after fee abstraction
    /// @return bool of whether this is within an acceptable threshold
    function isAcceptableThreshold(uint256 requestedTokenAmount, uint256 soldTokenAmount)
        internal
        pure
        returns (bool)
    {
        uint256 acceptableProportion = safeDiv(safeMul(requestedTokenAmount, ALLOWABLE_EXCHANGE_PERCENTAGE), PERCENTAGE_DENOMINATOR);
        return soldTokenAmount >= acceptableProportion;
    }
    function addFillResults(Exchange.FillResults memory totalFillResults, Exchange.FillResults memory singleFillResults)
        internal
        pure
    {
        totalFillResults.makerTokenFilledAmount = safeAdd(totalFillResults.makerTokenFilledAmount, singleFillResults.makerTokenFilledAmount);
        totalFillResults.takerTokenFilledAmount = safeAdd(totalFillResults.takerTokenFilledAmount, singleFillResults.takerTokenFilledAmount);
        totalFillResults.makerFeePaid = safeAdd(totalFillResults.makerFeePaid, singleFillResults.makerFeePaid);
        totalFillResults.takerFeePaid = safeAdd(totalFillResults.takerFeePaid, singleFillResults.takerFeePaid);
    }

    /// @dev Calculates partial value given a numerator and denominator.
    /// @param numerator Numerator.
    /// @param denominator Denominator.
    /// @param target Value to calculate partial of.
    /// @return Partial value of target.
    function getPartialAmount(uint256 numerator, uint256 denominator, uint256 target)
        public pure
        returns (uint256 partialAmount)
    {
        partialAmount = safeDiv(safeMul(numerator, target), denominator);
        return partialAmount;
    }
}