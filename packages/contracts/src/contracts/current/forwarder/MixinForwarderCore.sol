pragma solidity ^0.4.21;
pragma experimental ABIEncoderV2;

import "../protocol/Exchange/Exchange.sol";
import "../protocol/TokenTransferProxy/TokenTransferProxy.sol";
import "../utils/SafeMath/SafeMath.sol";
import { WETH9 as EtherToken } from "../tokens/WETH9/WETH9.sol";

contract MixinForwarderCore is
    LibOrder,
    SafeMath
{
    uint16  constant public EXTERNAL_QUERY_GAS_LIMIT = 4999;    // Changes to state require at least 5000 gas
    uint16  constant public MAX_FEE = 1000; // 10%
    uint16  constant ALLOWABLE_EXCHANGE_PERCENTAGE = 9800; // 98%
    uint16  constant PERCENTAGE_DENOMINATOR = 1000; // 9800 == 98%
    uint256 constant MAX_UINT = 2 ** 256 - 1;

    Exchange exchange;
    TokenTransferProxy tokenProxy;
    EtherToken etherToken;
    Token zrxToken;

    function isAcceptableThreshold(uint256 requestedTokenAmount, uint256 soldTokenAmount)
        internal
        pure
        returns (bool)
    {
        uint256 exchangedProportion = safeDiv(safeMul(requestedTokenAmount, ALLOWABLE_EXCHANGE_PERCENTAGE), PERCENTAGE_DENOMINATOR);
        return soldTokenAmount >= exchangedProportion;
    }
    function addFillResults(FillResults memory totalFillResults, FillResults memory singleFillResults)
        internal
        pure
    {
        totalFillResults.makerTokenFilledAmount = safeAdd(totalFillResults.makerTokenFilledAmount, singleFillResults.makerTokenFilledAmount);
        totalFillResults.takerTokenFilledAmount = safeAdd(totalFillResults.takerTokenFilledAmount, singleFillResults.takerTokenFilledAmount);
        totalFillResults.makerFeePaid = safeAdd(totalFillResults.makerFeePaid, singleFillResults.makerFeePaid);
        totalFillResults.takerFeePaid = safeAdd(totalFillResults.takerFeePaid, singleFillResults.takerFeePaid);
    }
}