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

pragma solidity ^0.5.9;


interface IMultiBridge {

    /// @dev Transfers `amount` of the ERC20 `tokenAddress` from `from` to `to`.
    /// @param tokenAddress The address of the ERC20 token to transfer.
    /// @param from Address to transfer asset from.
    /// @param to Address to transfer asset to.
    /// @param amount Amount of asset to transfer.
    /// @param bridgeData Arbitrary asset data needed by the bridge contract.
    /// @return success The magic bytes `0xdc1600f3` if successful.
    function bridgeTransferFrom(
        address tokenAddress,
        address from,
        address to,
        uint256 amount,
        bytes calldata bridgeData
    )
        external
        returns (bytes4 success);

    /// @dev Quotes the amount of `makerToken` that would be obtained by
    ///      selling `sellAmount` of `takerToken`.
    /// @param takerToken Address of the taker token (what to sell).
    /// @param intermediateToken The address of the intermediate token to
    ///        use in an indirect route.
    /// @param makerToken Address of the maker token (what to buy).
    /// @param sellAmount Amount of `takerToken` to sell.
    /// @return makerTokenAmount Amount of `makerToken` that would be obtained.
    function getSellQuote(
        address takerToken,
        address intermediateToken,
        address makerToken,
        uint256 sellAmount
    )
        external
        view
        returns (uint256 makerTokenAmount);
}
