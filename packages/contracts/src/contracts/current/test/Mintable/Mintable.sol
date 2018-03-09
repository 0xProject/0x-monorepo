pragma solidity ^0.4.21;

import "../../tokens/UnlimitedAllowanceToken/UnlimitedAllowanceToken.sol";
import "../../utils/SafeMath/SafeMath.sol";

/*
 * Mintable
 * Base contract that creates a mintable UnlimitedAllowanceToken
 */
contract Mintable is UnlimitedAllowanceToken, SafeMath {
    function mint(uint _value)
        public
    {
        require(_value <= 100000000000000000000);
        balances[msg.sender] = safeAdd(_value, balances[msg.sender]);
        totalSupply = safeAdd(totalSupply, _value);
    }
}
