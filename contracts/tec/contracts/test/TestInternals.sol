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

pragma solidity ^0.5.3;
pragma experimental "ABIEncoderV2";

import "../src/MixinSignatureValidator.sol";
import "../src/MixinTECApprovalVerifier.sol";


contract TestInternals is
    MixinSignatureValidator,
    MixinTECApprovalVerifier
{
    /// @dev Recovers the address of a signer given a hash and signature.
    /// @param hash Any 32 byte hash.
    /// @param signature Proof that the hash has been signed by signer.
    function publicGetSignerAddress(bytes32 hash, bytes memory signature)
        public
        pure
        returns (address signerAddress)
    {
        signerAddress = getSignerAddress(hash, signature);
        return signerAddress;
    }

    /// @dev Validates that the 0x transaction has been approved by all of the feeRecipients
    ///      that correspond to each order in the transaction's Exchange calldata.
    /// @param transaction 0x transaction containing salt, signerAddress, and data.
    /// @param transactionSignature Proof that the transaction has been signed by the signer.
    /// @param approvalExpirationTimeSeconds Array of expiration times in seconds for which each corresponding approval signature expires.
    /// @param approvalSignatures Array of signatures that correspond to the feeRecipients of each order in the transaction's Exchange calldata.
    function publicAssertValidTECApproval(
        LibZeroExTransaction.ZeroExTransaction memory transaction,
        bytes memory transactionSignature,
        uint256[] memory approvalExpirationTimeSeconds,
        bytes[] memory approvalSignatures
    )
        public
        view
        returns (bool)
    {
        assertValidTECApproval(
            transaction,
            transactionSignature,
            approvalExpirationTimeSeconds,
            approvalSignatures
        );
        return true;
    }


    /// @dev Validates that the feeRecipient of a single order has approved a 0x transaction.
    /// @param order Order struct containing order specifications.
    /// @param transactionHash EIP712 hash of the 0x transaction.
    /// @param transactionSignature Proof that the transaction has been signed by the signer.
    /// @param approvalExpirationTimeSeconds Expiration times in seconds for which the approval signature expires.
    /// @param approvalSignature Signatures that corresponds to the feeRecipient of the order.
    function publicAssertValidSingleOrderApproval(
        LibOrder.Order memory order,
        bytes32 transactionHash,
        bytes memory transactionSignature,
        uint256 approvalExpirationTimeSeconds,
        bytes memory approvalSignature
    )
        public
        view
        returns (bool)
    {
        assertValidSingleOrderApproval(
            order,
            transactionHash,
            transactionSignature,
            approvalExpirationTimeSeconds,
            approvalSignature
        );
        return true;
    }

    /// @dev Validates that the feeRecipient of a single order has approved a 0x transaction.
    /// @param orders Array of order structs containing order specifications.
    /// @param transactionHash EIP712 hash of the 0x transaction.
    /// @param transactionSignature Proof that the transaction has been signed by the signer.
    /// @param approvalExpirationTimeSeconds Array of expiration times in seconds for which each corresponding approval signature expires.
    /// @param approvalSignatures Array of signatures that correspond to the feeRecipients of each order.
    function publicAssertValidBatchOrderApproval(
        LibOrder.Order[] memory orders,
        bytes32 transactionHash,
        bytes memory transactionSignature,
        uint256[] memory approvalExpirationTimeSeconds,
        bytes[] memory approvalSignatures
    )
        public
        view
        returns (bool)
    {
        assertValidBatchOrderApproval(
            orders,
            transactionHash,
            transactionSignature,
            approvalExpirationTimeSeconds,
            approvalSignatures
        );
        return true;
    }
}