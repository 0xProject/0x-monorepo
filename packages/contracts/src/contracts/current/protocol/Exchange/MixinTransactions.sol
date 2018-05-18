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
pragma solidity ^0.4.24;

import "./mixins/MSignatureValidator.sol";
import "./mixins/MTransactions.sol";
import "./libs/LibExchangeErrors.sol";

contract MixinTransactions is
    LibExchangeErrors,
    MSignatureValidator,
    MTransactions
{

    // Mapping of transaction hash => executed
    // This prevents transactions from being executed more than once.
    mapping (bytes32 => bool) public transactions;

    // Address of current transaction signer
    address public currentContextAddress;

    /// @dev Executes an exchange method call in the context of signer.
    /// @param salt Arbitrary number to ensure uniqueness of transaction hash.
    /// @param signer Address of transaction signer.
    /// @param data AbiV2 encoded calldata.
    /// @param signature Proof of signer transaction by signer.
    function executeTransaction(
        uint256 salt,
        address signer,
        bytes data,
        bytes signature)
        external
    {
        // Prevent reentrancy
        require(currentContextAddress == address(0));

        // Calculate transaction hash
        bytes32 transactionHash = keccak256(
            address(this),
            salt,
            data
        );

        // Validate transaction has not been executed
        require(
            !transactions[transactionHash],
            DUPLICATE_TRANSACTION_HASH
        );

        // TODO: is SignatureType.Caller necessary if we make this check?
        if (signer != msg.sender) {
            // Validate signature
            require(
                isValidSignature(transactionHash, signer, signature),
                SIGNATURE_VALIDATION_FAILED
            );

            // Set the current transaction signer
            currentContextAddress = signer;
        }

        // Execute transaction
        transactions[transactionHash] = true;
        require(
            address(this).delegatecall(data),
            TRANSACTION_EXECUTION_FAILED
        );

        // Reset current transaction signer
        // TODO: Check if gas is paid when currentContextAddress is already 0.
        currentContextAddress = address(0);
    }

    /// @dev The current function will be called in the context of this address (either 0x transaction signer or `msg.sender`).
    ///      If calling a fill function, this address will represent the taker.
    ///      If calling a cancel function, this address will represent the maker.
    /// @return Signer of 0x transaction if entry point is `executeTransaction`.
    ///         `msg.sender` if entry point is any other function.
    function getCurrentContextAddress()
        internal
        view
        returns (address)
    {
        address contextAddress = currentContextAddress == address(0) ? msg.sender : currentContextAddress;
        return contextAddress;
    }
}
