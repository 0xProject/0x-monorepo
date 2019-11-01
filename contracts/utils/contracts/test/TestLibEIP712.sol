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

import "../src/LibEIP712.sol";


contract TestLibEIP712 {

    function externalHashEIP712DomainSeperator(
        string calldata name,
        string calldata version,
        uint256 chainid,
        address verifyingcontractaddress
    )
        external
        pure
        returns (bytes32)
    {
        return LibEIP712.hashEIP712Domain(
            name,
            version,
            chainid,
            verifyingcontractaddress
        );
    }

    function externalHashEIP712Message(bytes32 eip712DomainHash, bytes32 hashStruct)
        external
        pure
        returns (bytes32)
    {
        return LibEIP712.hashEIP712Message(eip712DomainHash, hashStruct);
    }
}
