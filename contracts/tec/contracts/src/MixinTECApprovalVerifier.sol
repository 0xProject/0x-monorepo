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

pragma solidity ^0.5.2;
pragma experimental "ABIEncoderV2";

import "@0x/contracts-exchange-libs/contracts/src/LibExchangeSelectors.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-utils/contracts/src/LibAddressArray.sol";
import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "./libs/LibTECApproval.sol";
import "./libs/LibZeroExTransaction.sol";
import "./mixins/MSignatureValidator.sol";
import "./mixins/MTECApprovalVerifier.sol";


contract MixinTECApprovalVerifier is
    LibExchangeSelectors,
    LibTECApproval,
    LibZeroExTransaction,
    MSignatureValidator,
    MTECApprovalVerifier
{
    using LibAddressArray for address[];
    using LibBytes for bytes;

    /// @dev Validates that the 0x transaction has been approved by all of the feeRecipients
    ///      that correspond to each order in the transaction's Exchange calldata.
    /// @param transaction 0x transaction containing salt, signerAddress, and data.
    /// @param transactionSignature Proof that the transaction has been signed by the signer.
    /// @param approvalExpirationTimeSeconds Array of expiration times in seconds for which each corresponding approval signature expires.
    /// @param approvalSignatures Array of signatures that correspond to the feeRecipients of each order in the transaction's Exchange calldata.
    function assertValidTECApproval(
        LibZeroExTransaction.ZeroExTransaction memory transaction,
        bytes memory transactionSignature,
        uint256[] memory approvalExpirationTimeSeconds,
        bytes[] memory approvalSignatures
    )
        internal
        view
    {
        // Hash 0x transaction
        bytes32 transactionHash = getTransactionHash(transaction);

        // Get the function selector of the Exchange calldata in the 0x transaction
        bytes4 exchangeFunctionSelector = transaction.data.readBytes4(0);

        if (
            exchangeFunctionSelector == FILL_ORDER_SELECTOR ||
            exchangeFunctionSelector == FILL_ORDER_NO_THROW_SELECTOR ||
            exchangeFunctionSelector == FILL_OR_KILL_ORDER_SELECTOR
        ) {
            // Decode single order
            (LibOrder.Order memory order) = abi.decode(
                transaction.data,
                (LibOrder.Order)
            );

            // Revert if approval is invalid for single order
            assertValidSingleOrderApproval(
                order,
                transactionHash,
                transactionSignature,
                approvalExpirationTimeSeconds[0],
                approvalSignatures[0]
            );
        } else if (
            exchangeFunctionSelector == BATCH_FILL_ORDERS_SELECTOR ||
            exchangeFunctionSelector == BATCH_FILL_ORDERS_NO_THROW_SELECTOR ||
            exchangeFunctionSelector == BATCH_FILL_OR_KILL_ORDERS_SELECTOR ||
            exchangeFunctionSelector == MARKET_BUY_ORDERS_SELECTOR ||
            exchangeFunctionSelector == MARKET_BUY_ORDERS_NO_THROW_SELECTOR ||
            exchangeFunctionSelector == MARKET_SELL_ORDERS_SELECTOR ||
            exchangeFunctionSelector == MARKET_SELL_ORDERS_NO_THROW_SELECTOR
        ) {
            // Decode all orders
            (LibOrder.Order[] memory orders) = abi.decode(
                transaction.data,
                (LibOrder.Order[])
            );

            // Revert if approval is invalid for batch of orders
            assertValidBatchOrderApproval(
                orders,
                transactionHash,
                transactionSignature,
                approvalExpirationTimeSeconds,
                approvalSignatures
            );
        } else if (exchangeFunctionSelector == MATCH_ORDERS_SELECTOR) {
            // Decode left and right orders
            (LibOrder.Order memory leftOrder, LibOrder.Order memory rightOrder) = abi.decode(
                transaction.data,
                (LibOrder.Order, LibOrder.Order)
            );

            // Create array of orders
            LibOrder.Order[] memory orders = new LibOrder.Order[](2);
            orders[0] = leftOrder;
            orders[1] = rightOrder;

            // Revert if approval is invalid for batch of orders
            assertValidBatchOrderApproval(
                orders,
                transactionHash,
                transactionSignature,
                approvalExpirationTimeSeconds,
                approvalSignatures
            );
        } else if (
            exchangeFunctionSelector == CANCEL_ORDERS_UP_TO_SELECTOR ||
            exchangeFunctionSelector == CANCEL_ORDER_SELECTOR ||
            exchangeFunctionSelector == BATCH_CANCEL_ORDERS_SELECTOR
        ) {
            // All cancel functions are always permitted
            return;
        } else {
            revert("INVALID_OR_BLOCKED_EXCHANGE_SELECTOR");
        }
    }

    /// @dev Validates that the feeRecipient of a single order has approved a 0x transaction.
    /// @param order Order struct containing order specifications.
    /// @param transactionHash EIP712 hash of the 0x transaction.
    /// @param transactionSignature Proof that the transaction has been signed by the signer.
    /// @param approvalExpirationTimeSeconds Expiration times in seconds for which the approval signature expires.
    /// @param approvalSignature Signatures that corresponds to the feeRecipient of the order.
    function assertValidSingleOrderApproval(
        LibOrder.Order memory order,
        bytes32 transactionHash,
        bytes memory transactionSignature,
        uint256 approvalExpirationTimeSeconds,
        bytes memory approvalSignature
    )
        internal
        view
    {
        // Do not check approval if the order's senderAddress is null
        // Do not check approval if the feeRecipient is the sender
        address approverAddress = order.feeRecipientAddress;
        if (order.senderAddress == address(0) || approverAddress == msg.sender) {
            return;
        }

        // Create approval message
        TECApproval memory approval = TECApproval({
            transactionHash: transactionHash,
            transactionSignature: transactionSignature,
            approvalExpirationTimeSeconds: approvalExpirationTimeSeconds
        });

        // Revert if approval expired
        require(
            // solhint-disable-next-line not-rely-on-time
            approvalExpirationTimeSeconds > block.timestamp,
            "APPROVAL_EXPIRED"
        );

        // Hash approval message and recover signer address
        bytes32 approvalHash = getTECApprovalHash(approval);
        address approvalSignerAddress = getAddressFromSignature(approvalHash, approvalSignature);

        // Revert if signer of approval is not the feeRecipient of order
        require(
            approverAddress == approvalSignerAddress,
            "INVALID_APPROVAL_SIGNATURE"
        );
    }

    /// @dev Validates that the feeRecipient of a single order has approved a 0x transaction.
    /// @param orders Array of order structs containing order specifications.
    /// @param transactionHash EIP712 hash of the 0x transaction.
    /// @param transactionSignature Proof that the transaction has been signed by the signer.
    /// @param approvalExpirationTimeSeconds Array of expiration times in seconds for which each corresponding approval signature expires.
    /// @param approvalSignatures Array of signatures that correspond to the feeRecipients of each order.
    function assertValidBatchOrderApproval(
        LibOrder.Order[] memory orders,
        bytes32 transactionHash,
        bytes memory transactionSignature,
        uint256[] memory approvalExpirationTimeSeconds,
        bytes[] memory approvalSignatures
    )
        internal
        view
    {
        // Create empty list of approval signers
        address[] memory approvalSignerAddresses = new address[](0);

        uint256 signaturesLength = approvalSignatures.length;
        uint256 currentApprovalExpirationTimeseconds = approvalExpirationTimeSeconds[i];
        for (uint256 i = 0; i < signaturesLength; i++) {
            // Create approval message
            TECApproval memory approval = TECApproval({
                transactionHash: transactionHash,
                transactionSignature: transactionSignature,
                approvalExpirationTimeSeconds: currentApprovalExpirationTimeseconds
            });

            // Ensure approval has not expired
            require(
                // solhint-disable-next-line not-rely-on-time
                currentApprovalExpirationTimeseconds > block.timestamp,
                "APPROVAL_EXPIRED"
            );

            // Hash approval message and recover signer address
            bytes32 approvalHash = getTECApprovalHash(approval);
            address approvalSignerAddress = getAddressFromSignature(approvalHash, approvalSignatures[i]);
    
            // Add approval signer to list of signers
            approvalSignerAddresses.append(approvalSignerAddress);
        }
        
        uint256 ordersLength = orders.length;
        for (uint256 i = 0; i < ordersLength; i++) {
            // Do not check approval if the order's senderAddress is null
            // Do not check approval if the feeRecipient is the sender
            address approverAddress = orders[i].feeRecipientAddress;
            if (orders[i].senderAddress != address(0) && approverAddress != msg.sender) {
                // Get index of feeRecipient in list of approval signers
                (bool doesExist,) = approvalSignerAddresses.indexOf(approverAddress);

                // Ensure approval signer exists
                require(
                    doesExist,
                    "INVALID_APPROVAL_SIGNATURE"
                );
            }
        }
    }
}
