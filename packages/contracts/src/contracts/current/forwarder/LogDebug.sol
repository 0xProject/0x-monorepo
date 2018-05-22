pragma solidity ^0.4.22;
pragma experimental ABIEncoderV2;

import "../protocol/Exchange/Exchange.sol";

contract LogDebug {
    event LogDebugFillResults(Exchange.FillResults fillResult);
    event LogDebugUint(string message, uint256 number);
}