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

import "@0x/contracts-exchange/contracts/src/mixins/MExchangeRichErrorTypes.sol";
import "@0x/contracts-utils/contracts/src/LibBytes.sol";


contract RichRevertsDecoder is
    MExchangeRichErrorTypes
{

    bytes4 private constant STANDARD_ERROR_SELECTOR =
        bytes4(keccak256("Error(string)"));

    /// @dev Decompose an ABI-encoded StandardError.
    ///      This is the standard, string revert() error.
    /// @param encoded ABI-encoded revert error.
    /// @param encoded ABI-encoded revert error.
    /// @return message The error message.
    function decomposeStandardError(bytes memory encoded)
        public
        pure
        returns (string memory message)
    {
        _assertSelectorBytes(encoded, STANDARD_ERROR_SELECTOR);
        message = _readErrorParameterAsString(encoded, 0);
    }

    bytes4 private constant SIGNATURE_ERROR_SELECTOR =
        bytes4(keccak256("SignatureError(uint8,bytes32,address,bytes)"));

    /// @dev Decompose an ABI-encoded SignatureError.
    /// @param encoded ABI-encoded revert error.
    /// @return errorCode The error code.
    /// @return signer The expected signer of the hash.
    /// @return signature The full signature.
    function decomposeSignatureError(bytes memory encoded)
        public
        pure
        returns (
            SignatureErrorCodes errorCode,
            bytes32 hash,
            address signer,
            bytes memory signature
        )
    {
        _assertSelectorBytes(encoded, SIGNATURE_ERROR_SELECTOR);
        errorCode = SignatureErrorCodes(_readErrorParameterAsUint256(encoded, 0));
        hash = _readErrorParameterAsBytes32(encoded, 1);
        signer = _readErrorParameterAsAddress(encoded, 2);
        signature = _readErrorParameterAsBytes(encoded, 3);
    }

    bytes4 private constant SIGNATURE_VALIDATOR_ERROR_SELECTOR =
        bytes4(keccak256("SignatureValidatorError(bytes32,address,bytes,bytes)"));

    /// @dev Decompose an ABI-encoded SignatureValidatorError.
    /// @param encoded ABI-encoded revert error.
    /// @return errorCode The error code.
    /// @return signer The expected signer of the hash.
    /// @return signature The full signature bytes.
    /// @return errorData The revert data thrown by the validator contract.
    function decomposeSignatureValidatorError(bytes memory encoded)
        public
        pure
        returns (
            SignatureErrorCodes errorCode,
            bytes32 hash,
            address signer,
            bytes memory signature,
            bytes memory errorData
        )
    {
        _assertSelectorBytes(encoded, SIGNATURE_VALIDATOR_ERROR_SELECTOR);
        errorCode = SignatureErrorCodes(_readErrorParameterAsUint256(encoded, 0));
        hash = _readErrorParameterAsBytes32(encoded, 1);
        signer = _readErrorParameterAsAddress(encoded, 2);
        signature = _readErrorParameterAsBytes(encoded, 3);
        errorData = _readErrorParameterAsBytes(encoded, 4);
    }

    bytes4 private constant SIGNATURE_WALLET_ERROR_SELECTOR =
        bytes4(keccak256("SignatureWalletError(bytes32,address,bytes,bytes)"));

    /// @dev Decompose an ABI-encoded SignatureWalletError.
    /// @param encoded ABI-encoded revert error.
    /// @return errorCode The error code.
    /// @return signer The expected signer of the hash.
    /// @return signature The full signature bytes.
    /// @return errorData The revert data thrown by the validator contract.
    function decomposeSignatureWalletError(bytes memory encoded)
        public
        pure
        returns (
            SignatureErrorCodes errorCode,
            bytes32 hash,
            address signer,
            bytes memory signature,
            bytes memory errorData
        )
    {
        _assertSelectorBytes(encoded, SIGNATURE_WALLET_ERROR_SELECTOR);
        errorCode = SignatureErrorCodes(_readErrorParameterAsUint256(encoded, 0));
        hash = _readErrorParameterAsBytes32(encoded, 1);
        signer = _readErrorParameterAsAddress(encoded, 2);
        signature = _readErrorParameterAsBytes(encoded, 3);
        errorData = _readErrorParameterAsBytes(encoded, 4);
    }

    bytes4 internal constant SIGNATURE_ORDER_VALIDATOR_ERROR_SELECTOR =
        bytes4(keccak256("SignatureOrderValidatorError(bytes32,address,bytes,bytes)"));

    /// @dev Decompose an ABI-encoded SignatureOrderValidatorError.
    /// @param encoded ABI-encoded revert error.
    /// @return errorCode The error code.
    /// @return signer The expected signer of the hash.
    /// @return signature The full signature bytes.
    /// @return errorData The revert data thrown by the validator contract.
    function decomposeSignatureOrderValidatorError(bytes memory encoded)
        public
        pure
        returns (
            SignatureErrorCodes errorCode,
            bytes32 hash,
            address signer,
            bytes memory signature,
            bytes memory errorData
        )
    {
        _assertSelectorBytes(encoded, SIGNATURE_ORDER_VALIDATOR_ERROR_SELECTOR);
        errorCode = SignatureErrorCodes(_readErrorParameterAsUint256(encoded, 0));
        hash = _readErrorParameterAsBytes32(encoded, 1);
        signer = _readErrorParameterAsAddress(encoded, 2);
        signature = _readErrorParameterAsBytes(encoded, 3);
        errorData = _readErrorParameterAsBytes(encoded, 4);
    }

    bytes4 internal constant SIGNATURE_WALLET_ORDER_VALIDATOR_ERROR_SELECTOR =
        bytes4(keccak256("SignatureWalletOrderValidatorError(bytes32,address,bytes,bytes)"));

    /// @dev Decompose an ABI-encoded SignatureWalletOrderValidatorError.
    /// @param encoded ABI-encoded revert error.
    /// @return errorCode The error code.
    /// @return signer The expected signer of the hash.
    /// @return signature The full signature bytes.
    /// @return errorData The revert data thrown by the validator contract.
    function decomposeSignatureWalletOrderValidatorError(bytes memory encoded)
        public
        pure
        returns (
            SignatureErrorCodes errorCode,
            bytes32 hash,
            address signer,
            bytes memory signature,
            bytes memory errorData
        )
    {
        _assertSelectorBytes(encoded, SIGNATURE_WALLET_ORDER_VALIDATOR_ERROR_SELECTOR);
        errorCode = SignatureErrorCodes(_readErrorParameterAsUint256(encoded, 0));
        hash = _readErrorParameterAsBytes32(encoded, 1);
        signer = _readErrorParameterAsAddress(encoded, 2);
        signature = _readErrorParameterAsBytes(encoded, 3);
        errorData = _readErrorParameterAsBytes(encoded, 4);
    }

    bytes4 internal constant ORDER_STATUS_ERROR_SELECTOR =
        bytes4(keccak256("OrderStatusError(bytes32,uint8)"));

    /// @dev Decompose an ABI-encoded OrderStatusError.
    /// @param encoded ABI-encoded revert error.
    /// @return orderHash The order hash.
    /// @return orderStatus The order status.
    function decomposeOrderStatusError(bytes memory encoded)
        public
        pure
        returns (
            bytes32 hash,
            LibOrder.OrderStatus orderStatus
        )
    {
        _assertSelectorBytes(encoded, ORDER_STATUS_ERROR_SELECTOR);
        hash = _readErrorParameterAsBytes32(encoded, 0);
        orderStatus = LibOrder.OrderStatus(_readErrorParameterAsUint256(encoded, 1));
    }

    /// @dev Revert if the leading 4 bytes of `encoded` is not `selector`.
    function _assertSelectorBytes(bytes memory encoded, bytes4 selector)
        private
        pure
    {
        bytes4 actualSelector = LibBytes.readBytes4(encoded, 0);
        require(
            actualSelector == selector,
            "INVALID_SELECTOR"
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
