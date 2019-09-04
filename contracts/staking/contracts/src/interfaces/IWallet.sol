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


interface IWallet /* is EIP-1271 */ {

    /// @dev Should return whether the signature provided is valid for the provided data
    /// @param data Arbitrary length data signed on the behalf of address(this)
    /// @param signature Signature byte array associated with _data
    ///
    /// MUST return the bytes4 magic value 0x20c13b0b when function passes.
    /// MUST NOT modify state (using STATICCALL for solc < 0.5, view modifier for solc > 0.5)
    /// MUST allow external calls
    function isValidSignature(
        bytes calldata data,
        bytes calldata signature)
        external
        view
        returns (bytes4 magicValue);
}
