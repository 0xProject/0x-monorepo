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
import "../errors/LibSpenderRichErrors.sol";
import "../fixins/FixinCommon.sol";
import "../migrations/LibMigrate.sol";
import "../external/IAllowanceTarget.sol";
import "../storage/LibTokenSpenderStorage.sol";
import "./ITokenSpenderFeature.sol";
import "./IFeature.sol";


/// @dev Feature that allows spending token allowances.
contract TokenSpenderFeature is
    IFeature,
    ITokenSpenderFeature,
    FixinCommon
{
    // solhint-disable
    /// @dev Name of this feature.
    string public constant override FEATURE_NAME = "TokenSpender";
    /// @dev Version of this feature.
    uint256 public immutable override FEATURE_VERSION = _encodeVersion(1, 0, 0);
    // solhint-enable

    using LibRichErrorsV06 for bytes;

    /// @dev Initialize and register this feature. Should be delegatecalled
    ///      into during a `Migrate.migrate()`.
    /// @param allowanceTarget An `allowanceTarget` instance, configured to have
    ///        the ZeroeEx contract as an authority.
    /// @return success `MIGRATE_SUCCESS` on success.
    function migrate(IAllowanceTarget allowanceTarget)
        external
        returns (bytes4 success)
    {
        LibTokenSpenderStorage.getStorage().allowanceTarget = allowanceTarget;
        _registerFeatureFunction(this.getAllowanceTarget.selector);
        _registerFeatureFunction(this._spendERC20Tokens.selector);
        _registerFeatureFunction(this.getSpendableERC20BalanceOf.selector);
        return LibMigrate.MIGRATE_SUCCESS;
    }

    /// @dev Transfers ERC20 tokens from `owner` to `to`. Only callable from within.
    /// @param token The token to spend.
    /// @param owner The owner of the tokens.
    /// @param to The recipient of the tokens.
    /// @param amount The amount of `token` to transfer.
    function _spendERC20Tokens(
        IERC20TokenV06 token,
        address owner,
        address to,
        uint256 amount
    )
        external
        override
        onlySelf
    {
        IAllowanceTarget spender = LibTokenSpenderStorage.getStorage().allowanceTarget;

        assembly {
            // bytes4(keccak256("transferFrom(address,address,address,uint256)")) == 0x15dacbea
            mstore(0x00, 0x15dacbea00000000000000000000000000000000000000000000000000000000)
            mstore(0x04, token)
            mstore(0x24, owner)
            mstore(0x44, to)
            mstore(0x64, amount)
            let didSucceed := call(gas(), spender, 0, 0, 0x84, 0, 0)

            let rdsize := returndatasize()

            // 0xc4 will be the right location in the rich revert case below
            returndatacopy(0xc4, 0, rdsize)

            // Check for ERC20 success. ERC20 tokens should return a boolean,
            // but some don't. We accept 0-length return data as success.
            didSucceed := and(
                didSucceed,                 // call itself succeeded and
                or(
                    iszero(rdsize),         // either no return data or
                    and(
                        eq(rdsize, 0x20),   // exactly 32 bytes
                        eq(mload(0xc4), 1)  // and the value is 1 (true)
                    )
                )
            )

            if didSucceed {
                return(0, 0)
            }

            // Rich revert on failure.
            // bytes4(keccak256("SpenderERC20TransferFromFailedError(address,address,address,uint256,bytes)")) == 0xdfdc6f57
            mstore(0x00, 0xdfdc6f5700000000000000000000000000000000000000000000000000000000)
            mstore(0x04, token)
            mstore(0x24, owner)
            mstore(0x44, to)
            mstore(0x64, amount)
            mstore(0x84, 0xa0) // offset to bytes parameter (relative to 0x04)
            mstore(0xa4, rdsize) // length prefix
            // return data is already in 0xc4

            // pad to a multiple of 32 if necessary
            if and(rdsize, 0x1f) {
                mstore(add(0xc4, rdsize), 0) // write extra zeros

                // rdsize = (rdsize + 31) & ~31
                // Adding 31 rounds up to the next multiple of 32, and then
                // & ~31 truncates to a multiple of 32. This is roughly the
                // equivalent of (rdsize + 31) / 32 * 32 (with integer
                // division).
                rdsize := and(add(rdsize, 0x1f), not(0x1f))
            }

            revert(0, add(0xc4, rdsize))
        }
    }

    /// @dev Gets the maximum amount of an ERC20 token `token` that can be
    ///      pulled from `owner` by the token spender.
    /// @param token The token to spend.
    /// @param owner The owner of the tokens.
    /// @return amount The amount of tokens that can be pulled.
    function getSpendableERC20BalanceOf(IERC20TokenV06 token, address owner)
        external
        override
        view
        returns (uint256 amount)
    {
        return LibSafeMathV06.min256(
            token.allowance(owner, address(LibTokenSpenderStorage.getStorage().allowanceTarget)),
            token.balanceOf(owner)
        );
    }

    /// @dev Get the address of the allowance target.
    /// @return target The target of token allowances.
    function getAllowanceTarget()
        external
        override
        view
        returns (address target)
    {
        return address(LibTokenSpenderStorage.getStorage().allowanceTarget);
    }
}
