pragma solidity ^0.4.21;
pragma experimental ABIEncoderV2;

import "../../../../contracts/src/contracts/current/protocol/TokenTransferProxy/TokenTransferProxy.sol";
import { WETH9 as EtherToken } from  "../../../../contracts/src/contracts/current/tokens/WETH9/WETH9.sol";

import "../current/protocol/Exchange/Exchange.sol";

contract MixinForwarderCore is
    LibOrder,
    SafeMath
{

    uint16  constant public EXTERNAL_QUERY_GAS_LIMIT = 4999;    // Changes to state require at least 5000 gas
    uint16  constant public MAX_FEE = 1000; // 10%
    uint16  constant ALLOWABLE_EXCHANGE_PERC = 9800; // 98%
    uint256 constant MAX_UINT = 2 ** 256 - 1;

    Exchange exchange;
    TokenTransferProxy tokenProxy;
    EtherToken etherToken;
    Token zrxToken;

    struct FillResults {
        uint256 makerAmountSold;
        uint256 takerAmountSold;
        uint256 makerFeePaid;
        uint256 takerFeePaid;
    }

    function isAcceptableThreshold(uint256 requestedTokenAmount, uint256 soldTokenAmount)
        public
        constant
        returns (bool)
    {
        uint256 exchangedProportion = safeDiv(safeMul(requestedTokenAmount, ALLOWABLE_EXCHANGE_PERC), 10000);
        return soldTokenAmount >= exchangedProportion;
    }
}