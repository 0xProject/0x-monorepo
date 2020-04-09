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

import "./LibStorage.sol";
import "../puppets/Puppet.sol";


/// @dev Storage helpers for the `PuppetPool` feature.
library LibPuppetPoolStorage {

    /// @dev The state of a puppet instance.
    enum PuppetState {
        // Not a valid puppet (default)
        Invalid,
        // Puppet is free to be acquired.
        Free,
        // Puppet is currently acquired.
        Acquired
    }

    /// @dev Storage bucket for this feature.
    struct Storage {
        // State of a puppet instance.
        mapping(address => PuppetState) puppetState;
        // Free puppet instances.
        Puppet[] freePuppets;
    }

    /// @dev Get the storage bucket for this contract.
    function getStorage() internal pure returns (Storage storage stor) {
        uint256 storageOffset = LibStorage.getStorageOffset(
            LibStorage.StorageId.PuppetPool
        );
        assembly { stor_slot := storageOffset }
    }
}
