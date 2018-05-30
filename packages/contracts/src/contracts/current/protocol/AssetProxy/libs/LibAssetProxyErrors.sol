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

contract LibAssetProxyErrors {
    /// Authorizable errors ///
    string constant SENDER_NOT_AUTHORIZED = "SENDER_NOT_AUTHORIZED";              // Sender not authorized to call this method.
    string constant TARGET_NOT_AUTHORIZED = "TARGET_NOT_AUTHORIZED";              // Target address not authorized to call this method.
    string constant TARGET_ALREADY_AUTHORIZED = "TARGET_ALREADY_AUTHORIZED";      // Target address must not already be authorized.
    string constant INDEX_OUT_OF_BOUNDS = "INDEX_OUT_OF_BOUNDS";                  // Specified array index is out of bounds.
    string constant AUTHORIZED_ADDRESS_MISMATCH = "AUTHORIZED_ADDRESS_MISMATCH";  // Address at index does not match given target address.

    /// AssetProxy errors ///
    string constant ASSET_PROXY_ID_MISMATCH = "ASSET_PROXY_ID_MISMATCH";          // Proxy id in metadata does not match this proxy id.
    string constant INVALID_AMOUNT = "INVALID_AMOUNT";                            // Transfer amount must equal 1.
    string constant TRANSFER_FAILED = "TRANSFER_FAILED";                          // Transfer failed. 

    /// Length validation errors ///
    string constant LENGTH_21_REQUIRED = "LENGTH_21_REQUIRED";                    // Byte array must have a length of 21.
    string constant LENGTH_53_REQUIRED = "LENGTH_53_REQUIRED";                    // Byte array must have a length of 53.
}
