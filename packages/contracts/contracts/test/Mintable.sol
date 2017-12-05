pragma solidity 0.4.11;

import "./../tokens/ERC20Token.sol";
import "./../base/SafeMath.sol";

/*
 * Mintable
 * Base contract that creates a mintable UnlimitedAllowanceToken
 */
contract Mintable is ERC20Token, SafeMath {
    function mint(uint _value) {
        require(_value <= 100000000000000000000);
        balances[msg.sender] = safeAdd(_value, balances[msg.sender]);
        totalSupply = safeAdd(totalSupply, _value);
    }
}
