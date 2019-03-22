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

import "./LibEIP712.sol";
import "./LibEIP712ExchangeDomainConstants.sol";


contract LibEIP712ExchangeDomain is
    LibEIP712,
    LibEIP712ExchangeDomainConstants
{
    // Hash of the EIP712 Domain Separator data
    // solhint-disable-next-line var-name-mixedcase
    bytes32 internal EIP712_EXCHANGE_DOMAIN_HASH;

    constructor ()
        public
    {
        EIP712_EXCHANGE_DOMAIN_HASH = hashEIP712Domain(
            EIP712_EXCHANGE_DOMAIN_NAME,
            EIP712_EXCHANGE_DOMAIN_VERSION,
            address(this)
        );
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
