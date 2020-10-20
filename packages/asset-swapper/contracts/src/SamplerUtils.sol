/*

  Copyright 2020 ZeroEx Intl.

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

pragma solidity ^0.6;
pragma experimental ABIEncoderV2;

import "@0x/contracts-erc20/contracts/src/v06/LibERC20TokenV06.sol";


contract SamplerUtils {

    /// @dev Overridable way to get token decimals.
    /// @param tokenAddress Address of the token.
    /// @return decimals The decimal places for the token.
    function _getTokenDecimals(address tokenAddress)
        virtual
        internal
        view
        returns (uint8 decimals)
    {
        return LibERC20TokenV06.compatDecimals(IERC20TokenV06(tokenAddress));
    }

    function _toSingleValueArray(uint256 v)
        internal
        pure
        returns (uint256[] memory arr)
    {
        arr = new uint256[](1);
        arr[0] = v;
    }

    /// @dev Assert that the tokens in a trade pair are valid.
    /// @param makerToken Address of the maker token.
    /// @param takerToken Address of the taker token.
    function _assertValidPair(address makerToken, address takerToken)
        internal
        pure
    {
        require(makerToken != takerToken, "ERC20BridgeSampler/INVALID_TOKEN_PAIR");
    }
}
