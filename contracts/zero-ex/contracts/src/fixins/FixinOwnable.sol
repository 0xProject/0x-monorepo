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

import "../errors/LibOwnableRichErrors.sol";
import "../storage/LibOwnableStorage.sol";
import "./FixinCommon.sol";


/// @dev A feature mixin for restricting callers to owners.
contract FixinOwnable is
    FixinCommon
{
    /// @dev The caller of this function must be the owner.
    modifier onlyOwner() {
        {
            address owner = _getOwner();
            if (msg.sender != owner) {
                _rrevert(LibOwnableRichErrors.OnlyOwnerError(
                    msg.sender,
                    owner
                ));
            }
        }
        _;
    }

    /// @dev Get the owner of this contract.
    /// @return owner The owner of this contract.
    function _getOwner() internal view returns (address owner) {
        return LibOwnableStorage.getStorage().owner;
    }
}
