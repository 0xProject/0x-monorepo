/*

  Copyright 2019 ZeroEx Intl.

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

pragma solidity ^0.5.15;

import "@0x/contracts-erc20/contracts/src/interfaces/IERC20Token.sol";


contract IGasToken is IERC20Token {

    /// @dev Frees up to `value` sub-tokens
    /// @param value The amount of tokens to free
    /// @return How many tokens were freed
    function freeUpTo(uint256 value) external returns (uint256 freed);

    /// @dev Frees up to `value` sub-tokens owned by `from`
    /// @param from The owner of tokens to spend
    /// @param value The amount of tokens to free
    /// @return How many tokens were freed
    function freeFromUpTo(address from, uint256 value) external returns (uint256 freed);

    /// @dev Mints `value` amount of tokens
    /// @param value The amount of tokens to mint
    function mint(uint256 value) external;
}
