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

pragma solidity ^0.5.5;

import "../src/libs/LibExchangeRichErrorDecoder.sol";


// solhint-disable no-empty-blocks
contract TestLibExchangeRichErrorDecoder
{
    /// @dev Decompose an ABI-encoded SignatureError.
    /// @param encoded ABI-encoded revert error.
    /// @return errorCode The error code.
    /// @return signerAddress The expected signer of the hash.
    /// @return signature The full signature.
    function decodeSignatureError(bytes memory encoded)
        public
        pure
        returns (
            LibExchangeRichErrors.SignatureErrorCodes errorCode,
            bytes32 hash,
            address signerAddress,
            bytes memory signature
        )

    {
        return LibExchangeRichErrorDecoder.decodeSignatureError(encoded);
    }

    /// @dev Decompose an ABI-encoded SignatureValidatorError.
    /// @param encoded ABI-encoded revert error.
    /// @return signerAddress The expected signer of the hash.
    /// @return signature The full signature bytes.
    /// @return errorData The revert data thrown by the validator contract.
    function decodeEIP1271SignatureError(bytes memory encoded)
        public
        pure
        returns (
            address verifyingContractAddress,
            bytes memory data,
            bytes memory signature,
            bytes memory errorData
        )

    {
        return LibExchangeRichErrorDecoder.decodeEIP1271SignatureError(encoded);
    }

    /// @dev Decompose an ABI-encoded SignatureValidatorNotApprovedError.
    /// @param encoded ABI-encoded revert error.
    /// @return signerAddress The expected signer of the hash.
    /// @return validatorAddress The expected validator.
    function decodeSignatureValidatorNotApprovedError(bytes memory encoded)
        public
        pure
        returns (
            address signerAddress,
            address validatorAddress
        )
    {
        return LibExchangeRichErrorDecoder.decodeSignatureValidatorNotApprovedError(encoded);
    }

    /// @dev Decompose an ABI-encoded SignatureWalletError.
    /// @param encoded ABI-encoded revert error.
    /// @return errorCode The error code.
    /// @return signerAddress The expected signer of the hash.
    /// @return signature The full signature bytes.
    /// @return errorData The revert data thrown by the validator contract.
    function decodeSignatureWalletError(bytes memory encoded)
        public
        pure
        returns (
            bytes32 hash,
            address signerAddress,
            bytes memory signature,
            bytes memory errorData
        )

    {
        return LibExchangeRichErrorDecoder.decodeSignatureWalletError(encoded);
    }

    /// @dev Decompose an ABI-encoded OrderStatusError.
    /// @param encoded ABI-encoded revert error.
    /// @return orderHash The order hash.
    /// @return orderStatus The order status.
    function decodeOrderStatusError(bytes memory encoded)
        public
        pure
        returns (
            bytes32 orderHash,
            LibOrder.OrderStatus orderStatus
        )
    {
        return LibExchangeRichErrorDecoder.decodeOrderStatusError(encoded);
    }

    /// @dev Decompose an ABI-encoded OrderStatusError.
    /// @param encoded ABI-encoded revert error.
    /// @return errorCode Error code that corresponds to invalid maker, taker, or sender.
    /// @return orderHash The order hash.
    /// @return contextAddress The maker, taker, or sender address
    function decodeExchangeInvalidContextError(bytes memory encoded)
        public
        pure
        returns (
            LibExchangeRichErrors.ExchangeContextErrorCodes errorCode,
            bytes32 orderHash,
            address contextAddress
        )
    {
        return LibExchangeRichErrorDecoder.decodeExchangeInvalidContextError(encoded);
    }

    /// @dev Decompose an ABI-encoded FillError.
    /// @param encoded ABI-encoded revert error.
    /// @return errorCode The error code.
    /// @return orderHash The order hash.
    function decodeFillError(bytes memory encoded)
        public
        pure
        returns (
            LibExchangeRichErrors.FillErrorCodes errorCode,
            bytes32 orderHash
        )
    {
        return LibExchangeRichErrorDecoder.decodeFillError(encoded);
    }

    /// @dev Decompose an ABI-encoded OrderEpochError.
    /// @param encoded ABI-encoded revert error.
    /// @return makerAddress The order maker.
    /// @return orderSenderAddress The order sender.
    /// @return currentEpoch The current epoch for the maker.
    function decodeOrderEpochError(bytes memory encoded)
        public
        pure
        returns (
            address makerAddress,
            address orderSenderAddress,
            uint256 currentEpoch
        )
    {
        return LibExchangeRichErrorDecoder.decodeOrderEpochError(encoded);
    }

    /// @dev Decompose an ABI-encoded AssetProxyExistsError.
    /// @param encoded ABI-encoded revert error.
    /// @return assetProxyId Id of asset proxy.
    /// @return assetProxyAddress The address of the asset proxy.
    function decodeAssetProxyExistsError(bytes memory encoded)
        public
        pure
        returns (
            bytes4 assetProxyId, address assetProxyAddress)
    {
        return LibExchangeRichErrorDecoder.decodeAssetProxyExistsError(encoded);
    }

    /// @dev Decompose an ABI-encoded AssetProxyDispatchError.
    /// @param encoded ABI-encoded revert error.
    /// @return errorCode The error code.
    /// @return orderHash Hash of the order being dispatched.
    /// @return assetData Asset data of the order being dispatched.
    function decodeAssetProxyDispatchError(bytes memory encoded)
        public
        pure
        returns (
            LibExchangeRichErrors.AssetProxyDispatchErrorCodes errorCode,
            bytes32 orderHash,
            bytes memory assetData
        )
    {
        return LibExchangeRichErrorDecoder.decodeAssetProxyDispatchError(encoded);
    }

    /// @dev Decompose an ABI-encoded AssetProxyTransferError.
    /// @param encoded ABI-encoded revert error.
    /// @return orderHash Hash of the order being dispatched.
    /// @return assetData Asset data of the order being dispatched.
    /// @return errorData ABI-encoded revert data from the asset proxy.
    function decodeAssetProxyTransferError(bytes memory encoded)
        public
        pure
        returns (
            bytes32 orderHash,
            bytes memory assetData,
            bytes memory errorData
        )
    {
        return LibExchangeRichErrorDecoder.decodeAssetProxyTransferError(encoded);
    }

    /// @dev Decompose an ABI-encoded NegativeSpreadError.
    /// @param encoded ABI-encoded revert error.
    /// @return leftOrderHash Hash of the left order being matched.
    /// @return rightOrderHash Hash of the right order being matched.
    function decodeNegativeSpreadError(bytes memory encoded)
        public
        pure
        returns (
            bytes32 leftOrderHash,
            bytes32 rightOrderHash
        )
    {
        return LibExchangeRichErrorDecoder.decodeNegativeSpreadError(encoded);
    }

    /// @dev Decompose an ABI-encoded TransactionError.
    /// @param encoded ABI-encoded revert error.
    /// @return errorCode The error code.
    /// @return transactionHash Hash of the transaction.
    function decodeTransactionError(bytes memory encoded)
        public
        pure
        returns (
            LibExchangeRichErrors.TransactionErrorCodes errorCode,
            bytes32 transactionHash
        )
    {
        return LibExchangeRichErrorDecoder.decodeTransactionError(encoded);
    }

    /// @dev Decompose an ABI-encoded TransactionExecutionError.
    /// @param encoded ABI-encoded revert error.
    /// @return transactionHash Hash of the transaction.
    /// @return errorData Error thrown by exeucteTransaction().
    function decodeTransactionExecutionError(bytes memory encoded)
        public
        pure
        returns (
            bytes32 transactionHash,
            bytes memory errorData
        )
    {
        return LibExchangeRichErrorDecoder.decodeTransactionExecutionError(encoded);
    }

    /// @dev Decompose an ABI-encoded IncompleteFillError.
    /// @param encoded ABI-encoded revert error.
    /// @return orderHash Hash of the order being filled.
    function decodeIncompleteFillError(bytes memory encoded)
        public
        pure
        returns (
            LibExchangeRichErrors.IncompleteFillErrorCode errorCode,
            uint256 expectedAssetFillAmount,
            uint256 actualAssetFillAmount
        )
    {
        return LibExchangeRichErrorDecoder.decodeIncompleteFillError(encoded);
    }
}
