pragma solidity ^0.4.19;

import { Exchange } from "../../protocol/Exchange/Exchange.sol";
import { EtherDelta } from "../EtherDelta/EtherDelta.sol";
import { Ownable } from "../../utils/Ownable/Ownable.sol";
import { Token } from "../../tokens/Token/Token.sol";

/// @title Arbitrage - Facilitates atomic arbitrage of ERC20 tokens between EtherDelta and 0x Exchange contract.
/// @author Leonid Logvinov - <leo@0xProject.com>
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

    /*
     * Makes token tradeable by setting an allowance for etherDelta and 0x proxy contract.
     * Also sets an allowance for the owner of the contracts therefore allowing to withdraw tokens.
     */
    function setAllowances(address tokenAddress) external onlyOwner {
        Token token = Token(tokenAddress);
        token.approve(address(etherDelta), MAX_UINT);
        token.approve(proxyAddress, MAX_UINT);
        token.approve(owner, MAX_UINT);
    }

    /*
     * Because of the limits on the number of local variables in Solidity we need to compress parameters while loosing
     * readability. Scheme of the parameter layout:
     *
     * addresses
     * 0..4 orderAddresses
     * 5 user
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
        address[6] addresses, uint[12] values,
        uint8[2] v, bytes32[2] r, bytes32[2] s
    ) external onlyOwner {
        makeExchangeTrade(addresses, values, v, r, s);
        makeEtherDeltaTrade(addresses, values, v, r, s);
    }

    function makeEtherDeltaTrade(
        address[6] addresses, uint[12] values,
        uint8[2] v, bytes32[2] r, bytes32[2] s
    ) internal {
        uint amount = values[11];
        etherDelta.depositToken(
            addresses[2], // tokenGet === makerToken
            values[7] // amountGet
        );
        etherDelta.trade(
            addresses[2], // tokenGet === makerToken
            values[7], // amountGet
            addresses[3], // tokenGive === takerToken
            values[8], // amountGive
            values[9], // expires
            values[10], // nonce
            addresses[5], // user
            v[1],
            r[1],
            s[1],
            amount
        );
        etherDelta.withdrawToken(
            addresses[3], // tokenGive === tokenToken
            values[8] // amountGive
        );
    }

    function makeExchangeTrade(
        address[6] addresses, uint[12] values,
        uint8[2] v, bytes32[2] r, bytes32[2] s
    ) internal {
        address[5] memory orderAddresses = [
            addresses[0], // maker
            addresses[1], // taker
            addresses[2], // makerToken
            addresses[3], // takerToken
            addresses[4] // feeRecepient
        ];
        uint[6] memory orderValues = [
            values[0], // makerTokenAmount
            values[1], // takerTokenAmount
            values[2], // makerFee
            values[3], // takerFee
            values[4], // expirationTimestampInSec
            values[5]  // salt
        ];
        uint fillTakerTokenAmount = values[6]; // fillTakerTokenAmount
        // Execute Exchange trade. It either succeeds in full or fails and reverts all the changes.
        exchange.fillOrKillOrder(orderAddresses, orderValues, fillTakerTokenAmount, v[0], r[0], s[0]);
    }
}
