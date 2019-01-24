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

pragma solidity ^0.5.2;


contract MSignatureValidator {

    // Allowed signature types.
    enum SignatureType {
        Illegal,         // 0x00, default value
        EIP712,          // 0x01
        EthSign,         // 0x02
        NSignatureTypes  // 0x03, number of signature types. Always leave at end.
    }

    /// @dev Recovers the address of a signer given a hash and signature.
    /// @param hash Any 32 byte hash.
    /// @param signature Proof that the hash has been signed by signer.
    function getAddressFromSignature(bytes32 hash, bytes memory signature)
        internal
        pure
        returns (address signerAddress);
}