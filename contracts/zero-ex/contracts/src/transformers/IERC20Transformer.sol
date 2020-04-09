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

pragma solidity ^0.6.5;
pragma experimental ABIEncoderV2;

import "@0x/contracts-erc20/contracts/src/v06/IERC20TokenV06.sol";


/// @dev A transformation callback used in `TransformERC20.transformERC20()`.
interface IERC20Transformer {

    /// @dev Called from `TransformERC20.transformERC20()`, AFTER the requested
    ///      ERC20 tokens have been transferred to this contract.
    ///      If ETH is requested, it will be attached to this call.
    ///      The caller's entire balance of requested tokens/ETH will be transferred,
    ///      so any unused tokens/ETH should be returned to `msg.sender` before
    ///      returning.
    /// @param callDataHash The hash of the `TransformERC20.transformERC20()` calldata.
    /// @param taker The taker address (caller of `TransformERC20.transformERC20()`).
    /// @param tokens The tokens that were transferred to this contract. ETH may
    ///        be included as 0xeee...
    /// @param amounts The amount of each token in `tokens` that were transferred
    ///        to this contract.
    /// @param data Arbitrary data to pass to the transformer.
    /// @return success `0x13c9929e` on success.
    function transform(
        bytes32 callDataHash,
        address payable taker,
        IERC20TokenV06[] calldata tokens,
        uint256[] calldata amounts,
        bytes calldata data
    )
        external
        payable
        returns (bytes4 success);
}
