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

import "@0x/contracts-utils/contracts/src/mixins/MRichErrors.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";


contract MExchangeRichErrors is
    MRichErrors
{
    enum FillErrorCodes {
        INVALID_TAKER_AMOUNT,
        TAKER_OVERPAY,
        OVERFILL,
        INVALID_FILL_PRICE
    }

    enum SignatureErrorCodes {
        BAD_SIGNATURE,
        INVALID_LENGTH,
        UNSUPPORTED,
        ILLEGAL,
        WALLET_ERROR,
        VALIDATOR_ERROR
    }

    enum AssetProxyDispatchErrorCodes {
        INVALID_ASSET_DATA_LENGTH,
        UNKNOWN_ASSET_PROXY
    }

    enum TransactionErrorCodes {
        NO_REENTRANCY,
        ALREADY_EXECUTED,
        BAD_SIGNATURE
    }

    // solhint-disable func-name-mixedcase
    bytes4 internal constant SIGNATURE_ERROR_SELECTOR =
        bytes4(keccak256("SignatureError(bytes32,uint8)"));

    function SignatureError(
        bytes32 orderHash,
        SignatureErrorCodes error
    )
        internal
        pure
        returns (bytes memory);

    bytes4 internal constant ORDER_STATUS_ERROR_SELECTOR =
        bytes4(keccak256("OrderStatusError(bytes32,uint8)"));

    function OrderStatusError(
        bytes32 orderHash,
        LibOrder.OrderStatus orderStatus
    )
        internal
        pure
        returns (bytes memory);

    bytes4 internal constant INVALID_SENDER_ERROR_SELECTOR =
        bytes4(keccak256("InvalidSenderError(bytes32,address)"));

    function InvalidSenderError(
        bytes32 orderHash,
        address sender
    )
        internal
        pure
        returns (bytes memory);

    bytes4 internal constant INVALID_MAKER_ERROR_SELECTOR =
        bytes4(keccak256("InvalidMakerError(bytes32,address)"));

    function InvalidMakerError(
        bytes32 orderHash,
        address maker
    )
        internal
        pure
        returns (bytes memory);

    bytes4 internal constant FILL_ERROR_SELECTOR =
        bytes4(keccak256("FillError(bytes32,uint8)"));

    function FillError(
        bytes32 orderHash,
        FillErrorCodes error
    )
        internal
        pure
        returns (bytes memory);

    bytes4 internal constant INVALID_TAKER_ERROR_SELECTOR =
        bytes4(keccak256("InvalidTakerError(bytes32,address)"));

    function InvalidTakerError(
        bytes32 orderHash,
        address taker
    )
        internal
        pure
        returns (bytes memory);

    bytes4 internal constant ORDER_EPOCH_ERROR_SELECTOR =
        bytes4(keccak256("OrderEpochError(address,address,uint256)"));

    function OrderEpochError(
        address maker,
        address sender,
        uint256 currentEpoch
    )
        internal
        pure
        returns (bytes memory);

    bytes4 internal constant ASSET_PROXY_EXISTS_ERROR_SELECTOR =
        bytes4(keccak256("AssetProxyExistsError(address)"));

    function AssetProxyExistsError(
        address proxyAddress
    )
        internal
        pure
        returns (bytes memory);

    bytes4 internal constant ASSET_PROXY_DISPATCH_ERROR_SELECTOR =
        bytes4(keccak256("AssetProxyDispatchError(bytes32,bytes,uint8)"));

    function AssetProxyDispatchError(
        bytes32 orderHash,
        bytes memory assetData,
        AssetProxyDispatchErrorCodes error
    )
        internal
        pure
        returns (bytes memory);

    bytes4 internal constant ASSET_PROXY_TRANSFER_ERROR_SELECTOR =
        bytes4(keccak256("AssetProxyTransferError(bytes32,bytes,string)"));

    function AssetProxyTransferError(
        bytes32 orderHash,
        bytes memory assetData,
        string memory errorMessage
    )
        internal
        pure
        returns (bytes memory);

    bytes4 internal constant NEGATIVE_SPREAD_ERROR_SELECTOR =
        bytes4(keccak256("NegativeSpreadError(bytes32,bytes32)"));

    function NegativeSpreadError(
        bytes32 leftOrderHash,
        bytes32 rightOrderHash
    )
        internal
        pure
        returns (bytes memory);

    bytes4 internal constant TRANSACTION_ERROR_SELECTOR =
        bytes4(keccak256("TransactionError(bytes32,uint8)"));

    function TransactionError(
        bytes32 transactionHash,
        TransactionErrorCodes error
    )
        internal
        pure
        returns (bytes memory);

    bytes4 internal constant TRANSACTION_EXECUTION_ERROR_SELECTOR =
        bytes4(keccak256("TransactionExecutionError(bytes32,bytes)"));

    function TransactionExecutionError(
        bytes32 transactionHash,
        bytes memory errorData
    )
        internal
        pure
        returns (bytes memory);

    bytes4 internal constant INCOMPLETE_FILL_ERROR_SELECTOR =
        bytes4(keccak256("IncompleteFillError(bytes32)"));

    function IncompleteFillError(
        bytes32 orderHash
    )
        internal
        pure
        returns (bytes memory);
}
