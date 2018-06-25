/*

  Copyright 2018 ZeroEx Intl.

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

pragma solidity ^0.4.24;

/// @dev This contract documents the revert reasons used in the `transferFrom` methods of different AssetProxy contracts.
/// This contract is intended to serve as a reference, but is not actually used for efficiency reasons.
contract LibTransferErrors {

    /// Transfer errors ///
    string constant INVALID_AMOUNT = "INVALID_AMOUNT";                            // Transfer amount must equal 1.
    string constant TRANSFER_FAILED = "TRANSFER_FAILED";                          // Transfer failed.
}
