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

import "@0x/contracts-utils/contracts/src/v06/interfaces/IAuthorizableV06.sol";


/// @dev The allowance target for the TokenSpender feature.
interface IAllowanceTarget is
    IAuthorizableV06
{
    /// @dev Execute an arbitrary call. Only an authority can call this. Returns raw (unencoded) return data from the call.
    /// @param target The call target.
    /// @param callData The call data.
    function executeCall(
        address payable target,
        bytes calldata callData
    )
        external;

    /// @dev Execute an ERC20 transferFrom. Only an authority can call this. Returns raw (unencoded) return data from the call.
    /// @param token The ERC20 token address.
    /// @param sender The token sender.
    /// @param recipient The token recipient.
    /// @param amount The amount to transfer.
    function transferFrom(
        address token,
        address sender,
        address recipient,
        uint256 amount
    )
        external;
}
