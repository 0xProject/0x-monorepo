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

import "@0x/contracts-utils/contracts/src/RichErrors.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "./mixins/MExchangeRichErrors.sol";


contract MixinExchangeRichErrors is
    RichErrors,
    MExchangeRichErrors
{
    // solhint-disable func-name-mixedcase
    function SignatureError(
        SignatureErrorCodes error,
        bytes32 orderHash,
        address signer,
        bytes memory signature
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            SIGNATURE_ERROR_SELECTOR,
            error,
            orderHash,
            signer,
            signature
        );
    }

    function SignatureValidatorError(
        bytes32 orderHash,
        address signer,
        bytes memory signature,
        bytes memory errorData
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            SIGNATURE_VALIDATOR_ERROR_SELECTOR,
            orderHash,
            signer,
            signature,
            errorData
        );
    }

    function SignatureWalletError(
        bytes32 orderHash,
        address signer,
        bytes memory signature,
        bytes memory errorData
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            SIGNATURE_WALLET_ERROR_SELECTOR,
            orderHash,
            signer,
            signature,
            errorData
        );
    }

    function SignatureOrderValidatorError(
        bytes32 orderHash,
        address signer,
        bytes memory signature,
        bytes memory errorData
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            SIGNATURE_ORDER_VALIDATOR_ERROR_SELECTOR,
            orderHash,
            signer,
            signature,
            errorData
        );
    }

    function SignatureWalletOrderValidatorError(
        bytes32 orderHash,
        address wallet,
        bytes memory signature,
        bytes memory errorData
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            SIGNATURE_WALLET_ORDER_VALIDATOR_ERROR_SELECTOR,
            orderHash,
            wallet,
            signature,
            errorData
        );
    }

    function OrderStatusError(
        LibOrder.OrderStatus orderStatus,
        bytes32 orderHash
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            ORDER_STATUS_ERROR_SELECTOR,
            orderStatus,
            orderHash
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
        FillErrorCodes error,
        bytes32 orderHash
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            FILL_ERROR_SELECTOR,
            error,
            orderHash
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

    function OrderEpochError(
        address maker,
        address sender,
        uint256 currentEpoch
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            ORDER_EPOCH_ERROR_SELECTOR,
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
        AssetProxyDispatchErrorCodes error,
        bytes32 orderHash,
        bytes memory assetData
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            ASSET_PROXY_DISPATCH_ERROR_SELECTOR,
            error,
            orderHash,
            assetData
        );
    }

    function AssetProxyTransferError(
        bytes32 orderHash,
        bytes memory assetData,
        bytes memory errorData
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            ASSET_PROXY_TRANSFER_ERROR_SELECTOR,
            orderHash,
            assetData,
            errorData
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

    function TransactionError(
        TransactionErrorCodes error,
        bytes32 transactionHash
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            TRANSACTION_ERROR_SELECTOR,
            error,
            transactionHash
        );
    }

    function TransactionSignatureError(
        bytes32 transactionHash,
        address signer,
        bytes memory signature
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            TRANSACTION_SIGNATURE_ERROR_SELECTOR,
            transactionHash,
            signer,
            signature
        );
    }

    function TransactionExecutionError(
        bytes32 transactionHash,
        bytes memory errorData
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            TRANSACTION_EXECUTION_ERROR_SELECTOR,
            transactionHash,
            errorData
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
