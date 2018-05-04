pragma solidity ^0.4.22;
pragma experimental ABIEncoderV2;

import "../protocol/Exchange/Exchange.sol";
import "../utils/SafeMath/SafeMath.sol";
import { WETH9 as EtherToken } from "../tokens/WETH9/WETH9.sol";
import "../tokens/ZRXToken/ZRXToken.sol";
import "../utils/LibBytes/LibBytes.sol";

contract MixinForwarderCore is
    LibOrder,
    LibBytes,
    SafeMath
{
    uint16  constant public PERCENTAGE_DENOMINATOR = 10000; // 9800 == 98%, 10000 == 100%
    uint16  constant public MAX_FEE = 1000; // 10%
    uint16  constant public ALLOWABLE_EXCHANGE_PERCENTAGE = 9500; // 95%
    uint256 constant MAX_UINT = 2 ** 256 - 1;

    Exchange EXCHANGE;
    EtherToken ETHER_TOKEN;
    ZRXToken ZRX_TOKEN;

    /// @dev Deducts and Pays the feeRecipient feeProportion of the total takerTokenAmount
    /// @param takerTokenAmount The total amount that was transacted in WETH, fees are calculated from this value.
    /// @param feeProportion The proportion of fees
    /// @param feeRecipient The recipient of the fees
    /// @return remainingTakerTokenAmount the amount remaining after fees have been deducted and paid to feeRecipient.
    function payAndDeductFee(
        uint256 takerTokenAmount,
        uint16 feeProportion,
        address feeRecipient)
        internal
        returns (uint256 remainingTakerTokenAmount)
    {
        remainingTakerTokenAmount = takerTokenAmount;
        if (feeProportion > 0 && feeRecipient != address(0x0)) {
            require(feeProportion <= MAX_FEE, "feeProportion is larger than MAX_FEE");
            // 1.5% is 150, allowing for 2 decimal precision, i.e 0.05% is 5
            uint256 feeRecipientFeeAmount = safeDiv(safeMul(remainingTakerTokenAmount, feeProportion), PERCENTAGE_DENOMINATOR);
            remainingTakerTokenAmount = safeSub(remainingTakerTokenAmount, feeRecipientFeeAmount);
            feeRecipient.transfer(feeRecipientFeeAmount);
        }
        return remainingTakerTokenAmount;
    }

    /// @dev Withdraws the remaining WETH, deduct and pay fees from this amount based on the takerTokenAmount to the feeRecipient.
    ///      If a user overpaid ETH initially, the fees are calculated from the amount traded and deducted from withdrawAmount.
    ///      Any remaining ETH is sent back to the user.
    /// @param withdrawAmount The amount to withdraw from the WETH contract.
    /// @param takerTokenAmount The total amount that was transacted in WETH, fees are calculated from this value.
    /// @param feeProportion The proportion of fees
    /// @param feeRecipient The recipient of the fees
    /// @return remainingTakerTokenAmount the amount remaining after fees have been deducted and paid to feeRecipient.
    function withdrawPayAndDeductFee(
        uint256 withdrawAmount,
        uint256 takerTokenAmount,
        uint16 feeProportion,
        address feeRecipient)
        internal
        returns (uint256 remainingTakerTokenAmount)
    {
        // Return all of the excess WETH if any after deducting fees on the amount
        if (withdrawAmount > 0) {
            ETHER_TOKEN.withdraw(withdrawAmount);
            remainingTakerTokenAmount = withdrawAmount;
            // Fees proportional to the amount traded
            uint256 feeAmount = safeSub(takerTokenAmount, payAndDeductFee(takerTokenAmount, feeProportion, feeRecipient));
            remainingTakerTokenAmount = safeSub(remainingTakerTokenAmount, feeAmount);
            if (remainingTakerTokenAmount > 0) {
                msg.sender.transfer(remainingTakerTokenAmount);
            }
        }
        return remainingTakerTokenAmount;
    }

    /// @dev Buys feeAmount of ZRX fee tokens, taking into account the fees on buying fee tokens. This will guarantee
    ///      At least feeAmount of ZRX fee tokens are purchased (sometimes slightly over due to rounding issues).
    ///      It is possible that a request to buy 200 ZRX fee tokens will require purchasing 202 ZRX tokens
    ///      As 2 ZRX is required to purchase the 200 ZRX fee tokens. This guarantees at least 200 ZRX for future purchases.
    /// @param orders An array of Order struct containing order specifications for fees.
    /// @param signatures An array of Proof that order has been created by maker for the fee orders.
    /// @param feeAmount The number of requested ZRX fee tokens.
    /// @return totalFillResults Amounts filled and fees paid by maker and taker. makerTokenAmount is the zrx amount deducted of fees
    function buyFeeTokensInternal(
        Order[] memory orders,
        bytes[] memory signatures,
        uint256 feeAmount)
        internal
        returns (Exchange.FillResults memory totalFillResults)
    {
        address token = readAddress(orders[0].makerAssetData, 1);
        require(token == address(ZRX_TOKEN), "order taker asset must be ZRX");
        for (uint256 i = 0; i < orders.length; i++) {
            // Token being bought by taker must be the same for each order
            require(areBytesEqual(orders[i].makerAssetData, orders[0].makerAssetData), "all orders must be the same token pair");

            // Calculate the remaining amount of makerToken to buy
            uint256 remainingMakerTokenFillAmount = safeSub(feeAmount, totalFillResults.makerAssetFilledAmount);

            // Convert the remaining amount of makerToken to buy into remaining amount
            // of takerToken to sell, assuming entire amount can be sold in the current order
            uint256 remainingTakerTokenFillAmount = getPartialAmount(
                orders[i].takerAssetAmount,
                safeSub(orders[i].makerAssetAmount, orders[i].takerFee), // our exchange rate after fees 
                remainingMakerTokenFillAmount);

            // Attempt to sell the remaining amount of takerToken
            // Round up the amount to ensure we don't under buy by a fractional amount
            Exchange.FillResults memory singleFillResult = EXCHANGE.fillOrder(
                orders[i],
                safeAdd(remainingTakerTokenFillAmount, 1),
                signatures[i]
            );

            // We didn't buy the full amount when buying ZRX as some were taken for fees
            singleFillResult.makerAssetFilledAmount = safeSub(singleFillResult.makerAssetFilledAmount, singleFillResult.takerFeePaid);
            // Update amounts filled and fees paid by maker and taker
            addFillResults(totalFillResults, singleFillResult);

            // Stop execution if the entire amount of makerToken has been bought
            if (totalFillResults.makerAssetFilledAmount >= feeAmount) {
                break;
            }
        }
        return totalFillResults;
    }

    /// @dev Checks whether the amount of tokens sold against the amount of tokens requested
    ///      is within a certain threshold. This ensures the caller gets a fair deal when
    ///      performing any token fee abstraction. Threshold is 95%. If fee abstraction costs more than
    ///      5% of the total transaction, we return false.
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
        totalFillResults.makerAssetFilledAmount = safeAdd(totalFillResults.makerAssetFilledAmount, singleFillResults.makerAssetFilledAmount);
        totalFillResults.takerAssetFilledAmount = safeAdd(totalFillResults.takerAssetFilledAmount, singleFillResults.takerAssetFilledAmount);
        totalFillResults.makerFeePaid = safeAdd(totalFillResults.makerFeePaid, singleFillResults.makerFeePaid);
        totalFillResults.takerFeePaid = safeAdd(totalFillResults.takerFeePaid, singleFillResults.takerFeePaid);
    }

    /// @dev Calculates partial value given a numerator and denominator.
    /// @param numerator Numerator.
    /// @param denominator Denominator.
    /// @param target Value to calculate partial of.
    /// @return Partial value of target.
    function getPartialAmount(uint256 numerator, uint256 denominator, uint256 target)
        internal
        pure
        returns (uint256 partialAmount)
    {
        partialAmount = safeDiv(safeMul(numerator, target), denominator);
        return partialAmount;
    }

    function isRoundingError(uint256 numerator, uint256 denominator, uint256 target)
        internal
        pure
        returns (bool isError)
    {
        uint256 remainder = mulmod(target, numerator, denominator);
        if (remainder == 0) {
            return false; // No rounding error.
        }

        uint256 errPercentageTimes1000000 = safeDiv(
            safeMul(remainder, 1000000),
            safeMul(numerator, target)
        );
        isError = errPercentageTimes1000000 > 1000;
        return isError;
    }
}