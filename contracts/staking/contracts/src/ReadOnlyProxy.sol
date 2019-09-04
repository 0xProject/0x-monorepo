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

pragma solidity ^0.5.9;

import "./immutable/MixinStorage.sol";


contract ReadOnlyProxy is
    MixinStorage
{

    /// @dev Executes a read-only call to the staking contract, via `revertDelegateCall`.
    ///      By routing through `revertDelegateCall` any state changes are reverted.
    // solhint-disable no-complex-fallback
    function ()
        external
    {
        address thisAddress = address(this);
        bytes4 revertDelegateCallSelector = this.revertDelegateCall.selector;

        assembly {
            // store selector of destination function
            mstore(0x0, revertDelegateCallSelector)

            // copy calldata to memory
            calldatacopy(
                0x4,
                0x0,
                calldatasize()
            )

            // delegate call into staking contract
            let success := delegatecall(
                gas,                        // forward all gas
                thisAddress,                // calling staking contract
                0x0,                        // start of input (calldata)
                add(calldatasize(), 4),     // length of input (calldata)
                0x0,                        // write output over input
                0                           // length of output is unknown
            )

            // copy return data to memory and *return*
            returndatacopy(
                0x0,
                0x0,
                returndatasize()
            )

            return(0, returndatasize())
        }
    }

    /// @dev Executes a delegate call to the staking contract, if it is set.
    ///      This function always reverts with the return data.
    function revertDelegateCall()
        external
    {
        address _readOnlyProxyCallee = readOnlyProxyCallee;
        if (_readOnlyProxyCallee == address(0)) {
            return;
        }

        assembly {
            // copy calldata to memory
            calldatacopy(
                0x0,
                0x4,
                calldatasize()
            )

            // delegate call into staking contract
            let success := delegatecall(
                gas,                        // forward all gas
                _readOnlyProxyCallee,       // calling staking contract
                0x0,                        // start of input (calldata)
                sub(calldatasize(), 4),     // length of input (calldata)
                0x0,                        // write output over input
                0                           // length of output is unknown
            )

            // copy return data to memory and *revert*
            returndatacopy(
                0x0,
                0x0,
                returndatasize()
            )

            revert(0, returndatasize())
        }
    }
}
