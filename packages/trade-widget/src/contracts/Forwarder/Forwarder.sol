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
        Order order,
        bytes signature)
        payable
        public
        returns (uint256 takerTokenFilledAmount)
    {
        assert(msg.value > 0);
        assert(order.takerTokenAddress == address(etherToken));

        etherToken.deposit.value(msg.value)();
        // Perform exchange and require the fill amount exactly equals the amount sent in
        require(
            Exchange(exchange).fillOrder(
                order,
                msg.value,
                signature
        ) == msg.value);

        uint256 makerTokenFilledAmount = getPartialAmount(order.makerTokenAmount, order.takerTokenAmount, msg.value);    // makerTokenAmount * takerTokenFillAmount / takerTokenAmount
        transferToken(order.makerTokenAddress, msg.sender, makerTokenFilledAmount);
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
