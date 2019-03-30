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

import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "./mixins/MRichErrors.sol";


contract MixinRichErrors is
    LibRichErrors,
    MRichErrors
{
    // solhint-disable func-name-mixedcase
    function SignatureError(
        bytes32 orderHash,
        SignatureErrorCodes error
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            SIGNATURE_ERROR_SELECTOR,
            orderHash,
            error
        );
    }

    function OrderStatusError(
        bytes32 orderHash,
        LibOrder.OrderStatus orderStatus
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            ORDER_STATUS_ERROR_SELECTOR,
            orderHash,
            uint8(orderStatus)
        );
    }

    function InvalidSenderError(
        bytes32 orderHash,
        address sender
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            INVALID_SENDER_ERROR_SELECTOR,
            orderHash,
            sender
        );
    }

    function InvalidMakerError(
        bytes32 orderHash,
        address maker
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            INVALID_MAKER_ERROR_SELECTOR,
            orderHash,
            maker
        );
    }

    function FillError(
        bytes32 orderHash,
        FillErrorCodes error
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            FILL_ERROR_SELECTOR,
            orderHash,
            uint8(error)
        );
    }

    function InvalidTakerError(
        bytes32 orderHash,
        address taker
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            INVALID_TAKER_ERROR_SELECTOR,
            orderHash,
            taker
        );
    }

    function EpochOrderError(
        address maker,
        address sender,
        uint256 currentEpoch
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            EPOCH_ORDER_ERROR_SELECTOR,
            maker,
            sender,
            currentEpoch
        );
    }

    function AssetProxyExistsError(
        address proxyAddress
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            ASSET_PROXY_EXISTS_ERROR_SELECTOR,
            proxyAddress
        );
    }

    function AssetProxyDispatchError(
        bytes32 orderHash,
        bytes memory assetData,
        AssetProxyDispatchErrorCodes error
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            ASSET_PROXY_DISPATCH_ERROR_SELECTOR,
            orderHash,
            assetData,
            uint8(error)
        );
    }

    function AssetProxyTransferError(
        bytes32 orderHash,
        bytes memory assetData,
        string memory errorMessage
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            ASSET_PROXY_TRANSFER_ERROR_SELECTOR,
            orderHash,
            assetData,
            errorMessage
        );
    }

    function NegativeSpreadError(
        bytes32 leftOrderHash,
        bytes32 rightOrderHash
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            NEGATIVE_SPREAD_ERROR_SELECTOR,
            leftOrderHash,
            rightOrderHash
        );
    }

    function TransactionExecutionError(
        TransactionExecutionErrorCodes error
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            TRANSACTION_EXECUTION_ERROR_SELECTOR,
            error
        );
    }

    function IncompleteFillError(
        bytes32 orderHash
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            INCOMPLETE_FILL_ERROR_SELECTOR,
            orderHash
        );
    }
}
