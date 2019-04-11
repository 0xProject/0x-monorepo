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
pragma experimental ABIEncoderV2;

import "@0x/contracts-exchange-libs/contracts/src/LibZeroExTransaction.sol";
import "./mixins/MSignatureValidator.sol";
import "./mixins/MTransactions.sol";
import "./mixins/MExchangeRichErrors.sol";


contract MixinTransactions is
    LibZeroExTransaction,
    MSignatureValidator,
    MTransactions,
    MExchangeRichErrors
{

    // Mapping of transaction hash => executed
    // This prevents transactions from being executed more than once.
    mapping (bytes32 => bool) public transactions;

    // Address of current transaction signer
    address public currentContextAddress;

    /// @dev Executes an exchange method call in the context of signer.
    /// @param transaction 0x transaction containing salt, signerAddress, and data.
    /// @param signature Proof of signer transaction by signer.
    function executeTransaction(
        ZeroExTransaction memory transaction,
        bytes memory signature
    )
        public
    {
        bytes32 transactionHash = getTransactionHash(transaction);

        // Prevent reentrancy
        if (currentContextAddress != address(0)) {
            rrevert(TransactionError(
                TransactionErrorCodes.NO_REENTRANCY,
                transactionHash
            ));
        }

        // Validate transaction has not been executed
        if (transactions[transactionHash]) {
            rrevert(TransactionError(
                TransactionErrorCodes.ALREADY_EXECUTED,
                transactionHash
            ));
        }

        // Transaction always valid if signer is sender of transaction
        address signerAddress = transaction.signerAddress;
        if (signerAddress != msg.sender) {
            // Validate signature
            if (!isValidSignature(
                    transactionHash,
                    signerAddress,
                    signature)) {
                rrevert(TransactionSignatureError(
                    transactionHash,
                    signerAddress,
                    signature
                ));
            }

            // Set the current transaction signer
            currentContextAddress = signerAddress;
        }

        // Execute transaction
        transactions[transactionHash] = true;
        (bool didSucceed, bytes memory callReturnData) = address(this).delegatecall(transaction.data);
        if (!didSucceed) {
            rrevert(TransactionExecutionError(
                transactionHash,
                callReturnData
            ));
        }

        // Reset current transaction signer if it was previously updated
        if (signerAddress != msg.sender) {
            currentContextAddress = address(0);
        }
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
        address currentContextAddress_ = currentContextAddress;
        address contextAddress = currentContextAddress_ == address(0) ? msg.sender : currentContextAddress_;
        return contextAddress;
    }
}
