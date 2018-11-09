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

pragma solidity 0.4.11;

// solhint-disable-next-line max-line-length
import { UnlimitedAllowanceToken_v1 as UnlimitedAllowanceToken } from "./UnlimitedAllowanceToken_v1.sol";


contract ZRXToken is 
    UnlimitedAllowanceToken
{

    // solhint-disable const-name-snakecase
    uint8 constant public decimals = 18;
    uint256 public totalSupply = 10**27; // 1 billion tokens, 18 decimal places
    string constant public name = "0x Protocol Token";
    string constant public symbol = "ZRX";
    // solhint-enableconst-name-snakecase

    function ZRXToken()
        public
    {
        balances[msg.sender] = totalSupply;
    }
}
