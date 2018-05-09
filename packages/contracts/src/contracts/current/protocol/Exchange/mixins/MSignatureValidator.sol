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

pragma solidity ^0.4.23;

import "../interfaces/ISignatureValidator.sol";

contract MSignatureValidator is
    ISignatureValidator
{
    // Allowed signature types.
    enum SignatureType {
        Illegal,  // Default value
        Invalid,
        Caller,
        Ecrecover,
        EIP712,
        Trezor,
        Contract,
        PreSigned
    }

    /// @dev Verifies that a signature is valid.
    /// @param hash Message hash that is signed.
    /// @param signer Address of signer.
    /// @param signature Proof of signing.
    /// @return Validity of order signature.
    function isValidSignature(
        bytes32 hash,
        address signer,
        bytes memory signature)
        internal
        view
        returns (bool isValid);
}
