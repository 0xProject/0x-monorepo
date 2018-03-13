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

pragma solidity ^0.4.21;

import "../../tokens/ERC20Token/ERC20Token.sol";

contract MaliciousToken is ERC20Token {
    uint8 stateToUpdate = 1;  // Not null so that change only requires 5000 gas

    function updateState()
        internal
    {
        stateToUpdate++;
    }

    function balanceOf(address _owner)
        public
        constant
        returns (uint)
    {
        updateState();
        return balances[_owner];
    }

    function allowance(address _owner, address _spender)
        public
        constant
        returns (uint)
    {
        updateState();
        return allowed[_owner][_spender];
    }
}
