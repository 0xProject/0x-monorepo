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

import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "./mixins/MSignatureValidator.sol";


contract MixinSignatureValidator is
    MSignatureValidator
{
    using LibBytes for bytes;

    /// @dev Recovers the address of a signer given a hash and signature.
    /// @param hash Any 32 byte hash.
    /// @param signature Proof that the hash has been signed by signer.
    function getSignerAddress(bytes32 hash, bytes memory signature)
        public
        pure
        returns (address signerAddress)
    {
        require(
            signature.length > 0,
            "LENGTH_GREATER_THAN_0_REQUIRED"
        );

        // Pop last byte off of signature byte array.
        uint8 signatureTypeRaw = uint8(signature.popLastByte());

        // Ensure signature is supported
        require(
            signatureTypeRaw < uint8(SignatureType.NSignatureTypes),
            "SIGNATURE_UNSUPPORTED"
        );

        SignatureType signatureType = SignatureType(signatureTypeRaw);

        // Always illegal signature.
        // This is always an implicit option since a signer can create a
        // signature array with invalid type or length. We may as well make
        // it an explicit option. This aids testing and analysis. It is
        // also the initialization value for the enum type.
        if (signatureType == SignatureType.Illegal) {
            revert("SIGNATURE_ILLEGAL");

        // Always invalid signature.
        // Like Illegal, this is always implicitly available and therefore
        // offered explicitly. It can be implicitly created by providing
        // a correctly formatted but incorrect signature.
        } else if (signatureType == SignatureType.Invalid) {
            require(
                signature.length == 0,
                "LENGTH_0_REQUIRED"
            );
            revert("SIGNATURE_INVALID");

        // Signature using EIP712
        } else if (signatureType == SignatureType.EIP712) {
            require(
                signature.length == 65,
                "LENGTH_65_REQUIRED"
            );
            uint8 v = uint8(signature[0]);
            bytes32 r = signature.readBytes32(1);
            bytes32 s = signature.readBytes32(33);
            signerAddress = ecrecover(
                hash,
                v,
                r,
                s
            );
            return signerAddress;

        // Signed using web3.eth_sign
        } else if (signatureType == SignatureType.EthSign) {
            require(
                signature.length == 65,
                "LENGTH_65_REQUIRED"
            );
            uint8 v = uint8(signature[0]);
            bytes32 r = signature.readBytes32(1);
            bytes32 s = signature.readBytes32(33);
            signerAddress = ecrecover(
                keccak256(abi.encodePacked(
                    "\x19Ethereum Signed Message:\n32",
                    hash
                )),
                v,
                r,
                s
            );
            return signerAddress;
        }

        // Anything else is illegal (We do not return false because
        // the signature may actually be valid, just not in a format
        // that we currently support. In this case returning false
        // may lead the caller to incorrectly believe that the
        // signature was invalid.)
        revert("SIGNATURE_UNSUPPORTED");
    }
}
