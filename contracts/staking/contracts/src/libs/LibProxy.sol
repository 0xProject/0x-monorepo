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

import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "./LibStakingRichErrors.sol";


library LibProxy {

    enum RevertRule {
        REVERT_ON_ERROR,
        ALWAYS_REVERT,
        NEVER_REVERT
    }

    /// @dev Proxies incoming call to destination contract.
    /// @param destination Address to call.
    /// @param revertRule Describes scenarios in which this function reverts.
    /// @param customEgressSelector Custom selector used to call destination contract.
    /// @param ignoreIngressSelector Ignore the selector used to call into this contract.
    function proxyCall(
        address destination,
        RevertRule revertRule,
        bytes4 customEgressSelector,
        bool ignoreIngressSelector
    )
        internal
    {
        if (destination == address(0)) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.ProxyDestinationCannotBeNil()
            );
        }

        assembly {
            // store selector of destination function
            let freeMemPtr := 0
            if gt(customEgressSelector, 0) {
                mstore(0x0, customEgressSelector)
                freeMemPtr := add(freeMemPtr, 4)
            }

            // adjust the calldata offset, if we should ignore the selector
            let calldataOffset := 0
            if gt(ignoreIngressSelector, 0) {
                calldataOffset := 4
            }

            // copy calldata to memory
            calldatacopy(
                freeMemPtr,
                calldataOffset,
                calldatasize()
            )
            freeMemPtr := add(
                freeMemPtr,
                sub(calldatasize(), calldataOffset)
            )

            // delegate call into staking contract
            let success := delegatecall(
                gas,                        // forward all gas
                destination,                // calling staking contract
                0x0,                        // start of input (calldata)
                freeMemPtr,                 // length of input (calldata)
                0x0,                        // write output over input
                0                           // length of output is unknown
            )

            // copy return data to memory and *return*
            returndatacopy(
                0x0,
                0x0,
                returndatasize()
            )

            switch revertRule
            case 1 {    // ALWAYS_REVERT
                revert(0, returndatasize())
            }
            case 2 {    // NEVER_REVERT
                return(0, returndatasize())
            }
            // solhint-disable no-empty-blocks
            default {} // REVERT_ON_ERROR (handled below)

            // rethrow any exceptions
            if iszero(success) {
                revert(0, returndatasize())
            }
            // return call results
            return(0, returndatasize())
        }
    }
}
