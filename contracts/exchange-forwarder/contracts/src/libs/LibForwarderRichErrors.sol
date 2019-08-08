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

import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";


library LibForwarderRichErrors {

    // bytes4(keccak256("UnregisteredAssetProxyError()"))
    bytes4 internal constant UNREGISTERED_ASSET_PROXY_ERROR_SELECTOR =
        0xf3b96b8d;

    // bytes4(keccak256("UnregisteredAssetProxyError()"))
    bytes internal constant UNREGISTERED_ASSET_PROXY_ERROR =
        hex"f3b96b8d";

    // bytes4(keccak256("UnsupportedAssetProxyError(bytes4)"))
    bytes4 internal constant UNSUPPORTED_ASSET_PROXY_ERROR_SELECTOR =
        0x7996a271;

    // bytes4(keccak256("CompleteFillFailedError(uint256,uint256)"))
    bytes4 internal constant COMPLETE_FILL_FAILED_ERROR_SELECTOR =
        0x7675a605;

    // bytes4(keccak256("MakerAssetMismatchError(bytes,bytes)"))
    bytes4 internal constant MAKER_ASSET_MISMATCH_ERROR_SELECTOR =
        0x56677f2c;

    // bytes4(keccak256("FeePercentageTooLargeError(uint256)"))
    bytes4 internal constant FEE_PERCENTAGE_TOO_LARGE_ERROR_SELECTOR =
        0x1174fb80;

    // bytes4(keccak256("InsufficientEthRemainingError(uint256,uint256)"))
    bytes4 internal constant INSUFFICIENT_ETH_REMAINING_ERROR_SELECTOR =
        0x01b718a6;

    // bytes4(keccak256("OversoldWethError(uint256,uint256)"))
    bytes4 internal constant OVERSOLD_WETH_ERROR_SELECTOR =
        0x5cc555c8;

    // bytes4(keccak256("TransferFailedError()"))
    bytes4 internal constant TRANSFER_FAILED_ERROR_SELECTOR =
        0x570f1df4;

    // bytes4(keccak256("TransferFailedError()"))
    bytes internal constant TRANSFER_FAILED_ERROR =
        hex"570f1df4";

    // bytes4(keccak256("DefaultFunctionWethContractOnlyError(address)"))
    bytes4 internal constant DEFAULT_FUNCTION_WETH_CONTRACT_ONLY_ERROR_SELECTOR =
        0x08b18698;

    // bytes4(keccak256("InvalidMsgValueError()"))
    bytes4 internal constant INVALID_MSG_VALUE_ERROR_SELECTOR =
        0xb0658a43;

    // bytes4(keccak256("InvalidMsgValueError()"))
    bytes internal constant INVALID_MSG_VALUE_ERROR =
        hex"b0658a43";

    // bytes4(keccak256("InvalidErc721AmountError(uint256)"))
    bytes4 internal constant INVALID_ERC721_AMOUNT_ERROR_SELECTOR =
        0x27ed87bf;

    // solhint-disable func-name-mixedcase
    function UnregisteredAssetProxyError()
        internal
        pure
        returns (bytes memory)
    {
        return UNREGISTERED_ASSET_PROXY_ERROR;
    }

    function UnsupportedAssetProxyError(
        bytes4 proxyId
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            UNSUPPORTED_ASSET_PROXY_ERROR_SELECTOR,
            proxyId
        );
    }

    function CompleteFillFailedError(
        uint256 desiredFillAmount,
        uint256 actualFillAmount
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            COMPLETE_FILL_FAILED_ERROR_SELECTOR,
            desiredFillAmount,
            actualFillAmount
        );
    }

    function MakerAssetMismatchError(
        bytes memory firstOrderMakerAssetData,
        bytes memory mismatchedMakerAssetData
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            MAKER_ASSET_MISMATCH_ERROR_SELECTOR,
            firstOrderMakerAssetData,
            mismatchedMakerAssetData
        );
    }

    function FeePercentageTooLargeError(
        uint256 feePercentage
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            FEE_PERCENTAGE_TOO_LARGE_ERROR_SELECTOR,
            feePercentage
        );
    }

    function InsufficientEthRemainingError(
        uint256 ethFee,
        uint256 wethRemaining
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            INSUFFICIENT_ETH_REMAINING_ERROR_SELECTOR,
            ethFee,
            wethRemaining
        );
    }

    function OversoldWethError(
        uint256 wethSold,
        uint256 msgValue
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            OVERSOLD_WETH_ERROR_SELECTOR,
            wethSold,
            msgValue
        );
    }

    function TransferFailedError()
        internal
        pure
        returns (bytes memory)
    {
        return TRANSFER_FAILED_ERROR;
    }

    function DefaultFunctionWethContractOnlyError(
        address callerAddress
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            DEFAULT_FUNCTION_WETH_CONTRACT_ONLY_ERROR_SELECTOR,
            callerAddress
        );
    }

    function InvalidMsgValueError()
        internal
        pure
        returns (bytes memory)
    {
        return INVALID_MSG_VALUE_ERROR;
    }

    function InvalidErc721AmountError(
        uint256 amount
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            INVALID_ERC721_AMOUNT_ERROR_SELECTOR,
            amount
        );
    }

}
