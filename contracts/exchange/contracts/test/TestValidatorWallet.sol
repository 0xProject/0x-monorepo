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
pragma experimental ABIEncoderV2;

import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibZeroExTransaction.sol";
import "@0x/contracts-erc20/contracts/src/interfaces/IERC20Token.sol";
import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "@0x/contracts-utils/contracts/src/LibEIP1271.sol";


interface ISimplifiedExchange {
    function getOrderHash(LibOrder.Order calldata order)
        external
        view
        returns (bytes32 orderHash);

    function getTransactionHash(LibZeroExTransaction.ZeroExTransaction calldata transaction)
        external
        view
        returns (bytes32 transactionHash);
}


// solhint-disable no-unused-vars
contract TestValidatorWallet is
    LibEIP1271
{
    using LibBytes for bytes;

    bytes4 private constant LEGACY_WALLET_MAGIC_VALUE = 0xb0671381;

    /// @dev Revert reason for `Revert` `ValidatorAction`.
    string constant public REVERT_REASON = "you shall not pass";

    enum DataType {
        // No data type; only expecting a hash (default)
        None,
        // An Order
        Order,
        // A ZeroExTransaction
        ZeroExTransaction,
        NTypes
    }

    enum ValidatorAction {
        // Return failure (default)
        Reject,
        // Return success
        Accept,
        // Revert
        Revert,
        // Update state
        UpdateState,
        // Ensure the signature hash matches what was prepared
        MatchSignatureHash,
        NTypes
    }

    /// @dev The Exchange contract.
    ISimplifiedExchange internal _exchange;
    /// @dev Internal state to modify.
    uint256 internal _state = 1;
    /// @dev What action to execute when a hash is validated .
    mapping (bytes32 => ValidatorAction) internal _hashActions;
    /// @dev The data type of a hash.
    mapping (bytes32 => DataType) internal _hashDataTypes;
    /// @dev keccak256 of the expected signature data for a hash.
    mapping (bytes32 => bytes32) internal _hashSignatureHashes;

    constructor(address exchange) public {
        _exchange = ISimplifiedExchange(exchange);
    }

    /// @dev Approves an ERC20 token to spend tokens from this address.
    /// @param token Address of ERC20 token.
    /// @param spender Address that will spend tokens.
    /// @param value Amount of tokens spender is approved to spend.
    function approveERC20(
        address token,
        address spender,
        uint256 value
    )
        external
    {
        IERC20Token(token).approve(spender, value);
    }

    /// @dev Prepares this contract to validate a signature.
    /// @param hash The hash.
    /// @param dataType The data type associated with the hash.
    /// @param action Action to take.
    /// @param signatureHash keccak256 of the expected signature data.
    function prepare(
        bytes32 hash,
        DataType dataType,
        ValidatorAction action,
        bytes32 signatureHash
    )
        external
    {
        if (uint8(dataType) >= uint8(DataType.NTypes)) {
            revert("UNSUPPORTED_DATA_TYPE");
        }
        if (uint8(action) >= uint8(ValidatorAction.NTypes)) {
            revert("UNSUPPORTED_VALIDATOR_ACTION");
        }
        _hashDataTypes[hash] = dataType;
        _hashActions[hash] = action;
        _hashSignatureHashes[hash] = signatureHash;
    }

    /// @dev Validates data signed by either `EIP1271Wallet` or `Validator` signature types.
    /// @param data Abi-encoded data (Order or ZeroExTransaction) and a hash.
    /// @param signature Signature for `data`.
    /// @return magicValue `EIP1271_MAGIC_VALUE` if the signature check succeeds.
    function isValidSignature(
        bytes memory data,
        bytes memory signature
    )
        public
        returns (bytes4 magicValue)
    {
        bytes32 hash = _decodeAndValidateHashFromEncodedData(data);
        ValidatorAction action = _hashActions[hash];
        if (action == ValidatorAction.Reject) {
            magicValue = 0x0;
        } else if (action == ValidatorAction.Accept) {
            magicValue = EIP1271_MAGIC_VALUE;
        } else if (action == ValidatorAction.Revert) {
            revert(REVERT_REASON);
        } else if (action == ValidatorAction.UpdateState) {
            _updateState();
        } else {
            assert(action == ValidatorAction.MatchSignatureHash);
            bytes32 expectedSignatureHash = _hashSignatureHashes[hash];
            if (keccak256(signature) == expectedSignatureHash) {
                magicValue = EIP1271_MAGIC_VALUE;
            }
        }
    }

    /// @dev Validates a hash with the `Wallet` signature type.
    /// @param hash Message hash that is signed.
    /// @param signature Proof of signing.
    /// @return `LEGACY_WALLET_MAGIC_VALUE` if the signature check succeeds.
    function isValidSignature(
        bytes32 hash,
        bytes memory signature
    )
        public
        returns (bytes4 magicValue)
    {
        ValidatorAction action = _hashActions[hash];
        if (action == ValidatorAction.Reject) {
            magicValue = 0x0;
        } else if (action == ValidatorAction.Accept) {
            magicValue = LEGACY_WALLET_MAGIC_VALUE;
        } else if (action == ValidatorAction.Revert) {
            revert(REVERT_REASON);
        } else if (action == ValidatorAction.UpdateState) {
            _updateState();
        } else {
            assert(action == ValidatorAction.MatchSignatureHash);
            bytes32 expectedSignatureHash = _hashSignatureHashes[hash];
            if (keccak256(signature) == expectedSignatureHash) {
                magicValue = LEGACY_WALLET_MAGIC_VALUE;
            }
        }
    }

    /// @dev Increments state variable to trigger a state change.
    function _updateState()
        private
    {
        _state++;
    }

    function _decodeAndValidateHashFromEncodedData(bytes memory data)
            private
            view
            returns (bytes32 hash)
    {
        // First we want the hash, which is the second
        // encoded parameter. We will initially treat all fields as inline
        // `bytes32`s and ignore the first one to extract it.
        (, hash) = abi.decode(data, (bytes32, bytes32));
        // Now we can figure out what the data type is from a previous call to
        // `prepare()`.
        DataType dataType = _hashDataTypes[hash];
        require(
            dataType != DataType.None,
            "EXPECTED_NO_DATA_TYPE"
        );
        if (dataType == DataType.Order) {
            // Decode the first parameter as an `Order` type.
            LibOrder.Order memory order = abi.decode(data, (LibOrder.Order));
            // Use the Exchange to calculate the hash of the order and assert
            // that it matches the one we extracted previously.
            require(
                _exchange.getOrderHash(order) == hash,
                "UNEXPECTED_ORDER_HASH"
            );
        } else {
            assert(dataType == DataType.ZeroExTransaction);
            // Decode the first parameter as a `ZeroExTransaction` type.
            LibZeroExTransaction.ZeroExTransaction memory transaction =
                abi.decode(data, (LibZeroExTransaction.ZeroExTransaction));
            // Use the Exchange to calculate the hash of the transaction and assert
            // that it matches the one we extracted previously.
            require(
                _exchange.getTransactionHash(transaction) == hash,
                "UNEXPECTED_TRANSACTION_HASH"
            );
        }
        return hash;
    }
}
