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

pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;

import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibZeroExTransaction.sol";


contract ISignatureValidator {

   // Allowed signature types.
    enum SignatureType {
        Illegal,                     // 0x00, default value
        Invalid,                     // 0x01
        EIP712,                      // 0x02
        EthSign,                     // 0x03
        Wallet,                      // 0x04
        Validator,                   // 0x05
        PreSigned,                   // 0x06
        EIP1271Wallet,               // 0x07
        NSignatureTypes              // 0x08, number of signature types. Always leave at end.
    }

    event SignatureValidatorApproval(
        address indexed signerAddress,     // Address that approves or disapproves a contract to verify signatures.
        address indexed validatorAddress,  // Address of signature validator contract.
        bool approved                      // Approval or disapproval of validator contract.
    );

    /// @dev Approves a hash on-chain.
    ///      After presigning a hash, the preSign signature type will become valid for that hash and signer.
    /// @param hash Any 32-byte hash.
    function preSign(bytes32 hash)
        external;

    /// @dev Approves/unnapproves a Validator contract to verify signatures on signer's behalf.
    /// @param validatorAddress Address of Validator contract.
    /// @param approval Approval or disapproval of  Validator contract.
    function setSignatureValidatorApproval(
        address validatorAddress,
        bool approval
    )
        external;

    /// @dev Approves/unnapproves an OrderValidator contract to verify signatures on signer's behalf
    ///      using the `OrderValidator` signature type.
    /// @param validatorAddress Address of Validator contract.
    /// @param approval Approval or disapproval of  Validator contract.
    function setOrderValidatorApproval(
        address validatorAddress,
        bool approval
    )
        external;

    /// @dev Verifies that a signature for an order is valid.
    /// @param order The order.
    /// @param signerAddress Address that should have signed the given order.
    /// @param signature Proof that the order has been signed by signer.
    /// @return isValid true if the signature is valid for the given order and signer.
    function isValidOrderSignature(
        LibOrder.Order memory order,
        address signerAddress,
        bytes memory signature
    )
        public
        view
        returns (bool isValid);

    /// @dev Verifies that a signature for a transaction is valid.
    /// @param transaction The transaction.
    /// @param signerAddress Address that should have signed the given order.
    /// @param signature Proof that the order has been signed by signer.
    /// @return isValid true if the signature is valid for the given transaction and signer.
    function isValidTransactionSignature(
        LibZeroExTransaction.ZeroExTransaction memory transaction,
        address signerAddress,
        bytes memory signature
    )
        public
        view
        returns (bool isValid);

    /// @dev Checks if a signature is of a type that should be verified for
    /// every subsequent fill.
    /// @param orderHash The hash of the order.
    /// @param signerAddress The address of the signer.
    /// @param signature The signature for `orderHash`.
    /// @return needsRegularValidation True if the signature should be validated
    ///                                for every operation.
    function doesSignatureRequireRegularValidation(
        bytes32 orderHash,
        address signerAddress,
        bytes memory signature
    )
        public
        pure
        returns (bool needsRegularValidation);
}
