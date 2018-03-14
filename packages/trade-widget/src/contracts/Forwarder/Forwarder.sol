pragma solidity ^0.4.18;

import "../current/protocol/Exchange/Exchange.sol";
import "../current/protocol/TokenTransferProxy/TokenTransferProxy.sol";
import { WETH9 as EtherToken } from "../current/tokens/WETH9/WETH9.sol";

contract Forwarder is SafeMath {

    Exchange exchange;
    TokenTransferProxy tokenProxy;
    EtherToken etherToken;
    Token zrxToken;

    uint256 constant MAX_UINT = 2 ** 256 - 1;

    event LogForwarderError(uint8 indexed errorId);

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
        address[5] orderAddresses,
        uint[6] orderValues,
        uint8 v,
        bytes32 r,
        bytes32 s)
        external
        payable
        returns (uint256 takerTokenFilledAmount)
    {
        assert(msg.value > 0);
        assert(orderAddresses[3] == address(etherToken));

        etherToken.deposit.value(msg.value)();

        require(Exchange(exchange).fillOrder(
            orderAddresses,
            orderValues,
            msg.value,
            true,   // always throw on failed transfer
            v,
            r,
            s
        ) == msg.value);

        uint256 makerTokenFilledAmount = getPartialAmount(orderValues[0], orderValues[1], msg.value);    // makerTokenAmount * takerTokenFillAmount / takerTokenAmount
        transferToken(orderAddresses[2], msg.sender, makerTokenFilledAmount);
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
