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

import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "@0x/contracts-utils/contracts/src/LibEIP1271.sol";
import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "@0x/contracts-utils/contracts/src/ReentrancyGuard.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibZeroExTransaction.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibEIP712ExchangeDomain.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibExchangeRichErrors.sol";
import "./interfaces/IWallet.sol";
import "./interfaces/IEIP1271Wallet.sol";
import "./interfaces/ISignatureValidator.sol";
import "./MixinTransactions.sol";


contract MixinSignatureValidator is
    ReentrancyGuard,
    LibEIP712ExchangeDomain,
    LibEIP1271,
    ISignatureValidator,
    MixinTransactions
{
    using LibBytes for bytes;
    using LibOrder for LibOrder.Order;
    using LibZeroExTransaction for LibZeroExTransaction.ZeroExTransaction;

    // Magic bytes to be returned by `Wallet` signature type validators.
    // bytes4(keccak256("isValidWalletSignature(bytes32,address,bytes)"))
    bytes4 private constant LEGACY_WALLET_MAGIC_VALUE = 0xb0671381;

    // Mapping of hash => signer => signed
    mapping (bytes32 => mapping (address => bool)) public preSigned;

    // Mapping of signer => validator => approved
    mapping (address => mapping (address => bool)) public allowedValidators;

    /// @dev Approves a hash on-chain.
    ///      After presigning a hash, the preSign signature type will become valid for that hash and signer.
    /// @param hash Any 32-byte hash.
    function preSign(bytes32 hash)
        external
        nonReentrant
    {
        address signerAddress = _getCurrentContextAddress();
        preSigned[hash][signerAddress] = true;
    }

    /// @dev Approves/unnapproves a Validator contract to verify signatures on signer's behalf
    ///      using the `Validator` signature type.
    /// @param validatorAddress Address of Validator contract.
    /// @param approval Approval or disapproval of  Validator contract.
    function setSignatureValidatorApproval(
        address validatorAddress,
        bool approval
    )
        external
        nonReentrant
    {
        address signerAddress = _getCurrentContextAddress();
        allowedValidators[signerAddress][validatorAddress] = approval;
        emit SignatureValidatorApproval(
            signerAddress,
            validatorAddress,
            approval
        );
    }

    /// @dev Verifies that a hash has been signed by the given signer.
    /// @param hash Any 32-byte hash.
    /// @param signerAddress Address that should have signed the given hash.
    /// @param signature Proof that the hash has been signed by signer.
    /// @return isValid `true` if the signature is valid for the given hash and signer.
    function isValidHashSignature(
        bytes32 hash,
        address signerAddress,
        bytes memory signature
    )
        public
        view
        returns (bool isValid)
    {
        SignatureType signatureType = _readValidSignatureType(
            hash,
            signerAddress,
            signature
        );
        // Only hash-compatible signature types can be handled by this
        // function.
        if (
            signatureType == SignatureType.Validator ||
            signatureType == SignatureType.EIP1271Wallet
        ) {
            LibRichErrors.rrevert(LibExchangeRichErrors.SignatureError(
                LibExchangeRichErrors.SignatureErrorCodes.INAPPROPRIATE_SIGNATURE_TYPE,
                hash,
                signerAddress,
                signature
            ));
        }
        return _validateHashSignatureTypes(
            signatureType,
            hash,
            signerAddress,
            signature
        );
    }

    /// @dev Verifies that a signature for an order is valid.
    /// @param order The order.
    /// @param signature Proof that the order has been signed by signer.
    /// @return isValid `true` if the signature is valid for the given order and signer.
    function isValidOrderSignature(
        LibOrder.Order memory order,
        bytes memory signature
    )
        public
        view
        returns (bool isValid)
    {
        bytes32 orderHash = order.getTypedDataHash(EIP712_EXCHANGE_DOMAIN_HASH);
        return _isValidOrderWithHashSignature(
            order,
            orderHash,
            signature
        );
    }

    /// @dev Verifies that a signature for a transaction is valid.
    /// @param transaction The transaction.
    /// @param signature Proof that the order has been signed by signer.
    /// @return isValid `true` if the signature is valid for the given transaction and signer.
    function isValidTransactionSignature(
        LibZeroExTransaction.ZeroExTransaction memory transaction,
        bytes memory signature
    )
        public
        view
        returns (bool isValid)
    {
        bytes32 transactionHash = transaction.getTypedDataHash(EIP712_EXCHANGE_DOMAIN_HASH);
        isValid = _isValidTransactionWithHashSignature(
            transaction,
            transactionHash,
            signature
        );
    }

    /// @dev Checks if a signature is of a type that should be verified for
    /// every action.
    /// @param hash The hash of the order/transaction.
    /// @param signerAddress The address of the signer.
    /// @param signature The signature for `hash`.
    /// @return needsRegularValidation True if the signature should be validated
    ///                                for every action.
    function doesSignatureRequireRegularValidation(
        bytes32 hash,
        address signerAddress,
        bytes memory signature
    )
        public
        pure
        returns (bool needsRegularValidation)
    {
        SignatureType signatureType =  _readValidSignatureType(
            hash,
            signerAddress,
            signature
        );
        needsRegularValidation =
            signatureType == SignatureType.Wallet ||
            signatureType == SignatureType.Validator ||
            signatureType == SignatureType.EIP1271Wallet;
    }

    /// @dev Verifies that an order, with provided order hash, has been signed
    ///      by the given signer.
    /// @param order The order.
    /// @param orderHash The hash of the order.
    /// @param signature Proof that the hash has been signed by signer.
    /// @return isValid True if the signature is valid for the given order and signer.
    function _isValidOrderWithHashSignature(
        LibOrder.Order memory order,
        bytes32 orderHash,
        bytes memory signature
    )
        internal
        view
        returns (bool isValid)
    {
        address signerAddress = order.makerAddress;
        SignatureType signatureType = _readValidSignatureType(
            orderHash,
            signerAddress,
            signature
        );
        if (signatureType == SignatureType.Validator) {
            // The entire order is verified by a validator contract.
            isValid = _validateBytesWithValidator(
                abi.encode(order, orderHash),
                orderHash,
                signerAddress,
                signature
            );
        } else if (signatureType == SignatureType.EIP1271Wallet) {
            // The entire order is verified by a wallet contract.
            isValid = _validateBytesWithWallet(
                abi.encode(order, orderHash),
                orderHash,
                signerAddress,
                signature
            );
        } else {
            // Otherwise, it's one of the hash-only signature types.
            isValid = _validateHashSignatureTypes(
                signatureType,
                orderHash,
                signerAddress,
                signature
            );
        }
    }

    /// @dev Verifies that a transaction, with provided order hash, has been signed
    ///      by the given signer.
    /// @param transaction The transaction.
    /// @param transactionHash The hash of the transaction.
    /// @param signature Proof that the hash has been signed by signer.
    /// @return isValid True if the signature is valid for the given transaction and signer.
    function _isValidTransactionWithHashSignature(
        LibZeroExTransaction.ZeroExTransaction memory transaction,
        bytes32 transactionHash,
        bytes memory signature
    )
        internal
        view
        returns (bool isValid)
    {
        address signerAddress = transaction.signerAddress;
        SignatureType signatureType = _readValidSignatureType(
            transactionHash,
            signerAddress,
            signature
        );
        if (signatureType == SignatureType.Validator) {
            // The entire transaction is verified by a validator contract.
            isValid = _validateBytesWithValidator(
                abi.encode(transaction, transactionHash),
                transactionHash,
                signerAddress,
                signature
            );
        } else if (signatureType == SignatureType.EIP1271Wallet) {
            // The entire transaction is verified by a wallet contract.
            isValid = _validateBytesWithWallet(
                abi.encode(transaction, transactionHash),
                transactionHash,
                signerAddress,
                signature
            );
        } else {
            // Otherwise, it's one of the hash-only signature types.
            isValid = _validateHashSignatureTypes(
                signatureType,
                transactionHash,
                signerAddress,
                signature
            );
        }
    }

    /// Validates a hash-only signature type
    /// (anything but `Validator` and `EIP1271Wallet`).
    function _validateHashSignatureTypes(
        SignatureType signatureType,
        bytes32 hash,
        address signerAddress,
        bytes memory signature
    )
        private
        view
        returns (bool isValid)
    {
        // Always invalid signature.
        // Like Illegal, this is always implicitly available and therefore
        // offered explicitly. It can be implicitly created by providing
        // a correctly formatted but incorrect signature.
        if (signatureType == SignatureType.Invalid) {
            if (signature.length != 1) {
                LibRichErrors.rrevert(LibExchangeRichErrors.SignatureError(
                    LibExchangeRichErrors.SignatureErrorCodes.INVALID_LENGTH,
                    hash,
                    signerAddress,
                    signature
                ));
            }
            isValid = false;

        // Signature using EIP712
        } else if (signatureType == SignatureType.EIP712) {
            if (signature.length != 66) {
                LibRichErrors.rrevert(LibExchangeRichErrors.SignatureError(
                    LibExchangeRichErrors.SignatureErrorCodes.INVALID_LENGTH,
                    hash,
                    signerAddress,
                    signature
                ));
            }
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

        // Signed using web3.eth_sign
        } else if (signatureType == SignatureType.EthSign) {
            if (signature.length != 66) {
                LibRichErrors.rrevert(LibExchangeRichErrors.SignatureError(
                    LibExchangeRichErrors.SignatureErrorCodes.INVALID_LENGTH,
                    hash,
                    signerAddress,
                    signature
                ));
            }
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

        // Signature verified by wallet contract.
        } else if (signatureType == SignatureType.Wallet) {
            isValid = _validateHashWithWallet(
                hash,
                signerAddress,
                signature
            );

        // Otherwise, signatureType == SignatureType.PreSigned
        } else {
            assert(signatureType == SignatureType.PreSigned);
            // Signer signed hash previously using the preSign function.
            isValid = preSigned[hash][signerAddress];
        }
    }

    /// Reads the `SignatureType` from the end of a signature and validates it.
    function _readValidSignatureType(
        bytes32 hash,
        address signerAddress,
        bytes memory signature
    )
        private
        pure
        returns (SignatureType signatureType)
    {
        // Disallow address zero because it is ecrecover() returns zero on
        // failure.
        if (signerAddress == address(0)) {
            LibRichErrors.rrevert(LibExchangeRichErrors.SignatureError(
                LibExchangeRichErrors.SignatureErrorCodes.INVALID_SIGNER,
                hash,
                signerAddress,
                signature
            ));
        }

        if (signature.length == 0) {
            LibRichErrors.rrevert(LibExchangeRichErrors.SignatureError(
                LibExchangeRichErrors.SignatureErrorCodes.INVALID_LENGTH,
                hash,
                signerAddress,
                signature
            ));
        }

        // Read the last byte off of signature byte array.
        uint8 signatureTypeRaw = uint8(signature[signature.length - 1]);

        // Ensure signature is supported
        if (signatureTypeRaw >= uint8(SignatureType.NSignatureTypes)) {
            LibRichErrors.rrevert(LibExchangeRichErrors.SignatureError(
                LibExchangeRichErrors.SignatureErrorCodes.UNSUPPORTED,
                hash,
                signerAddress,
                signature
            ));
        }

        // Always illegal signature.
        // This is always an implicit option since a signer can create a
        // signature array with invalid type or length. We may as well make
        // it an explicit option. This aids testing and analysis. It is
        // also the initialization value for the enum type.
        if (SignatureType(signatureTypeRaw) == SignatureType.Illegal) {
            LibRichErrors.rrevert(LibExchangeRichErrors.SignatureError(
                LibExchangeRichErrors.SignatureErrorCodes.ILLEGAL,
                hash,
                signerAddress,
                signature
            ));
        }

        return SignatureType(signatureTypeRaw);
    }

    /// @dev Verifies a hash and signature using logic defined by Wallet contract.
    /// @param hash Any 32 byte hash.
    /// @param walletAddress Address that should have signed the given hash
    ///                      and defines its own signature verification method.
    /// @param signature Proof that the hash has been signed by signer.
    /// @return isValid True if the signature is validated by the Wallet.
    function _validateHashWithWallet(
        bytes32 hash,
        address walletAddress,
        bytes memory signature
    )
        private
        view
        returns (bool isValid)
    {
        // A signature using this type should be encoded as:
        // | Offset   | Length | Contents                        |
        // | 0x00     | x      | Signature to validate           |
        // | 0x00 + x | 1      | Signature type is always "\x04" |

        uint256 signatureLength = signature.length;
        // HACK(dorothy-zbornak): Temporarily shave the signature type
        // from the signature for the encode call then restore
        // it immediately after because we want to keep signatures intact.
        assembly {
            mstore(signature, sub(signatureLength, 1))
        }
        // Encode the call data.
        bytes memory callData = abi.encodeWithSelector(
            IWallet(walletAddress).isValidSignature.selector,
            hash,
            signature
        );
        // Restore the full signature.
        assembly {
            mstore(signature, signatureLength)
        }
        // Static call the verification function.
        (bool didSucceed, bytes memory returnData) = walletAddress.staticcall(callData);
        // Return data should be `LEGACY_WALLET_MAGIC_VALUE`.
        if (didSucceed && returnData.length <= 32) {
            return returnData.readBytes4(0) == LEGACY_WALLET_MAGIC_VALUE;
        }
        // Static call to verifier failed.
        LibRichErrors.rrevert(LibExchangeRichErrors.SignatureWalletError(
            hash,
            walletAddress,
            signature,
            returnData
        ));
    }

    /// @dev Verifies arbitrary data and a signature via an EIP1271 Wallet
    ///      contract, where the wallet address is also the signer address.
    /// @param data Arbitrary signed data.
    /// @param hash The hash associated with the data.
    /// @param walletAddress Contract that will verify the data and signature.
    /// @param signature Proof that the data has been signed by signer.
    /// @return isValid True if the signature is validated by the Wallet.
    function _validateBytesWithWallet(
        bytes memory data,
        bytes32 hash,
        address walletAddress,
        bytes memory signature
    )
        private
        view
        returns (bool isValid)
    {
        // A signature using this type should be encoded as:
        // | Offset   | Length | Contents                        |
        // | 0x00     | x      | Signature to validate           |
        // | 0x00 + x | 1      | Signature type is always "\x07" |

        uint256 signatureLength = signature.length;
        // HACK(dorothy-zbornak): Temporarily shave the signature type
        // from the signature for the encode call then restore
        // it immediately after because we want to keep signatures intact.
        assembly {
            mstore(signature, sub(signatureLength, 1))
        }
        // Encode the call data.
        bytes memory callData = abi.encodeWithSelector(
            IEIP1271Wallet(walletAddress).isValidSignature.selector,
            data,
            signature
        );
        // Restore the full signature.
        assembly {
            mstore(signature, signatureLength)
        }
        // Static call the verification function.
        (bool didSucceed, bytes memory returnData) = walletAddress.staticcall(callData);
        // Return data should be the `EIP1271_MAGIC_VALUE`.
        if (didSucceed && returnData.length <= 32) {
            return returnData.readBytes4(0) == EIP1271_MAGIC_VALUE;
        }
        // Static call to verifier failed.
        LibRichErrors.rrevert(LibExchangeRichErrors.SignatureWalletError(
            hash,
            walletAddress,
            signature,
            returnData
        ));
    }

    /// @dev Verifies arbitrary data and a signature via an EIP1271 contract
    ///      whose address is encoded in the signature.
    /// @param data Arbitrary signed data.
    /// @param hash The hash associated with the data.
    /// @param signerAddress Address that should have signed the given hash.
    /// @param signature Proof that the data has been signed by signer.
    /// @return isValid True if the signature is validated by the validator contract.
    function _validateBytesWithValidator(
        bytes memory data,
        bytes32 hash,
        address signerAddress,
        bytes memory signature
    )
        private
        view
        returns (bool isValid)
    {
        // A signature using this type should be encoded as:
        // | Offset   | Length | Contents                        |
        // | 0x00     | x      | Signature to validate           |
        // | 0x00 + x | 20     | Address of validator contract   |
        // | 0x14 + x | 1      | Signature type is always "\x05" |

        uint256 signatureLength = signature.length;
        // Read the validator address from the signature.
        address validatorAddress = signature.readAddress(signatureLength - 21);
        // Ensure signer has approved validator.
        if (!allowedValidators[signerAddress][validatorAddress]) {
            LibRichErrors.rrevert(LibExchangeRichErrors.SignatureValidatorNotApprovedError(
                signerAddress,
                validatorAddress
            ));
        }
        // HACK(dorothy-zbornak): Temporarily shave the validator address
        // and signature type from the signature for the encode call then restore
        // it immediately after because we want to keep signatures intact.
        assembly {
            mstore(signature, sub(signatureLength, 21))
        }
        // Encode the call data.
        bytes memory callData = abi.encodeWithSelector(
            IEIP1271Wallet(validatorAddress).isValidSignature.selector,
            data,
            signature
        );
        // Restore the full signature.
        assembly {
            mstore(signature, signatureLength)
        }
        // Static call the verification function.
        (bool didSucceed, bytes memory returnData) = validatorAddress.staticcall(callData);
        // Return data should be the `EIP1271_MAGIC_VALUE`.
        if (didSucceed && returnData.length <= 32) {
            return returnData.readBytes4(0) == EIP1271_MAGIC_VALUE;
        }
        // Static call to verifier failed.
        LibRichErrors.rrevert(LibExchangeRichErrors.SignatureValidatorError(
            hash,
            signerAddress,
            validatorAddress,
            signature,
            returnData
        ));
    }
}
