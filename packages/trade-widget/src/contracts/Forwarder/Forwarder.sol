pragma solidity ^0.4.21;
pragma experimental ABIEncoderV2;

import "../../../../contracts/src/contracts/current/protocol/Exchange/Exchange.sol";
import "../../../../contracts/src/contracts/current/protocol/Exchange/LibOrder.sol";
import "../../../../contracts/src/contracts/current/protocol/TokenTransferProxy/TokenTransferProxy.sol";
import { WETH9 as EtherToken } from  "../../../../contracts/src/contracts/current/tokens/WETH9/WETH9.sol";

contract Forwarder is SafeMath, LibOrder {

    Exchange exchange;
    TokenTransferProxy tokenProxy;
    EtherToken etherToken;
    Token zrxToken;

    uint256 constant MAX_UINT = 2 ** 256 - 1;
    uint16 constant public EXTERNAL_QUERY_GAS_LIMIT = 4999;    // Changes to state require at least 5000 gas

    function Forwarder(
        Exchange _exchange,
        TokenTransferProxy _tokenProxy,
        EtherToken _etherToken,
        Token _zrxToken)
        public
    {
        exchange = _exchange;
        tokenProxy = _tokenProxy;
        etherToken = _etherToken;
        zrxToken = _zrxToken;
    }

    function initialize()
        external
    {
        etherToken.approve(address(tokenProxy), MAX_UINT);
        zrxToken.approve(address(tokenProxy), MAX_UINT);
    }

    function fillOrder(
        Order[] orders,
        bytes[] signatures)
        payable
        public
        returns (uint256 takerTokenFilledAmount)
    {
        assert(msg.value > 0);
        // market fill Quote ensures ALL of the orders are the same
        assert(orders[0].takerTokenAddress == address(etherToken));

        // TODO when market Fill Orders returns maker and taker amount tuple, remove this
        uint256 balanceOfMakerTokenBefore = Token(orders[0].makerTokenAddress).balanceOf.gas(EXTERNAL_QUERY_GAS_LIMIT)(address(this));

        etherToken.deposit.value(msg.value)();
        // Perform exchange and require the fill amount exactly equals the amount sent in
        // var (totalMakerTokenFilledAmount,
        //     totalTakerTokenFilledAmount,
        //     totalMakerFeeAmountPaid,
        //     totalTakerFeeAmountPaid) = 
        Exchange(exchange).marketFillOrdersQuote(orders, msg.value, signatures);
        require(Exchange(exchange).marketFillOrders(orders, msg.value, signatures) == msg.value);
        uint256 balanceOfMakerTokenAfter = Token(orders[0].makerTokenAddress).balanceOf.gas(EXTERNAL_QUERY_GAS_LIMIT)(address(this));
        uint256 makerTokenFillAmount = safeSub(balanceOfMakerTokenAfter, balanceOfMakerTokenBefore);

        transferToken(orders[0].makerTokenAddress, msg.sender, makerTokenFillAmount);
        return msg.value;
    }

    function getPartialAmount(uint256 numerator, uint256 denominator, uint256 target)
        internal
        view
        returns (uint256)
    {
        return safeDiv(safeMul(numerator, target), denominator);
    }

    function transferToken(address token, address account, uint amount)
        internal
    {
        require(Token(token).transfer(account, amount));
    }
}
