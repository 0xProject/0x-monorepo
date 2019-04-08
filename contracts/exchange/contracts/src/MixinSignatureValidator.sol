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

import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "@0x/contracts-utils/contracts/src/ReentrancyGuard.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "./mixins/MSignatureValidator.sol";
import "./mixins/MTransactions.sol";
import "./interfaces/IWallet.sol";
import "./interfaces/IValidator.sol";


contract MixinSignatureValidator is
    ReentrancyGuard,
    LibOrder,
    MSignatureValidator,
    MTransactions
{
    using LibBytes for bytes;

    // Mapping of hash => signer => signed
    mapping (bytes32 => mapping (address => bool)) public preSigned;

    // Mapping of signer => validator => approved
    mapping (address => mapping (address => bool)) public allowedValidators;

    /// @dev Approves a hash on-chain using any valid signature type.
    ///      After presigning a hash, the preSign signature type will become valid for that hash and signer.
    /// @param signerAddress Address that should have signed the given hash.
    /// @param signature Proof that the hash has been signed by signer.
    function preSign(
        bytes32 hash,
        address signerAddress,
        bytes calldata signature
    )
        external
    {
        if (signerAddress != msg.sender) {
            require(
                isValidHashSignature(
                    hash,
                    signerAddress,
                    signature
                ),
                "INVALID_SIGNATURE"
            );
        }
        preSigned[hash][signerAddress] = true;
    }

    /// @dev Approves/unnapproves a Validator contract to verify signatures on signer's behalf.
    /// @param validatorAddress Address of Validator contract.
    /// @param approval Approval or disapproval of  Validator contract.
    function setSignatureValidatorApproval(
        address validatorAddress,
        bool approval
    )
        external
        nonReentrant
    {
        address signerAddress = getCurrentContextAddress();
        allowedValidators[signerAddress][validatorAddress] = approval;
        emit SignatureValidatorApproval(
            signerAddress,
            validatorAddress,
            approval
        );
    }

    /// @dev Verifies that a signature for an order is valid.
    /// @param order The order.
    /// @param signerAddress Address that should have signed the given order.
    /// @param signature Proof that the order has been signed by signer.
    /// @return True if the signature is valid for the given order and signer.
    function isValidOrderSignature(
        Order memory order,
        address signerAddress,
        bytes memory signature
    )
        public
        view
        returns (bool isValid)
    {
        bytes32 orderHash = getOrderHash(order);
        return isValidOrderWithHashSignature(
            order,
            orderHash,
            signerAddress,
            signature
        );
    }

    /// @dev Verifies that a hash has been signed by the given signer.
    /// @param hash Any 32-byte hash.
    /// @param signerAddress Address that should have signed the.Signat given hash.
    /// @param signature Proof that the hash has been signed by signer.
    /// @return True if the signature is valid for the given hash and signer.
    function isValidHashSignature(
        bytes32 hash,
        address signerAddress,
        bytes memory signature
    )
        public
        view
        returns (bool isValid)
    {
        SignatureType signatureType = popValidSignatureType(signature);
        // Only hash-compatible signature types can be handled by this
        // function.
        require(
            signatureType != SignatureType.OrderValidator,
            "INAPPROPRIATE_SIGNATURE_TYPE"
        );
        return validateHashSignatureTypes(
            signatureType,
            hash,
            signerAddress,
            signature
        );
    }

    /// @dev Verifies that an order, with provided order hash, has been signed
    ///      by the given signer.
    /// @param order The order.
    /// @param orderHash The hash of the order.
    /// @param signerAddress Address that should have signed the.Signat given hash.
    /// @param signature Proof that the hash has been signed by signer.
    /// @return True if the signature is valid for the given hash and signer.
    function isValidOrderWithHashSignature(
        Order memory order,
        bytes32 orderHash,
        address signerAddress,
        bytes memory signature
    )
        internal
        view
        returns (bool isValid)
    {
        SignatureType signatureType = popValidSignatureType(signature);
        if (signatureType == SignatureType.OrderValidator) {
            // The entire order is verified by validator contract.

            // A signature using this type should be encoded as:
            // | Offset   | Length | Contents                        |
            // | 0x00     | x      | Signature to validate           |
            // | 0x00 + x | 20     | Address of validator contract   |
            // | 0x14 + x | 1      | Signature type is always "\x07" |

            // Pop last 20 bytes off of signature byte array.
            address validatorAddress = signature.popLast20Bytes();

            // Ensure signer has approved validator.
            if (!allowedValidators[signerAddress][validatorAddress]) {
                return false;
            }
            isValid = isValidOrderValidatorSignature(
                validatorAddress,
                order,
                signerAddress,
                signature
            );
            return isValid;
        }
        // Otherwise, it's one of the hash-compatible signature types.
        return validateHashSignatureTypes(
            signatureType,
            orderHash,
            signerAddress,
            signature
        );
    }

    /// @dev Verifies signature using logic defined by Wallet contract.
    /// @param hash Any 32 byte hash.
    /// @param walletAddress Address that should have signed the given hash
    ///                      and defines its own signature verification method.
    /// @param signature Proof that the hash has been signed by signer.
    /// @return True if signature is valid for given wallet..
    function isValidWalletSignature(
        bytes32 hash,
        address walletAddress,
        bytes memory signature
    )
        internal
        view
        returns (bool isValid)
    {
        bytes memory callData = abi.encodeWithSelector(
            IWallet(walletAddress).isValidSignature.selector,
            hash,
            signature
        );
        assembly {
            let cdStart := add(callData, 32)
            let success := staticcall(
                gas,              // forward all gas
                walletAddress,    // address of Wallet contract
                cdStart,          // pointer to start of input
                mload(callData),  // length of input
                cdStart,          // write output over input
                32                // output size is 32 bytes
            )

            switch success
            case 0 {
                // Revert with `Error("WALLET_ERROR")`
                mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                mstore(64, 0x0000000c57414c4c45545f4552524f5200000000000000000000000000000000)
                mstore(96, 0)
                revert(0, 100)
            }
            case 1 {
                // Signature is valid if call did not revert and returned true
                isValid := mload(cdStart)
            }
        }
        return isValid;
    }

    /// @dev Verifies signature using logic defined by Validator contract.
    /// @param validatorAddress Address of validator contract.
    /// @param hash Any 32 byte hash.
    /// @param signerAddress Address that should have signed the given hash.
    /// @param signature Proof that the hash has been signed by signer.
    /// @return True if the address recovered from the provided signature matches the input signer address.
    function isValidValidatorSignature(
        address validatorAddress,
        bytes32 hash,
        address signerAddress,
        bytes memory signature
    )
        internal
        view
        returns (bool isValid)
    {
        bytes memory callData = abi.encodeWithSelector(
            IValidator(signerAddress).isValidSignature.selector,
            hash,
            signerAddress,
            signature
        );
        assembly {
            let cdStart := add(callData, 32)
            let success := staticcall(
                gas,               // forward all gas
                validatorAddress,  // address of Validator contract
                cdStart,           // pointer to start of input
                mload(callData),   // length of input
                cdStart,           // write output over input
                32                 // output size is 32 bytes
            )

            switch success
            case 0 {
                // Revert with `Error("VALIDATOR_ERROR")`
                mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                mstore(64, 0x0000000f56414c494441544f525f4552524f5200000000000000000000000000)
                mstore(96, 0)
                revert(0, 100)
            }
            case 1 {
                // Signature is valid if call did not revert and returned true
                isValid := mload(cdStart)
            }
        }
        return isValid;
    }

    /// @dev Verifies order AND signature via Validator contract.
    /// @param validatorAddress Address of validator contract.
    /// @param order The order.
    /// @param signerAddress Address that should have signed the given hash.
    /// @param signature Proof that the hash has been signed by signer.
    /// @return True if the address recovered from the provided signature matches the input signer address.
    function isValidOrderValidatorSignature(
        address validatorAddress,
        Order memory order,
        address signerAddress,
        bytes memory signature
    )
        internal
        view
        returns (bool isValid)
    {
        bytes memory callData = abi.encodeWithSelector(
            IValidator(signerAddress).isValidOrder.selector,
            order,
            signerAddress,
            signature
        );
        assembly {
            let cdStart := add(callData, 32)
            let success := staticcall(
                gas,               // forward all gas
                validatorAddress,  // address of Validator contract
                cdStart,           // pointer to start of input
                mload(callData),   // length of input
                cdStart,           // write output over input
                32                 // output size is 32 bytes
            )

            switch success
            case 0 {
                // Revert with `Error("VALIDATOR_ERROR")`
                mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                mstore(64, 0x0000000f56414c494441544f525f4552524f5200000000000000000000000000)
                mstore(96, 0)
                revert(0, 100)
            }
            case 1 {
                // Signature is valid if call did not revert and returned true
                isValid := mload(cdStart)
            }
        }
        return isValid;
    }

    /// Pops the `SignatureType` from the end of a signature and validates it.
    function popValidSignatureType(
        bytes memory signature
    )
        private
        view
        returns (SignatureType signatureType)
    {
        require(
            signature.length > 0,
            "LENGTH_GREATER_THAN_0_REQUIRED"
        );

        // Pop last byte off of signature byte array.
        uint8 signatureTypeRaw = uint8(signature.popLastByte());

        // Ensure signature is supported
        require(
            signatureTypeRaw < uint8(SignatureType.NSignatureTypes),
            "SIGNATURE_UNSUPPORTED"
        );

        return SignatureType(signatureTypeRaw);
    }

    /// Validates a hash-compatible signature type
    /// (anything but `SignatureType.OrderValidator`).
    function validateHashSignatureTypes(
        SignatureType signatureType,
        bytes32 hash,
        address signerAddress,
        bytes memory signature
    )
        private
        view
        returns (bool isValid)
    {
        // Always illegal signature.
        // This is always an implicit option since a signer can create a
        // signature array with invalid type or length. We may as well make
        // it an explicit option. This aids testing and analysis. It is
        // also the initialization value for the enum type.
        if (signatureType == SignatureType.Illegal) {
            revert("SIGNATURE_ILLEGAL");

        // Always invalid signature.
        // Like Illegal, this is always implicitly available and therefore
        // offered explicitly. It can be implicitly created by providing
        // a correctly formatted but incorrect signature.
        } else if (signatureType == SignatureType.Invalid) {
            require(
                signature.length == 0,
                "LENGTH_0_REQUIRED"
            );
            isValid = false;
            return isValid;

        // Signature using EIP712
        } else if (signatureType == SignatureType.EIP712) {
            require(
                signature.length == 65,
                "LENGTH_65_REQUIRED"
            );
            uint8 v = uint8(signature[0]);
            bytes32 r = signature.readBytes32(1);
            bytes32 s = signature.readBytes32(33);
            address recovered = ecrecover(
                hash,
                v,
                r,
                s
            );
            isValid = signerAddress == recovered;
            return isValid;

        // Signed using web3.eth_sign
        } else if (signatureType == SignatureType.EthSign) {
            require(
                signature.length == 65,
                "LENGTH_65_REQUIRED"
            );
            uint8 v = uint8(signature[0]);
            bytes32 r = signature.readBytes32(1);
            bytes32 s = signature.readBytes32(33);
            address recovered = ecrecover(
                keccak256(abi.encodePacked(
                    "\x19Ethereum Signed Message:\n32",
                    hash
                )),
                v,
                r,
                s
            );
            isValid = signerAddress == recovered;
            return isValid;

        // Signature verified by wallet contract.
        // If used with an order, the maker of the order is the wallet contract.
        } else if (signatureType == SignatureType.Wallet) {
            isValid = isValidWalletSignature(
                hash,
                signerAddress,
                signature
            );
            return isValid;

        // Signature verified by validator contract.
        // If used with an order, the maker of the order can still be an EOA.
        // A signature using this type should be encoded as:
        // | Offset   | Length | Contents                        |
        // | 0x00     | x      | Signature to validate           |
        // | 0x00 + x | 20     | Address of validator contract   |
        // | 0x14 + x | 1      | Signature type is always "\x06" |
        } else if (signatureType == SignatureType.Validator) {
            // Pop last 20 bytes off of signature byte array.
            address validatorAddress = signature.popLast20Bytes();

            // Ensure signer has approved validator.
            if (!allowedValidators[signerAddress][validatorAddress]) {
                return false;
            }
            isValid = isValidValidatorSignature(
                validatorAddress,
                hash,
                signerAddress,
                signature
            );
            return isValid;

        }
        // Otherwise, signatureType == SignatureType.PreSigned
        assert(signatureType == SignatureType.PreSigned);
        // Signer signed hash previously using the preSign function.
        return preSigned[hash][signerAddress];
    }
}
