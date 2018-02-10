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

/// @dev Provides MSignatureValidator
contract MixinSignatureValidator is
    MSignatureValidator
{
    enum SignatureType {
        Invalid,
        Ecrecover
    }
  
    function isValidSignature(
        bytes32 hash,
        address signer,
        bytes signature)
        public view
        returns (bool isValid)
    {
        require(signature.length >= 1);
        
        // Select signature type
        SignatureType stype = SignatureType(uint8(signature[0]));
        if (stype != SignatureType.Ecrecover) {
            valid = false;
            return;
        }
        
        // Verify using ecrecover
        require(signature.length == 66);
        uint8 v = uint8(signature[1]);
        bytes32 r = get32(signature, 2);
        bytes32 s = get32(signature, 34);
        address recovered = ecrecover(
            keccak256("\x19Ethereum Signed Message:\n32", hash),
            v,
            r,
            s
        );
        isValid = signer == recovered;
    }
    
    function get32(bytes b, uint256 index)
        private pure
        returns (bytes32 result)
    {
        // require(b.length >= index + 32);
        
        // Arrays are prefixed by a 256 bit length parameter
        index += 32;
        
        // Read the bytes32 from array memory
        assembly {
            result := mload(add(b, index))
        }
    }

}
