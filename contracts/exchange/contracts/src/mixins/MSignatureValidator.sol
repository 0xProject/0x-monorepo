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

import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "../interfaces/ISignatureValidator.sol";


contract MSignatureValidator is
    ISignatureValidator
{
    event SignatureValidatorApproval(
        address indexed signerAddress,     // Address that approves or disapproves a contract to verify signatures.
        address indexed validatorAddress,  // Address of signature validator contract.
        bool approved                      // Approval or disapproval of validator contract.
    );

    // Allowed signature types.
    enum SignatureType {
        Illegal,                // 0x00, default value
        Invalid,                // 0x01
        EIP712,                 // 0x02
        EthSign,                // 0x03
        Wallet,                 // 0x04
        Validator,              // 0x05
        PreSigned,              // 0x06
        OrderValidator,         // 0x07
        WalletOrderValidator,   // 0x08
        NSignatureTypes         // 0x09, number of signature types. Always leave at end.
    }

    /// @dev Verifies that an order, with provided order hash, has been signed
    ///      by the given signer.
    /// @param order The order.
    /// @param orderHash The hash of the order.
    /// @param signerAddress Address that should have signed the.Signat given hash.
    /// @param signature Proof that the hash has been signed by signer.
    /// @return True if the signature is valid for the given hash and signer.
    function isValidOrderWithHashSignature(
        LibOrder.Order memory order,
        bytes32 orderHash,
        address signerAddress,
        bytes memory signature
    )
        internal
        view
        returns (bool isValid);
}
