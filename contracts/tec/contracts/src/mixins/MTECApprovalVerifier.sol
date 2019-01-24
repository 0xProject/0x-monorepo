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

import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "../libs/LibZeroExTransaction.sol";


contract MTECApprovalVerifier {

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
        view;

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
        view;

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
        view;
}
