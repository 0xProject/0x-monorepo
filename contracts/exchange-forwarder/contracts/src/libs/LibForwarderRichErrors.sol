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
    bytes internal constant UNREGISTERED_ASSET_PROXY_ERROR =
        hex"f3b96b8d";

    // bytes4(keccak256("UnsupportedAssetProxyError(bytes4)"))
    bytes4 internal constant UNSUPPORTED_ASSET_PROXY_ERROR_SELECTOR =
        0x7996a271;

    // bytes4(keccak256("CompleteBuyFailedError(uint256,uint256)"))
    bytes4 internal constant COMPLETE_BUY_FAILED_ERROR_SELECTOR =
        0x91353a0c;

    // bytes4(keccak256("MakerAssetMismatchError(bytes,bytes)"))
    bytes4 internal constant MAKER_ASSET_MISMATCH_ERROR_SELECTOR =
        0x56677f2c;

    // bytes4(keccak256("UnsupportedFeeError(bytes)"))
    bytes4 internal constant UNSUPPORTED_FEE_ERROR_SELECTOR =
        0x31360af1;

    // bytes4(keccak256("FeePercentageTooLargeError(uint256)"))
    bytes4 internal constant FEE_PERCENTAGE_TOO_LARGE_ERROR_SELECTOR =
        0x1174fb80;

    // bytes4(keccak256("InsufficientEthForFeeError(uint256,uint256)"))
    bytes4 internal constant INSUFFICIENT_ETH_FOR_FEE_ERROR_SELECTOR =
        0xecf40fd9;

    // bytes4(keccak256("OversoldWethError(uint256,uint256)"))
    bytes4 internal constant OVERSOLD_WETH_ERROR_SELECTOR =
        0x5cc555c8;

    // bytes4(keccak256("TransferFailedError(bytes)"))
    bytes4 internal constant TRANSFER_FAILED_ERROR_SELECTOR =
        0x5e7eb60f;

    // bytes4(keccak256("DefaultFunctionWethContractOnlyError(address)"))
    bytes4 internal constant DEFAULT_FUNCTION_WETH_CONTRACT_ONLY_ERROR_SELECTOR =
        0x08b18698;

    // bytes4(keccak256("MsgValueCantEqualZeroError()"))
    bytes internal constant MSG_VALUE_CANT_EQUAL_ZERO_ERROR =
        hex"1213e1d6";

    // bytes4(keccak256("Erc721AmountMustEqualOneError(uint256)"))
    bytes4 internal constant ERC721_AMOUNT_MUST_EQUAL_ONE_ERROR_SELECTOR =
        0xbaffa474;

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

    function CompleteBuyFailedError(
        uint256 expectedAssetBuyAmount,
        uint256 actualAssetBuyAmount
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            COMPLETE_BUY_FAILED_ERROR_SELECTOR,
            expectedAssetBuyAmount,
            actualAssetBuyAmount
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

    function UnsupportedFeeError(
        bytes memory takerFeeAssetData
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            UNSUPPORTED_FEE_ERROR_SELECTOR,
            takerFeeAssetData
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

    function TransferFailedError(
        bytes memory errorData
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            TRANSFER_FAILED_ERROR_SELECTOR,
            errorData
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

    function MsgValueCantEqualZeroError()
        internal
        pure
        returns (bytes memory)
    {
        return MSG_VALUE_CANT_EQUAL_ZERO_ERROR;
    }

    function Erc721AmountMustEqualOneError(
        uint256 amount
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            ERC721_AMOUNT_MUST_EQUAL_ONE_ERROR_SELECTOR,
            amount
        );
    }

}
