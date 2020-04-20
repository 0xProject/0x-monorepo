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


/// @dev Common storage helpers
library LibStorage {

    /// @dev What to multiply a storage ID by to get its offset.
    ///      This is also the maximum number of fields inside a storage
    ///      bucket.
    uint256 internal constant STORAGE_OFFSET_MULTIPLIER = 1e18;

    /// @dev Storage IDs for feature storage buckets.
    enum StorageId {
        Proxy,
        SimpleFunctionRegistry,
        Ownable,
        Migrate
    }

    /// @dev Get the storage offset given a storage ID.
    /// @param storageId An entry in `StorageId`
    /// @return offset The storage offset.
    function getStorageOffset(StorageId storageId)
        internal
        pure
        returns (uint256 offset)
    {
        return uint256(storageId) * STORAGE_OFFSET_MULTIPLIER;
    }
}
