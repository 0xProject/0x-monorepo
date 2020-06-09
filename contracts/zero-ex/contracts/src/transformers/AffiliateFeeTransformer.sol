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

import "@0x/contracts-utils/contracts/src/v06/errors/LibRichErrorsV06.sol";
import "@0x/contracts-utils/contracts/src/v06/LibSafeMathV06.sol";
import "@0x/contracts-erc20/contracts/src/v06/IERC20TokenV06.sol";
import "@0x/contracts-erc20/contracts/src/v06/LibERC20TokenV06.sol";
import "../errors/LibTransformERC20RichErrors.sol";
import "./Transformer.sol";
import "./LibERC20Transformer.sol";


/// @dev A transformer that transfers tokens to arbitrary addresses.
contract AffiliateFeeTransformer is
    Transformer
{
    // solhint-disable no-empty-blocks
    using LibRichErrorsV06 for bytes;
    using LibSafeMathV06 for uint256;
    using LibERC20Transformer for IERC20TokenV06;

    /// @dev Information for a single fee.
    struct TokenFee {
        // The token to transfer to `recipient`.
        IERC20TokenV06 token;
        // Amount of each `token` to transfer to `recipient`.
        // If `amount == uint256(-1)`, the entire balance of `token` will be
        // transferred.
        uint256 amount;
        // Recipient of `token`.
        address payable recipient;
    }

    uint256 private constant MAX_UINT256 = uint256(-1);

    /// @dev Create this contract.
    constructor()
        public
        Transformer()
    {}

    /// @dev Transfers tokens to recipients.
    /// @param data ABI-encoded `TokenFee[]`, indicating which tokens to transfer.
    /// @return success The success bytes (`LibERC20Transformer.TRANSFORMER_SUCCESS`).
    function transform(
        bytes32, // callDataHash,
        address payable, // taker,
        bytes calldata data
    )
        external
        override
        returns (bytes4 success)
    {
        TokenFee[] memory fees = abi.decode(data, (TokenFee[]));

        // Transfer tokens to recipients.
        for (uint256 i = 0; i < fees.length; ++i) {
            uint256 amount = fees[i].amount;
            if (amount == MAX_UINT256) {
                amount = LibERC20Transformer.getTokenBalanceOf(fees[i].token, address(this));
            }
            if (amount != 0) {
                fees[i].token.transformerTransfer(fees[i].recipient, amount);
            }
        }

        return LibERC20Transformer.TRANSFORMER_SUCCESS;
    }
}
