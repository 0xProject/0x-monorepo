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

pragma solidity ^0.5.5;

import "../core/MixinSignatureValidator.sol";


contract MixinSignatureValidatorWrapper is
    MixinSignatureValidator
{

    /// @dev Verifies that a hash has been signed by the given signer.
    /// @param hash Any 32 byte hash.
    /// @param signerAddress Address that should have signed the given hash.
    /// @param signature Proof that the hash has been signed by signer.
    /// @return True if the address recovered from the provided signature matches the input signer address.
    function isValidSignature(
        bytes32 hash,
        address signerAddress,
        bytes memory signature
    )
        internal
        view
        returns (bool isValid)
    {
        return _isValidSignature(hash, signerAddress, signature);
    }
}