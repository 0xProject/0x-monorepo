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
pragma experimental ABIEncoderV2;

import "@0x/contracts-exchange-libs/contracts/src/LibZeroExTransaction.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibEIP712ExchangeDomain.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibExchangeRichErrors.sol";
import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "@0x/contracts-utils/contracts/src/Refundable.sol";
import "./interfaces/ITransactions.sol";
import "./interfaces/ISignatureValidator.sol";


contract MixinTransactions is
    Refundable,
    LibEIP712ExchangeDomain,
    ISignatureValidator,
    ITransactions
{
    using LibZeroExTransaction for LibZeroExTransaction.ZeroExTransaction;

    // Mapping of transaction hash => executed
    // This prevents transactions from being executed more than once.
    mapping (bytes32 => bool) public transactionsExecuted;

    // Address of current transaction signer
    address public currentContextAddress;

    /// @dev Executes an Exchange method call in the context of signer.
    /// @param transaction 0x transaction structure.
    /// @param signature Proof that transaction has been signed by signer.
    /// @return ABI encoded return data of the underlying Exchange function call.
    function executeTransaction(
        LibZeroExTransaction.ZeroExTransaction memory transaction,
        bytes memory signature
    )
        public
        payable
        refund
        returns (bytes memory)
    {
        return _executeTransaction(transaction, signature);
    }

    /// @dev Executes a batch of Exchange method calls in the context of signer(s).
    /// @param transactions Array of 0x transaction structures.
    /// @param signatures Array of proofs that transactions have been signed by signer(s).
    /// @return Array containing ABI encoded return data for each of the underlying Exchange function calls.
    function batchExecuteTransactions(
        LibZeroExTransaction.ZeroExTransaction[] memory transactions,
        bytes[] memory signatures
    )
        public
        payable
        refund
        returns (bytes[] memory)
    {
        uint256 length = transactions.length;
        bytes[] memory returnData = new bytes[](length);
        for (uint256 i = 0; i != length; i++) {
            returnData[i] = _executeTransaction(transactions[i], signatures[i]);
        }
        return returnData;
    }

    /// @dev Executes an Exchange method call in the context of signer.
    /// @param transaction 0x transaction structure.
    /// @param signature Proof that transaction has been signed by signer.
    /// @return ABI encoded return data of the underlying Exchange function call.
    function _executeTransaction(
        LibZeroExTransaction.ZeroExTransaction memory transaction,
        bytes memory signature
    )
        internal
        returns (bytes memory)
    {
        bytes32 transactionHash = transaction.getTypedDataHash(EIP712_EXCHANGE_DOMAIN_HASH);

        _assertExecutableTransaction(
            transaction,
            signature,
            transactionHash
        );

        address signerAddress = transaction.signerAddress;
        if (signerAddress != msg.sender) {
            // Set the current transaction signer
            currentContextAddress = signerAddress;
        }

        // Execute transaction
        transactionsExecuted[transactionHash] = true;
        (bool didSucceed, bytes memory returnData) = address(this).delegatecall(transaction.data);
        if (!didSucceed) {
            LibRichErrors.rrevert(LibExchangeRichErrors.TransactionExecutionError(
                transactionHash,
                returnData
            ));
        }

        // Reset current transaction signer if it was previously updated
        if (signerAddress != msg.sender) {
            currentContextAddress = address(0);
        }

        emit TransactionExecution(transactionHash);

        return returnData;
    }

    /// @dev Validates context for executeTransaction. Succeeds or throws.
    /// @param transaction 0x transaction structure.
    /// @param signature Proof that transaction has been signed by signer.
    /// @param transactionHash EIP712 typed data hash of 0x transaction.
    function _assertExecutableTransaction(
        LibZeroExTransaction.ZeroExTransaction memory transaction,
        bytes memory signature,
        bytes32 transactionHash
    )
        internal
        view
    {
        // Check transaction is not expired
        // solhint-disable-next-line not-rely-on-time
        if (block.timestamp >= transaction.expirationTimeSeconds) {
            LibRichErrors.rrevert(LibExchangeRichErrors.TransactionError(
                LibExchangeRichErrors.TransactionErrorCodes.EXPIRED,
                transactionHash
            ));
        }

        // Validate that transaction is executed with the correct gasPrice
        uint256 requiredGasPrice = transaction.gasPrice;
        if (tx.gasprice != requiredGasPrice) {
            LibRichErrors.rrevert(LibExchangeRichErrors.TransactionGasPriceError(
                transactionHash,
                tx.gasprice,
                requiredGasPrice
            ));
        }

        // Prevent `executeTransaction` from being called when context is already set
        address currentContextAddress_ = currentContextAddress;
        if (currentContextAddress_ != address(0)) {
            LibRichErrors.rrevert(LibExchangeRichErrors.TransactionInvalidContextError(
                transactionHash,
                currentContextAddress_
            ));
        }

        // Validate transaction has not been executed
        if (transactionsExecuted[transactionHash]) {
            LibRichErrors.rrevert(LibExchangeRichErrors.TransactionError(
                LibExchangeRichErrors.TransactionErrorCodes.ALREADY_EXECUTED,
                transactionHash
            ));
        }

        // Validate signature
        // Transaction always valid if signer is sender of transaction
        address signerAddress = transaction.signerAddress;
        if (signerAddress != msg.sender && !_isValidTransactionWithHashSignature(
                transaction,
                transactionHash,
                signature
            )
        ) {
            LibRichErrors.rrevert(LibExchangeRichErrors.TransactionSignatureError(
                transactionHash,
                signerAddress,
                signature
            ));
        }
    }

    /// @dev The current function will be called in the context of this address (either 0x transaction signer or `msg.sender`).
    ///      If calling a fill function, this address will represent the taker.
    ///      If calling a cancel function, this address will represent the maker.
    /// @return Signer of 0x transaction if entry point is `executeTransaction`.
    ///         `msg.sender` if entry point is any other function.
    function _getCurrentContextAddress()
        internal
        view
        returns (address)
    {
        address currentContextAddress_ = currentContextAddress;
        address contextAddress = currentContextAddress_ == address(0) ? msg.sender : currentContextAddress_;
        return contextAddress;
    }
}
