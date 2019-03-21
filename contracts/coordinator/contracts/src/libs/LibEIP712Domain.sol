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

import "@0x/contracts-exchange-libs/contracts/src/LibEIP712.sol";
import "./LibConstants.sol";


// solhint-disable var-name-mixedcase
contract LibEIP712Domain is
    LibConstants,
    LibEIP712
{

    // EIP712 Domain Name value for the Coordinator
    string constant internal EIP712_COORDINATOR_DOMAIN_NAME = "0x Protocol Coordinator";

    // EIP712 Domain Version value for the Coordinator
    string constant internal EIP712_COORDINATOR_DOMAIN_VERSION = "1.0.0";

    // Hash of the EIP712 Domain Separator data for the Coordinator
    bytes32 public EIP712_COORDINATOR_DOMAIN_HASH;

    constructor ()
        public
    {
        EIP712_COORDINATOR_DOMAIN_HASH = hashEIP712Domain(
            EIP712_COORDINATOR_DOMAIN_NAME,
            EIP712_COORDINATOR_DOMAIN_VERSION,
            address(this)
        );
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
}
