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
import "../errors/LibCommonRichErrors.sol";
import "../errors/LibOwnableRichErrors.sol";
import "../errors/LibPuppetRichErrors.sol";
import "../features/IOwnable.sol";
import "../features/IPuppetPool.sol";
import "../storage/LibOwnableStorage.sol";


/// @dev Common utilities.
contract FixinCommon {

    using LibRichErrorsV06 for bytes;

    /// @dev The caller must be this contract.
    modifier onlySelf() virtual {
        if (msg.sender != address(this)) {
            LibCommonRichErrors.OnlyCallableBySelfError(msg.sender).rrevert();
        }
        _;
    }

    /// @dev The caller of this function must be the owner.
    modifier onlyOwner() virtual {
        {
            address owner = _getOwner();
            if (msg.sender != owner) {
                LibOwnableRichErrors.OnlyOwnerError(
                    msg.sender,
                    owner
                ).rrevert();
            }
        }
        _;
    }

    /// @dev Get the owner of this contract.
    /// @return owner The owner of this contract.
    function _getOwner() internal virtual view returns (address owner) {
        // We access Ownable's storage directly here instead of using the external
        // API because `onlyOwner` needs to function during bootstrapping.
        return LibOwnableStorage.getStorage().owner;
    }
}
