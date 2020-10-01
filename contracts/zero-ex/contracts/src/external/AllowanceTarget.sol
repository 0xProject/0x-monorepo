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
import "@0x/contracts-utils/contracts/src/v06/AuthorizableV06.sol";
import "../errors/LibSpenderRichErrors.sol";
import "./IAllowanceTarget.sol";


/// @dev The allowance target for the TokenSpender feature.
contract AllowanceTarget is
    IAllowanceTarget,
    AuthorizableV06
{
    // solhint-disable no-unused-vars,indent,no-empty-blocks
    using LibRichErrorsV06 for bytes;

    /// @dev Execute an arbitrary call. Only an authority can call this.
    /// @param target The call target.
    /// @param callData The call data.
    /// @return resultData The data returned by the call.
    function executeCall(
        address payable target,
        bytes calldata callData
    )
        external
        override
        onlyAuthorized
        returns (bytes memory resultData)
    {
        // Gas savings from assembly: 474
        assembly {
            let where := add(calldataload(0x24), 4)
            let cdlen := calldataload(where)
            calldatacopy(0, add(where, 0x20), cdlen)
            let success := call(gas(), target, 0, 0, cdlen, 0, 0)

            if iszero(success) {
                returndatacopy(0, 0, returndatasize())
                revert(0, returndatasize())
            }

            // ABI-encoded return data
            mstore(0, 0x20)                            // offset
            mstore(0x20, returndatasize())             // length prefix
            returndatacopy(0x40, 0, returndatasize())  // data
            return(0, add(returndatasize(), 0x40))
        }
    }
}
