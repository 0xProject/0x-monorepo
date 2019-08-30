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
import "@0x/contracts-exchange-libs/contracts/src/LibEIP712ExchangeDomain.sol";
import "@0x/contracts-erc20/contracts/src/interfaces/IERC20Token.sol";
import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "@0x/contracts-utils/contracts/src/LibEIP1271.sol";
import "../src/interfaces/IEIP1271Data.sol";


// solhint-disable no-unused-vars
contract TestValidatorWallet is
    LibEIP1271
{
    using LibBytes for bytes;

    // Magic bytes to be returned by `Wallet` signature type validators.
    // bytes4(keccak256("isValidWalletSignature(bytes32,address,bytes)"))
    bytes4 private constant LEGACY_WALLET_MAGIC_VALUE = 0xb0671381;

    /// @dev Revert reason for `Revert` `ValidatorAction`.
    string constant public REVERT_REASON = "you shall not pass";

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
        // Return boolean `true`,
        ReturnTrue,
        // Return no data.
        ReturnNothing,
        NTypes
    }

    /// @dev The Exchange domain hash..
    LibEIP712ExchangeDomain internal _exchange;
    /// @dev Internal state to modify.
    uint256 internal _state = 1;
    /// @dev What action to execute when a hash is validated .
    mapping (bytes32 => ValidatorAction) internal _hashActions;
    /// @dev keccak256 of the expected signature data for a hash.
    mapping (bytes32 => bytes32) internal _hashSignatureHashes;

    constructor(address exchange) public {
        _exchange = LibEIP712ExchangeDomain(exchange);
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
    /// @param action Action to take.
    /// @param signatureHash keccak256 of the expected signature data.
    function prepare(
        bytes32 hash,
        ValidatorAction action,
        bytes32 signatureHash
    )
        external
    {
        if (uint8(action) >= uint8(ValidatorAction.NTypes)) {
            revert("UNSUPPORTED_VALIDATOR_ACTION");
        }
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
        } else if (action == ValidatorAction.ReturnNothing) {
            assembly {
                return(0x0, 0)
            }
        } else if (action == ValidatorAction.ReturnTrue) {
            assembly {
                mstore(0x0, 1)
                return(0x0, 32)
            }
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
            magicValue = bytes4(0);
        } else if (action == ValidatorAction.Accept) {
            magicValue = LEGACY_WALLET_MAGIC_VALUE;
        } else if (action == ValidatorAction.Revert) {
            revert(REVERT_REASON);
        } else if (action == ValidatorAction.UpdateState) {
            _updateState();
        } else if (action == ValidatorAction.ReturnNothing) {
            assembly {
                return(0x0, 0)
            }
        } else if (action == ValidatorAction.ReturnTrue) {
            assembly {
                mstore(0x0, 1)
                return(0x0, 32)
            }
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
        bytes4 dataId = data.readBytes4(0);
        if (dataId == IEIP1271Data(address(0)).OrderWithHash.selector) {
            // Decode the order and hash
            LibOrder.Order memory order;
            (order, hash) = abi.decode(
                data.slice(4, data.length),
                (LibOrder.Order, bytes32)
            );
            // Use the Exchange to calculate the hash of the order and assert
            // that it matches the one we extracted previously.
            require(
                LibOrder.getTypedDataHash(order, _exchange.EIP712_EXCHANGE_DOMAIN_HASH()) == hash,
                "UNEXPECTED_ORDER_HASH"
            );
        } else if (dataId == IEIP1271Data(address(0)).ZeroExTransactionWithHash.selector) {
            // Decode the transaction and hash
            LibZeroExTransaction.ZeroExTransaction memory transaction;
            (transaction, hash) = abi.decode(
                data.slice(4, data.length),
                (LibZeroExTransaction.ZeroExTransaction, bytes32)
            );
            // Use the Exchange to calculate the hash of the transaction and assert
            // that it matches the one we extracted previously.
            require(
                LibZeroExTransaction.getTypedDataHash(transaction, _exchange.EIP712_EXCHANGE_DOMAIN_HASH()) == hash,
                "UNEXPECTED_TRANSACTION_HASH"
            );
        } else {
            revert("EXPECTED_NO_DATA_TYPE");
        }
        return hash;
    }
}
