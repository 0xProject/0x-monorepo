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

        // Gas savings from assembly: 2324
        bytes4 esel = IAllowanceTarget.executeCall.selector;
        bytes4 tsel = IERC20TokenV06.transferFrom.selector;
        bool didSucceed;
        bytes memory resultData;
        assembly {
            let ptr := mload(0x40)
            if iszero(ptr) { ptr := 0x60 }

            mstore(           ptr, esel)   // executeCall.selector  : 4 bytes
            mstore(add(ptr, 0x04), token)  // target                : 32
            mstore(add(ptr, 0x24), 0x40)   // offset to callData    : 32
            mstore(add(ptr, 0x44), 100)    // length of callData    : 32
            mstore(add(ptr, 0x64), tsel)   // transferFrom.selector : 4
            mstore(add(ptr, 0x68), owner)  //                       : 32
            mstore(add(ptr, 0x88), to)     //                       : 32
            mstore(add(ptr, 0xa8), amount) //                       : 32
                                           //                  total: 200

            didSucceed := call(gas(), spender, 0, ptr, 200, 0, 0)

            // Set new free memory pointer, accounting for allocation of
            // max(200, returndatasize()) bytes. We're using at least 200 for
            // the call data, and at least returndatasize() for the result.
            switch gt(add(returndatasize(), 32), 200)
            case 1 {
                mstore(0x40, add(ptr, add(returndatasize(), 32)))
            }
            default {
                mstore(0x40, add(ptr, 200))
            }

            // Reuse memory we just used for call().
            mstore(ptr, returndatasize())
            returndatacopy(add(ptr, 32), 0, returndatasize())

            // In case of failure, we want resultData to be length-prefixed
            // bytes with the exact revert data we got.
            resultData := ptr

            if didSucceed {
                // On a successful call to the AllowanceTarget, return data
                // will be an ABI encoded `bytes`:
                // * First word is 0x20 (offset to returned bytes).
                // * Second word is the length of the returned bytes.
                // * Beyond that is the actual data.

                // In successful calls, we need to ABI decode the return data.
                // Skip to the actual data. This is the equivalent of:
                // resultData = abi.decode(resultData, (bytes))
                resultData := add(resultData, 64)

                let rdlen := mload(resultData)
                if rdlen {
                    // If we have a non-zero length, the length has to be
                    // exactly 64, and the data has to be exactly 1.

                    didSucceed := and(
                        eq(rdlen, 32),
                        eq(mload(add(resultData, 0x20)), 1)
                    )
                }
            }
        }

        if (!didSucceed) {
            LibSpenderRichErrors.SpenderERC20TransferFromFailedError(
                address(token),
                owner,
                to,
                amount,
                resultData
            ).rrevert();
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
