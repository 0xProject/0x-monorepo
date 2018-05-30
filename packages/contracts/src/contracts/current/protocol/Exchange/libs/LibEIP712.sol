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

contract LibEIP712 {
    string public constant EIP191_HEADER = "\x19\x01";
    bytes32 public constant EIP712_DOMAIN_SEPARATOR_NAME_HASH = keccak256("0x Protocol");

    bytes32 public constant EIP712_DOMAIN_SEPARATOR_VERSION_HASH = keccak256("1");

    bytes32 public constant EIP712_DOMAIN_SEPARATOR_SCHEMA_HASH = keccak256(
        "DomainSeparator(",
        "string name,",
        "string version,",
        "address contract",
        ")"
    );

    function createEIP712Message(bytes32 hashStruct)
        internal
        view
        returns (bytes32 message)
    {
        // TODO: EIP712 is not finalized yet
        // Source: https://github.com/ethereum/EIPs/pull/712
        // TODO: Cache the Domain Separator
        message = keccak256(
            EIP191_HEADER,
            keccak256(
                EIP712_DOMAIN_SEPARATOR_SCHEMA_HASH,
                EIP712_DOMAIN_SEPARATOR_NAME_HASH,
                EIP712_DOMAIN_SEPARATOR_VERSION_HASH,
                bytes32(address(this))
            ),
            hashStruct
        );
        return message;
    }
}