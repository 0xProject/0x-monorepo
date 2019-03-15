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

import "./LibConstants.sol";

contract LibEIP712Domain is
    LibConstants
{

    // EIP191 header for EIP712 prefix
    string constant internal EIP191_HEADER = "\x19\x01";

    // EIP712 Domain Name value for the Coordinator
    string constant internal EIP712_COORDINATOR_DOMAIN_NAME = "0x Protocol Coordinator";

    // EIP712 Domain Version value for the Coordinator
    string constant internal EIP712_COORDINATOR_DOMAIN_VERSION = "1.0.0";

    // EIP712 Domain Name value for the Exchange
    string constant internal EIP712_EXCHANGE_DOMAIN_NAME = "0x Protocol";

    // EIP712 Domain Version value for the Exchange
    string constant internal EIP712_EXCHANGE_DOMAIN_VERSION = "2";


    // Hash of the EIP712 Domain Separator Schema
    bytes32 constant internal EIP712_DOMAIN_SEPARATOR_SCHEMA_HASH = keccak256(abi.encodePacked(
        "EIP712Domain(",
        "string name,",
        "string version,",
        "address verifyingContract",
        ")"
    ));

    // Hash of the EIP712 Domain Separator data for the Coordinator
    // solhint-disable-next-line var-name-mixedcase
    bytes32 public EIP712_COORDINATOR_DOMAIN_HASH;

    // Hash of the EIP712 Domain Separator data for the Exchange
    // solhint-disable-next-line var-name-mixedcase
    bytes32 public EIP712_EXCHANGE_DOMAIN_HASH;

    constructor ()
        public
    {
        EIP712_COORDINATOR_DOMAIN_HASH = keccak256(abi.encodePacked(
            EIP712_DOMAIN_SEPARATOR_SCHEMA_HASH,
            keccak256(bytes(EIP712_COORDINATOR_DOMAIN_NAME)),
            keccak256(bytes(EIP712_COORDINATOR_DOMAIN_VERSION)),
            uint256(address(this))
        ));

        EIP712_EXCHANGE_DOMAIN_HASH = keccak256(abi.encodePacked(
            EIP712_DOMAIN_SEPARATOR_SCHEMA_HASH,
            keccak256(bytes(EIP712_EXCHANGE_DOMAIN_NAME)),
            keccak256(bytes(EIP712_EXCHANGE_DOMAIN_VERSION)),
            uint256(address(EXCHANGE))
        ));
    }

    /// @dev Calculates EIP712 encoding for a hash struct in the EIP712 domain
    ///      of this contract.
    /// @param hashStruct The EIP712 hash struct.
    /// @return EIP712 hash applied to this EIP712 Domain.
    function hashEIP712CoordinatorMessage(bytes32 hashStruct)
        internal
        view
        returns (bytes32 result)
    {
        return hashEIP712Message(EIP712_COORDINATOR_DOMAIN_HASH, hashStruct);
    }

    /// @dev Calculates EIP712 encoding for a hash struct in the EIP712 domain
    ///      of the Exchange contract.
    /// @param hashStruct The EIP712 hash struct.
    /// @return EIP712 hash applied to the Exchange EIP712 Domain.
    function hashEIP712ExchangeMessage(bytes32 hashStruct)
        internal
        view
        returns (bytes32 result)
    {
        return hashEIP712Message(EIP712_EXCHANGE_DOMAIN_HASH, hashStruct);
    }

    /// @dev Calculates EIP712 encoding for a hash struct with a given domain hash.
    /// @param eip712DomainHash Hash of the domain domain separator data.
    /// @param hashStruct The EIP712 hash struct.
    /// @return EIP712 hash applied to the Exchange EIP712 Domain.
    function hashEIP712Message(bytes32 eip712DomainHash, bytes32 hashStruct)
        internal
        pure
        returns (bytes32 result)
    {
        // Assembly for more efficient computing:
        // keccak256(abi.encodePacked(
        //     EIP191_HEADER,
        //     EIP712_COORDINATOR_DOMAIN_HASH,
        //     hashStruct
        // ));

        assembly {
            // Load free memory pointer
            let memPtr := mload(64)

            mstore(memPtr, 0x1901000000000000000000000000000000000000000000000000000000000000)  // EIP191 header
            mstore(add(memPtr, 2), eip712DomainHash)                                            // EIP712 domain hash
            mstore(add(memPtr, 34), hashStruct)                                                 // Hash of struct

            // Compute hash
            result := keccak256(memPtr, 66)
        }
        return result;
    }
}
