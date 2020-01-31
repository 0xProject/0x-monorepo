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


library LibWethUtilsRichErrors {

    // bytes4(keccak256("UnregisteredAssetProxyError()"))
    bytes4 internal constant UNREGISTERED_ASSET_PROXY_ERROR_SELECTOR =
        0xf3b96b8d;

    // bytes4(keccak256("InsufficientEthForFeeError(uint256,uint256)"))
    bytes4 internal constant INSUFFICIENT_ETH_FOR_FEE_ERROR_SELECTOR =
        0xecf40fd9;

    // bytes4(keccak256("DefaultFunctionWethContractOnlyError(address)"))
    bytes4 internal constant DEFAULT_FUNCTION_WETH_CONTRACT_ONLY_ERROR_SELECTOR =
        0x08b18698;

    // bytes4(keccak256("EthFeeLengthMismatchError(uint256,uint256)"))
    bytes4 internal constant ETH_FEE_LENGTH_MISMATCH_ERROR_SELECTOR =
        0x3ecb6ceb;

    // solhint-disable func-name-mixedcase
    function UnregisteredAssetProxyError()
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(UNREGISTERED_ASSET_PROXY_ERROR_SELECTOR);
    }

    function InsufficientEthForFeeError(
        uint256 ethFeeRequired,
        uint256 ethAvailable
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            INSUFFICIENT_ETH_FOR_FEE_ERROR_SELECTOR,
            ethFeeRequired,
            ethAvailable
        );
    }

    function DefaultFunctionWethContractOnlyError(
        address senderAddress
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            DEFAULT_FUNCTION_WETH_CONTRACT_ONLY_ERROR_SELECTOR,
            senderAddress
        );
    }

    function EthFeeLengthMismatchError(
        uint256 ethFeesLength,
        uint256 feeRecipientsLength
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            ETH_FEE_LENGTH_MISMATCH_ERROR_SELECTOR,
            ethFeesLength,
            feeRecipientsLength
        );
    }
}
