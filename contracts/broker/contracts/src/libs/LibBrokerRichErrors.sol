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


library LibBrokerRichErrors {


    // bytes4(keccak256("InvalidFromAddressError(address)"))
    bytes4 internal constant INVALID_FROM_ADDRESS_ERROR_SELECTOR =
        0x906bfb3c;

    // bytes4(keccak256("AmountsLengthMustEqualOneError(uint256)"))
    bytes4 internal constant AMOUNTS_LENGTH_MUST_EQUAL_ONE_ERROR_SELECTOR =
        0xba9be200;

    // bytes4(keccak256("TooFewBrokerAssetsProvidedError(uint256)"))
    bytes4 internal constant TOO_FEW_BROKER_ASSETS_PROVIDED_ERROR_SELECTOR =
        0x55272586;

    // bytes4(keccak256("InvalidFunctionSelectorError(bytes4)"))
    bytes4 internal constant INVALID_FUNCTION_SELECTOR_ERROR_SELECTOR =
        0x540943f1;

    // solhint-disable func-name-mixedcase
    function InvalidFromAddressError(
        address from
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            INVALID_FROM_ADDRESS_ERROR_SELECTOR,
            from
        );
    }

    function AmountsLengthMustEqualOneError(
        uint256 amountsLength
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            AMOUNTS_LENGTH_MUST_EQUAL_ONE_ERROR_SELECTOR,
            amountsLength
        );
    }

    function TooFewBrokerAssetsProvidedError(
        uint256 numBrokeredAssets
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            TOO_FEW_BROKER_ASSETS_PROVIDED_ERROR_SELECTOR,
            numBrokeredAssets
        );
    }

    function InvalidFunctionSelectorError(
        bytes4 selector
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            INVALID_FUNCTION_SELECTOR_ERROR_SELECTOR,
            selector
        );
    }
}
