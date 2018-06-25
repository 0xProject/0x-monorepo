pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "./MixinErrorMessages.sol";
import "./MixinBuyFeeTokens.sol";
import "../protocol/Exchange/Exchange.sol";
import "../utils/SafeMath/SafeMath.sol";
import { WETH9 as EtherToken } from "../tokens/WETH9/WETH9.sol";
import "../tokens/ZRXToken/ZRXToken.sol";
import "../utils/LibBytes/LibBytes.sol";

contract MixinForwarderCore is
    LibBytes,
    MixinErrorMessages,
    MixinBuyFeeTokens
{
    uint16  constant public PERCENTAGE_DENOMINATOR = 10000; // 9800 == 98%, 10000 == 100%
    uint16  constant public MAX_FEE = 1000; // 10%
    uint16  constant public ALLOWABLE_EXCHANGE_PERCENTAGE = 9500; // 95%
    uint256 constant MAX_UINT = 2 ** 256 - 1;

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
        address feeRecipient
    )
        internal
        returns (uint256 remainingTakerTokenAmount)
    {
        remainingTakerTokenAmount = takerTokenAmount;
        if (feeProportion > 0 && feeRecipient != address(0)) {
            require(feeProportion <= MAX_FEE, FEE_PROPORTION_TOO_LARGE);
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
        address feeRecipient
    )
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
}
