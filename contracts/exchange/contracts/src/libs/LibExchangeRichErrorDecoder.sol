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

import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibExchangeRichErrors.sol";
import "@0x/contracts-utils/contracts/src/LibBytes.sol";


contract LibExchangeRichErrorDecoder {

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
        _assertSelectorBytes(encoded, LibExchangeRichErrors.SignatureErrorSelector());
        errorCode = LibExchangeRichErrors.SignatureErrorCodes(_readErrorParameterAsUint256(encoded, 0));
        hash = _readErrorParameterAsBytes32(encoded, 1);
        signerAddress = _readErrorParameterAsAddress(encoded, 2);
        signature = _readErrorParameterAsBytes(encoded, 3);
    }

    /// @dev Decompose an ABI-encoded SignatureValidatorError.
    /// @param encoded ABI-encoded revert error.
    /// @return signerAddress The expected signer of the hash.
    /// @return signature The full signature bytes.
    /// @return errorData The revert data thrown by the validator contract.
    function decodeSignatureValidatorError(bytes memory encoded)
        public
        pure
        returns (
            bytes32 hash,
            address signerAddress,
            address validatorAddress,
            bytes memory signature,
            bytes memory errorData
        )
    {
        _assertSelectorBytes(encoded, LibExchangeRichErrors.SignatureValidatorErrorSelector());
        hash = _readErrorParameterAsBytes32(encoded, 0);
        signerAddress = _readErrorParameterAsAddress(encoded, 1);
        validatorAddress = _readErrorParameterAsAddress(encoded, 2);
        signature = _readErrorParameterAsBytes(encoded, 3);
        errorData = _readErrorParameterAsBytes(encoded, 4);
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
        _assertSelectorBytes(encoded, LibExchangeRichErrors.SignatureValidatorNotApprovedErrorSelector());
        signerAddress = _readErrorParameterAsAddress(encoded, 0);
        validatorAddress = _readErrorParameterAsAddress(encoded, 1);
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
        _assertSelectorBytes(encoded, LibExchangeRichErrors.SignatureWalletErrorSelector());
        hash = _readErrorParameterAsBytes32(encoded, 0);
        signerAddress = _readErrorParameterAsAddress(encoded, 1);
        signature = _readErrorParameterAsBytes(encoded, 2);
        errorData = _readErrorParameterAsBytes(encoded, 3);
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
        _assertSelectorBytes(encoded, LibExchangeRichErrors.OrderStatusErrorSelector());
        orderHash = _readErrorParameterAsBytes32(encoded, 0);
        orderStatus = LibOrder.OrderStatus(_readErrorParameterAsUint256(encoded, 1));
    }

    /// @dev Decompose an ABI-encoded InvalidSenderError.
    /// @param encoded ABI-encoded revert error.
    /// @return orderHash The order hash.
    /// @return senderAddress The sender.
    function decodeInvalidSenderError(bytes memory encoded)
        public
        pure
        returns (
            bytes32 orderHash,
            address senderAddress
        )
    {
        _assertSelectorBytes(encoded, LibExchangeRichErrors.InvalidSenderErrorSelector());
        orderHash = _readErrorParameterAsBytes32(encoded, 0);
        senderAddress = _readErrorParameterAsAddress(encoded, 1);
    }

    /// @dev Decompose an ABI-encoded InvalidMakerError.
    /// @param encoded ABI-encoded revert error.
    /// @return orderHash The order hash.
    /// @return makerAddress The maker of the order.
    function decodeInvalidMakerError(bytes memory encoded)
        public
        pure
        returns (
            bytes32 orderHash,
            address makerAddress
        )
    {
        _assertSelectorBytes(encoded, LibExchangeRichErrors.InvalidMakerErrorSelector());
        orderHash = _readErrorParameterAsBytes32(encoded, 0);
        makerAddress = _readErrorParameterAsAddress(encoded, 1);
    }

    /// @dev Decompose an ABI-encoded InvalidTaker.
    /// @param encoded ABI-encoded revert error.
    /// @return orderHash The order hash.
    /// @return takerAddress The taker of the order.
    function decodeInvalidTakerError(bytes memory encoded)
        public
        pure
        returns (
            bytes32 orderHash,
            address takerAddress
        )
    {
        _assertSelectorBytes(encoded, LibExchangeRichErrors.InvalidTakerErrorSelector());
        orderHash = _readErrorParameterAsBytes32(encoded, 0);
        takerAddress = _readErrorParameterAsAddress(encoded, 1);
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
        _assertSelectorBytes(encoded, LibExchangeRichErrors.FillErrorSelector());
        errorCode = LibExchangeRichErrors.FillErrorCodes(_readErrorParameterAsUint256(encoded, 0));
        orderHash = _readErrorParameterAsBytes32(encoded, 1);
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
        _assertSelectorBytes(encoded, LibExchangeRichErrors.OrderEpochErrorSelector());
        makerAddress = _readErrorParameterAsAddress(encoded, 0);
        orderSenderAddress = _readErrorParameterAsAddress(encoded, 1);
        currentEpoch = _readErrorParameterAsUint256(encoded, 2);
    }

    /// @dev Decompose an ABI-encoded AssetProxyExistsError.
    /// @param encoded ABI-encoded revert error.
    /// @return proxyAddress The address of the asset proxy.
    function decodeAssetProxyExistsError(bytes memory encoded)
        public
        pure
        returns (address assetProxyAddress)
    {
        _assertSelectorBytes(encoded, LibExchangeRichErrors.AssetProxyExistsErrorSelector());
        assetProxyAddress = _readErrorParameterAsAddress(encoded, 0);
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
        _assertSelectorBytes(encoded, LibExchangeRichErrors.AssetProxyDispatchErrorSelector());
        errorCode = LibExchangeRichErrors.AssetProxyDispatchErrorCodes(_readErrorParameterAsUint256(encoded, 0));
        orderHash = _readErrorParameterAsBytes32(encoded, 1);
        assetData = _readErrorParameterAsBytes(encoded, 2);
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
        _assertSelectorBytes(encoded, LibExchangeRichErrors.AssetProxyTransferErrorSelector());
        orderHash = _readErrorParameterAsBytes32(encoded, 0);
        assetData = _readErrorParameterAsBytes(encoded, 1);
        errorData = _readErrorParameterAsBytes(encoded, 2);
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
        _assertSelectorBytes(encoded, LibExchangeRichErrors.NegativeSpreadErrorSelector());
        leftOrderHash = _readErrorParameterAsBytes32(encoded, 0);
        rightOrderHash = _readErrorParameterAsBytes32(encoded, 1);
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
        _assertSelectorBytes(encoded, LibExchangeRichErrors.TransactionErrorSelector());
        errorCode = LibExchangeRichErrors.TransactionErrorCodes(_readErrorParameterAsUint256(encoded, 0));
        transactionHash = _readErrorParameterAsBytes32(encoded, 1);
    }

    /// @dev Decompose an ABI-encoded TransactionSignatureError.
    /// @param encoded ABI-encoded revert error.
    /// @return transactionHash Hash of the transaction.
    /// @return signerAddress Signer of the transaction.
    /// @return signature Full signature for the transaction.
    function decodeTransactionSignatureError(bytes memory encoded)
        public
        pure
        returns (
            bytes32 transactionHash,
            address signerAddress,
            bytes memory signature
        )
    {
        _assertSelectorBytes(encoded, LibExchangeRichErrors.TransactionSignatureErrorSelector());
        transactionHash = _readErrorParameterAsBytes32(encoded, 0);
        signerAddress = _readErrorParameterAsAddress(encoded, 1);
        signature = _readErrorParameterAsBytes(encoded, 2);
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
        _assertSelectorBytes(encoded, LibExchangeRichErrors.TransactionExecutionErrorSelector());
        transactionHash = _readErrorParameterAsBytes32(encoded, 0);
        errorData = _readErrorParameterAsBytes(encoded, 1);
    }

    /// @dev Decompose an ABI-encoded IncompleteFillError.
    /// @param encoded ABI-encoded revert error.
    /// @return orderHash Hash of the order being filled.
    function decodeIncompleteFillError(bytes memory encoded)
        public
        pure
        returns (
            bytes32 orderHash
        )
    {
        _assertSelectorBytes(encoded, LibExchangeRichErrors.IncompleteFillErrorSelector());
        orderHash = _readErrorParameterAsBytes32(encoded, 0);
    }

    /// @dev Revert if the leading 4 bytes of `encoded` is not `selector`.
    function _assertSelectorBytes(bytes memory encoded, bytes4 selector)
        private
        pure
    {
        bytes4 actualSelector = LibBytes.readBytes4(encoded, 0);
        require(
            actualSelector == selector,
            "BAD_SELECTOR"
        );
    }

    /// @dev Read a parameter at index `index` as a uint256.
    function _readErrorParameterAsUint256(bytes memory encoded, uint256 index)
        private
        pure
        returns (uint256 value)
    {
        uint256 parameterOffset = 4 + index * 32;
        return LibBytes.readUint256(encoded, parameterOffset);
    }

    /// @dev Read a parameter at index `index` as a bytes32.
    function _readErrorParameterAsBytes32(bytes memory encoded, uint256 index)
        private
        pure
        returns (bytes32 value)
    {
        uint256 parameterOffset = 4 + index * 32;
        return LibBytes.readBytes32(encoded, parameterOffset);
    }

    /// @dev Read a parameter at index `index` as an address.
    function _readErrorParameterAsAddress(bytes memory encoded, uint256 index)
        private
        pure
        returns (address value)
    {
        uint256 parameterOffset = 4 + index * 32;
        return address(uint160(LibBytes.readUint256(encoded, parameterOffset)));
    }

    /// @dev Read a parameter at index `index` as a bytes.
    function _readErrorParameterAsBytes(bytes memory encoded, uint256 index)
        private
        pure
        returns (bytes memory value)
    {
        uint256 dataOffset = 4 + _readErrorParameterAsUint256(encoded, index);
        return LibBytes.readBytesWithLength(encoded, dataOffset);
    }

    /// @dev Read a parameter at index `index` as a string.
    function _readErrorParameterAsString(bytes memory encoded, uint256 index)
        private
        pure
        returns (string memory value)
    {
        return string(_readErrorParameterAsBytes(encoded, index));
    }
}
