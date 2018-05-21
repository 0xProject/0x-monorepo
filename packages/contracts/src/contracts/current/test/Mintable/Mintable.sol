/*

  Copyright 2018 ZeroEx Intl.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/

pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "../../tokens/UnlimitedAllowanceToken/UnlimitedAllowanceToken.sol";
import "../../utils/SafeMath/SafeMath.sol";

/*
 * Mintable
 * Base contract that creates a mintable UnlimitedAllowanceToken
 */
contract Mintable is UnlimitedAllowanceToken, SafeMath {
    function mint(uint256 _value)
        public
    {
        require(
            _value <= 100000000000000000000,
            "Minting more than 100000000000000000000 is not allowed."
        );
        balances[msg.sender] = safeAdd(_value, balances[msg.sender]);
        totalSupply = safeAdd(totalSupply, _value);
    }
}
