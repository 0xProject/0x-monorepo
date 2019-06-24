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

pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;

import "@0x/contracts-utils/contracts/src/LibEIP712.sol";
import "../src/LibEIP712ExchangeDomain.sol";
import "../src/LibMath.sol";
import "../src/LibOrder.sol";
import "../src/LibZeroExTransaction.sol";
import "../src/LibFillResults.sol";


// solhint-disable no-empty-blocks
contract TestLibs is
    LibEIP712ExchangeDomain,
    LibMath,
    LibOrder,
    LibZeroExTransaction,
    LibFillResults
{
    constructor (uint256 chainId)
        public
        LibEIP712ExchangeDomain(chainId, address(0))
    {}

    function getPartialAmountFloor(
        uint256 numerator,
        uint256 denominator,
        uint256 target
    )
        public
        pure
        returns (uint256 partialAmount)
    {
        partialAmount = _getPartialAmountFloor(
            numerator,
            denominator,
            target
        );
        return partialAmount;
    }

    function getPartialAmountCeil(
        uint256 numerator,
        uint256 denominator,
        uint256 target
    )
        public
        pure
        returns (uint256 partialAmount)
    {
        partialAmount = _getPartialAmountCeil(
            numerator,
            denominator,
            target
        );
        return partialAmount;
    }

    function isRoundingErrorFloor(
        uint256 numerator,
        uint256 denominator,
        uint256 target
    )
        public
        pure
        returns (bool isError)
    {
        isError = _isRoundingErrorFloor(
            numerator,
            denominator,
            target
        );
        return isError;
    }

    function isRoundingErrorCeil(
        uint256 numerator,
        uint256 denominator,
        uint256 target
    )
        public
        pure
        returns (bool isError)
    {
        isError = _isRoundingErrorCeil(
            numerator,
            denominator,
            target
        );
        return isError;
    }

    function getOrderSchemaHash()
        public
        pure
        returns (bytes32)
    {
        return EIP712_ORDER_SCHEMA_HASH;
    }

    function getDomainSeparatorSchemaHash()
        public
        pure
        returns (bytes32)
    {
        return LibEIP712._getDomainSeparatorSchemaHash();
    }

    function getDomainSeparator()
        public
        view
        returns (bytes32)
    {
        return EIP712_EXCHANGE_DOMAIN_HASH;
    }

    function addFillResults(FillResults memory totalFillResults, FillResults memory singleFillResults)
        public
        pure
        returns (FillResults memory)
    {
        _addFillResults(totalFillResults, singleFillResults);
        return totalFillResults;
    }
}
