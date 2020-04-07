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


/// @dev Storage helpers for the `Ownable` feature.
library LibOwnableStorage {

    /// @dev Globally unique offset for the storage bucket.
    bytes32 constant internal STORAGE_ID =
        0xeef73acb590dd70cb88ccc8e9832ea7f198de2f3c87ff92d610497d647795b3c;

    /// @dev Storage bucket for this feature.
    struct Storage {
        // The owner of this contract.
        address owner;
    }

    /// @dev Get the storage bucket for this contract.
    function getStorage() internal pure returns (Storage storage stor) {
        bytes32 storageId = STORAGE_ID;
        assembly { stor_slot := storageId }
    }
}
