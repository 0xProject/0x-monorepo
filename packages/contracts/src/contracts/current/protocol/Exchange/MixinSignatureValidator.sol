/*

  Copyright 2017 ZeroEx Intl.

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

pragma solidity ^0.4.19;

import "./mixins/MSignatureValidator.sol";
import "./ISigner.sol";

/// @dev Provides MSignatureValidator
contract MixinSignatureValidator is
    MSignatureValidator
{
    enum SignatureType {
        Illegal, // Default value
        Invalid,
        Caller,
        Ecrecover,
        EIP712,
        Contract
    }
  
    function isValidSignature(
        bytes32 hash,
        address signer,
        bytes signature)
        public view
        returns (bool isValid)
    {
        // TODO: Domain separation: make hash depend on role. (Taker sig should not be valid as maker sig, etc.)
        
        require(signature.length >= 1);
        SignatureType signatureType = SignatureType(uint8(signature[0]));
        
        // Variables are not scoped in Solidity
        uint8 v;
        bytes32 r;
        bytes32 s;
        
        // Always illegal signature
        // This is always an implicit option, since a signer can create a
        // signature array with invalid type or length. We may as well make
        // it an explicit option. This aids testing and analysis. It is
        // also the initialization value for the enum type.
        if (signatureType == SignatureType.Illegal) {
            revert();
        
        // Always invalid signature
        // Like Illegal, this is always implicitely available and therefore
        // offered dxplicitely. It can be implicitely creates by providing
        // a validly formatted but incorrect signature.
        } else if (signatureType == SignatureType.Invalid) {
            require(signature.length == 1);
            isValid = false;
            return;
        
        // Implicitly signed by caller
        // The signer has initiated the call. In the case of non-contract
        // accounts it means the transaction itself was signed.
        // Example: lets say for a particular operation three signatures
        // A, B  are required. To submit the transaction, A and B can give
        // a signatue to C, who can then submit the transaction using
        // `Caller` for his own signature. Or A and C can sign and B can
        // submit using `Caller`. Having `Caller` allows this flexibility.
        } else if (signatureType == SignatureType.Caller) {
            require(signature.length == 1);
            isValid = signer == msg.sender;
            return;
        
        // Signed using web3.eth_sign
        } else if (signatureType == SignatureType.Ecrecover) {
            require(signature.length == 66);
            v = uint8(signature[1]);
            r = get32(signature, 2);
            s = get32(signature, 34);
            recovered = ecrecover(
                keccak256("\x19Ethereum Signed Message:\n32", hash),
                v,
                r,
                s
            );
            isValid = signer == recovered;
            return;
            
        // Signature using EIP712
        } else if (signatureType == SignatureType.EIP712) {
            v = uint8(signature[1]);
            r = get32(signature, 2);
            s = get32(signature, 35);
            address recovered = ecrecover(hash, v, r, s);
            isValid = signer == recovered;
            return;
        
        // Signature verified by signer contract
        } else if (signatureType == SignatureType.Contract) {
            isValid = ISigner(signer).isValidSignature(hash, signature);
            return;
        }
        
        // Anything else is illegal (We do not return false because
        // the signature may actually be valid, just not in a format
        // that we currently support. In this case returning false
        // may lead the caller to incorrectly believe that the
        // signature was invalid.)
        revert();
    }
    
    function get32(bytes b, uint256 index)
        private pure
        returns (bytes32 result)
    {
        require(b.length >= index + 32);
        
        // Arrays are prefixed by a 256 bit length parameter
        index += 32;
        
        // Read the bytes32 from array memory
        assembly {
            result := mload(add(b, index))
        }
    }

}
