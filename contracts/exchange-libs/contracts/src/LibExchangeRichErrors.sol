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
import "./LibOrder.sol";


library LibExchangeRichErrors {

    enum AssetProxyDispatchErrorCodes {
        INVALID_ASSET_DATA_LENGTH,
        UNKNOWN_ASSET_PROXY
    }

    enum BatchMatchOrdersErrorCodes {
        ZERO_LEFT_ORDERS,
        ZERO_RIGHT_ORDERS,
        INVALID_LENGTH_LEFT_SIGNATURES,
        INVALID_LENGTH_RIGHT_SIGNATURES
    }

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
        INAPPROPRIATE_SIGNATURE_TYPE,
        INVALID_SIGNER
    }

    enum TransactionErrorCodes {
        ALREADY_EXECUTED,
        EXPIRED
    }

    enum IncompleteFillErrorCode {
        INCOMPLETE_MARKET_BUY_ORDERS,
        INCOMPLETE_MARKET_SELL_ORDERS,
        INCOMPLETE_FILL_ORDER
    }

    // bytes4(keccak256("SignatureError(uint8,bytes32,address,bytes)"))
    bytes4 internal constant SIGNATURE_ERROR_SELECTOR =
        0x7e5a2318;

    // bytes4(keccak256("SignatureValidatorNotApprovedError(address,address)"))
    bytes4 internal constant SIGNATURE_VALIDATOR_NOT_APPROVED_ERROR_SELECTOR =
        0xa15c0d06;

    // bytes4(keccak256("SignatureValidatorError(bytes32,address,address,bytes,bytes)"))
    bytes4 internal constant SIGNATURE_VALIDATOR_ERROR_SELECTOR =
        0xa23838b8;

    // bytes4(keccak256("SignatureWalletError(bytes32,address,bytes,bytes)"))
    bytes4 internal constant SIGNATURE_WALLET_ERROR_SELECTOR =
        0x1b8388f7;

    // bytes4(keccak256("OrderStatusError(bytes32,uint8)"))
    bytes4 internal constant ORDER_STATUS_ERROR_SELECTOR =
        0xfdb6ca8d;

    // bytes4(keccak256("InvalidSenderError(bytes32,address)"))
    bytes4 internal constant INVALID_SENDER_ERROR_SELECTOR =
        0x95b59997;

    // bytes4(keccak256("InvalidMakerError(bytes32,address)"))
    bytes4 internal constant INVALID_MAKER_ERROR_SELECTOR =
        0x26bf55d9;

    // bytes4(keccak256("FillError(uint8,bytes32)"))
    bytes4 internal constant FILL_ERROR_SELECTOR =
        0xe94a7ed0;

    // bytes4(keccak256("InvalidTakerError(bytes32,address)"))
    bytes4 internal constant INVALID_TAKER_ERROR_SELECTOR =
        0xfdb328be;

    // bytes4(keccak256("OrderEpochError(address,address,uint256)"))
    bytes4 internal constant ORDER_EPOCH_ERROR_SELECTOR =
        0x4ad31275;

    // bytes4(keccak256("AssetProxyExistsError(address)"))
    bytes4 internal constant ASSET_PROXY_EXISTS_ERROR_SELECTOR =
        0xcc8b3b53;

    // bytes4(keccak256("AssetProxyDispatchError(uint8,bytes32,bytes)"))
    bytes4 internal constant ASSET_PROXY_DISPATCH_ERROR_SELECTOR =
        0x488219a6;

    // bytes4(keccak256("AssetProxyTransferError(bytes32,bytes,bytes)"))
    bytes4 internal constant ASSET_PROXY_TRANSFER_ERROR_SELECTOR =
        0x4678472b;

    // bytes4(keccak256("NegativeSpreadError(bytes32,bytes32)"))
    bytes4 internal constant NEGATIVE_SPREAD_ERROR_SELECTOR =
        0xb6555d6f;

    // bytes4(keccak256("TransactionError(uint8,bytes32)"))
    bytes4 internal constant TRANSACTION_ERROR_SELECTOR =
        0xf5985184;

    // bytes4(keccak256("TransactionSignatureError(bytes32,address,bytes)"))
    bytes4 internal constant TRANSACTION_SIGNATURE_ERROR_SELECTOR =
        0xbfd56ef6;

    // bytes4(keccak256("TransactionExecutionError(bytes32,bytes)"))
    bytes4 internal constant TRANSACTION_EXECUTION_ERROR_SELECTOR =
        0x20d11f61;
    
    // bytes4(keccak256("TransactionGasPriceError(bytes32,uint256,uint256)"))
    bytes4 internal constant TRANSACTION_GAS_PRICE_ERROR_SELECTOR =
        0xa26dac09;

    // bytes4(keccak256("TransactionInvalidContextError(bytes32,address)"))
    bytes4 internal constant TRANSACTION_INVALID_CONTEXT_ERROR_SELECTOR =
        0xdec4aedf;

    // bytes4(keccak256("IncompleteFillError(uint8,uint256,uint256)"))
    bytes4 internal constant INCOMPLETE_FILL_ERROR_SELECTOR =
        0x18e4b141;

    // bytes4(keccak256("BatchMatchOrdersError(uint8)"))
    bytes4 internal constant BATCH_MATCH_ORDERS_ERROR_SELECTOR =
        0xd4092f4f;

    // solhint-disable func-name-mixedcase
    function SignatureErrorSelector()
        internal
        pure
        returns (bytes4)
    {
        return SIGNATURE_ERROR_SELECTOR;
    }

    function SignatureValidatorNotApprovedErrorSelector()
        internal
        pure
        returns (bytes4)
    {
        return SIGNATURE_VALIDATOR_NOT_APPROVED_ERROR_SELECTOR;
    }

    function SignatureValidatorErrorSelector()
        internal
        pure
        returns (bytes4)
    {
        return SIGNATURE_VALIDATOR_ERROR_SELECTOR;
    }

    function SignatureWalletErrorSelector()
        internal
        pure
        returns (bytes4)
    {
        return SIGNATURE_WALLET_ERROR_SELECTOR;
    }

    function OrderStatusErrorSelector()
        internal
        pure
        returns (bytes4)
    {
        return ORDER_STATUS_ERROR_SELECTOR;
    }

    function InvalidSenderErrorSelector()
        internal
        pure
        returns (bytes4)
    {
        return INVALID_SENDER_ERROR_SELECTOR;
    }

    function InvalidMakerErrorSelector()
        internal
        pure
        returns (bytes4)
    {
        return INVALID_MAKER_ERROR_SELECTOR;
    }

    function FillErrorSelector()
        internal
        pure
        returns (bytes4)
    {
        return FILL_ERROR_SELECTOR;
    }

    function InvalidTakerErrorSelector()
        internal
        pure
        returns (bytes4)
    {
        return INVALID_TAKER_ERROR_SELECTOR;
    }

    function OrderEpochErrorSelector()
        internal
        pure
        returns (bytes4)
    {
        return ORDER_EPOCH_ERROR_SELECTOR;
    }

    function AssetProxyExistsErrorSelector()
        internal
        pure
        returns (bytes4)
    {
        return ASSET_PROXY_EXISTS_ERROR_SELECTOR;
    }

    function AssetProxyDispatchErrorSelector()
        internal
        pure
        returns (bytes4)
    {
        return ASSET_PROXY_DISPATCH_ERROR_SELECTOR;
    }

    function AssetProxyTransferErrorSelector()
        internal
        pure
        returns (bytes4)
    {
        return ASSET_PROXY_TRANSFER_ERROR_SELECTOR;
    }

    function NegativeSpreadErrorSelector()
        internal
        pure
        returns (bytes4)
    {
        return NEGATIVE_SPREAD_ERROR_SELECTOR;
    }

    function TransactionErrorSelector()
        internal
        pure
        returns (bytes4)
    {
        return TRANSACTION_ERROR_SELECTOR;
    }

    function TransactionSignatureErrorSelector()
        internal
        pure
        returns (bytes4)
    {
        return TRANSACTION_SIGNATURE_ERROR_SELECTOR;
    }

    function TransactionExecutionErrorSelector()
        internal
        pure
        returns (bytes4)
    {
        return TRANSACTION_EXECUTION_ERROR_SELECTOR;
    }

    function IncompleteFillErrorSelector()
        internal
        pure
        returns (bytes4)
    {
        return INCOMPLETE_FILL_ERROR_SELECTOR;
    }

    function BatchMatchOrdersErrorSelector()
        internal
        pure
        returns (bytes4)
    {
        return BATCH_MATCH_ORDERS_ERROR_SELECTOR;
    }

    function TransactionGasPriceErrorSelector()
        internal
        pure
        returns (bytes4)
    {
        return TRANSACTION_GAS_PRICE_ERROR_SELECTOR;
    }

    function BatchMatchOrdersError(
        BatchMatchOrdersErrorCodes errorCode
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            BATCH_MATCH_ORDERS_ERROR_SELECTOR,
            errorCode
        );
    }

    function SignatureError(
        SignatureErrorCodes errorCode,
        bytes32 hash,
        address signerAddress,
        bytes memory signature
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            SIGNATURE_ERROR_SELECTOR,
            errorCode,
            hash,
            signerAddress,
            signature
        );
    }

    function SignatureValidatorNotApprovedError(
        address signerAddress,
        address validatorAddress
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            SIGNATURE_VALIDATOR_NOT_APPROVED_ERROR_SELECTOR,
            signerAddress,
            validatorAddress
        );
    }

    function SignatureValidatorError(
        bytes32 hash,
        address signerAddress,
        address validatorAddress,
        bytes memory signature,
        bytes memory errorData
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            SIGNATURE_VALIDATOR_ERROR_SELECTOR,
            hash,
            signerAddress,
            validatorAddress,
            signature,
            errorData
        );
    }

    function SignatureWalletError(
        bytes32 hash,
        address signerAddress,
        bytes memory signature,
        bytes memory errorData
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            SIGNATURE_WALLET_ERROR_SELECTOR,
            hash,
            signerAddress,
            signature,
            errorData
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
            orderStatus
        );
    }

    function InvalidSenderError(
        bytes32 orderHash,
        address senderAddress
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            INVALID_SENDER_ERROR_SELECTOR,
            orderHash,
            senderAddress
        );
    }

    function InvalidMakerError(
        bytes32 orderHash,
        address makerAddress
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            INVALID_MAKER_ERROR_SELECTOR,
            orderHash,
            makerAddress
        );
    }

    function FillError(
        FillErrorCodes errorCode,
        bytes32 orderHash
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            FILL_ERROR_SELECTOR,
            errorCode,
            orderHash
        );
    }

    function InvalidTakerError(
        bytes32 orderHash,
        address takerAddress
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            INVALID_TAKER_ERROR_SELECTOR,
            orderHash,
            takerAddress
        );
    }

    function OrderEpochError(
        address makerAddress,
        address orderSenderAddress,
        uint256 currentEpoch
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            ORDER_EPOCH_ERROR_SELECTOR,
            makerAddress,
            orderSenderAddress,
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
        AssetProxyDispatchErrorCodes errorCode,
        bytes32 orderHash,
        bytes memory assetData
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            ASSET_PROXY_DISPATCH_ERROR_SELECTOR,
            errorCode,
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
        TransactionErrorCodes errorCode,
        bytes32 transactionHash
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            TRANSACTION_ERROR_SELECTOR,
            errorCode,
            transactionHash
        );
    }

    function TransactionSignatureError(
        bytes32 transactionHash,
        address signerAddress,
        bytes memory signature
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            TRANSACTION_SIGNATURE_ERROR_SELECTOR,
            transactionHash,
            signerAddress,
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

    function TransactionGasPriceError(
        bytes32 transactionHash,
        uint256 actualGasPrice,
        uint256 requiredGasPrice
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            TRANSACTION_GAS_PRICE_ERROR_SELECTOR,
            transactionHash,
            actualGasPrice,
            requiredGasPrice
        );
    }

    function TransactionInvalidContextError(
        bytes32 transactionHash,
        address currentContextAddress
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            TRANSACTION_INVALID_CONTEXT_ERROR_SELECTOR,
            transactionHash,
            currentContextAddress
        );
    }

    function IncompleteFillError(
        IncompleteFillErrorCode errorCode,
        uint256 expectedAssetFillAmount,
        uint256 actualAssetFillAmount
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            INCOMPLETE_FILL_ERROR_SELECTOR,
            errorCode,
            expectedAssetFillAmount,
            actualAssetFillAmount
        );
    }
}
