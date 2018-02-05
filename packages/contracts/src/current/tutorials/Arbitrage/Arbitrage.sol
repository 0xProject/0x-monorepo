pragma solidity ^0.4.19;

import { Exchange } from "../../protocol/Exchange/Exchange.sol";
import { EtherDelta } from "../EtherDelta/EtherDelta.sol";
import { Ownable } from "../../utils/Ownable/Ownable.sol";
import { Token } from "../../tokens/Token/Token.sol";

contract Arbitrage is Ownable {

    Exchange exchange;
    EtherDelta etherDelta;
    address proxyAddress;

    uint256 constant MAX_UINT = 2**256 - 1;

    function Arbitrage(address _exchangeAddress, address _etherDeltaAddress, address _proxyAddress) {
        exchange = Exchange(_exchangeAddress);
        etherDelta = EtherDelta(_etherDeltaAddress);
        proxyAddress = _proxyAddress;
    }

    function setAllowances(address tokenAddress) external onlyOwner {
        Token token = Token(tokenAddress);
        token.approve(address(etherDelta), MAX_UINT);
        token.approve(proxyAddress, MAX_UINT);
        token.approve(owner, MAX_UINT);
    }

    /*
     * I 愛 the limitations on Solidity stack size!
     *
     * addresses
     * 0..4 orderAddresses
     * 5 tokenGet
     * 6 tokenGive
     * 7 user
     *
     * values
     * 0..5 orderValues
     * 6 fillTakerTokenAmount
     * 7 amountGet
     * 8 amountGive
     * 9 expires
     * 10 nonce
     * 11 amount

     * signature
     * exchange then etherDelta
     */
    function makeAtomicTrade(
        address[8] addresses, uint[12] values,
        uint8[2] v, bytes32[2] r, bytes32[2] s
    ) external onlyOwner {
        makeExchangeTrade(addresses, values, v, r, s);
        makeEtherDeltaTrade(addresses, values, v, r, s);
    }

    function makeEtherDeltaTrade(
        address[8] addresses, uint[12] values,
        uint8[2] v, bytes32[2] r, bytes32[2] s
    ) internal {
        uint amount = values[11];
        etherDelta.depositToken(addresses[5], values[7]);
        etherDelta.trade(
            addresses[5],
            values[7],
            addresses[6],
            values[8],
            values[9],
            values[10],
            addresses[7],
            v[1],
            r[1],
            s[1],
            amount
        );
        etherDelta.withdrawToken(addresses[6], values[8]);
    }

    function makeExchangeTrade(
        address[8] addresses, uint[12] values,
        uint8[2] v, bytes32[2] r, bytes32[2] s
    ) internal {
        address[5] memory orderAddresses = [
            addresses[0],
            addresses[1],
            addresses[2],
            addresses[3],
            addresses[4]
        ];
        uint[6] memory orderValues = [
            values[0],
            values[1],
            values[2],
            values[3],
            values[4],
            values[5]
        ];
        uint fillTakerTokenAmount = values[6];
        exchange.fillOrKillOrder(orderAddresses, orderValues, fillTakerTokenAmount, v[0], r[0], s[0]);
    }
}
