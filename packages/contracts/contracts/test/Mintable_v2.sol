pragma solidity 0.4.18;

import "./../tokens/ERC20Token.sol";
import "./../lib/SafeMath_v2.sol";

/*
 * Mintable
 * Base contract that creates a mintable UnlimitedAllowanceToken
 */
contract Mintable_v2 is ERC20Token, SafeMath_v2 {
    function mint(uint _value) 
        public
    {
        require(_value <= 100000000000000000000);
        balances[msg.sender] = safeAdd(_value, balances[msg.sender]);
        totalSupply = safeAdd(totalSupply, _value);
    }
}
