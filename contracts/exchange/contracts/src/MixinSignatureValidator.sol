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
import "./mixins/MExchangeRichErrors.sol";
import "./interfaces/IWallet.sol";
import "./interfaces/IValidator.sol";
import "./interfaces/IOrderValidator.sol";


contract MixinSignatureValidator is
    ReentrancyGuard,
    LibOrder,
    MSignatureValidator,
    MTransactions,
    MExchangeRichErrors
{
    using LibBytes for bytes;

    // Mapping of hash => signer => signed
    mapping (bytes32 => mapping (address => bool)) public preSigned;

    // Mapping of signer => validator => approved
    mapping (address => mapping (address => bool)) public allowedValidators;

    // Mapping of signer => order validator => approved
    mapping (address => mapping (address => bool)) public allowedOrderValidators;

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
            if (!isValidHashSignature(
                    hash,
                    signerAddress,
                    signature)) {
                rrevert(SignatureError(
                    SignatureErrorCodes.BAD_SIGNATURE,
                    hash,
                    signerAddress,
                    signature
                ));
            }
        }
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
        address signerAddress = getCurrentContextAddress();
        allowedValidators[signerAddress][validatorAddress] = approval;
        emit SignatureValidatorApproval(
            signerAddress,
            validatorAddress,
            approval
        );
    }

    /// @dev Approves/unnapproves an OrderValidator contract to verify signatures on signer's behalf
    ///      using the `OrderValidator` signature type.
    /// @param validatorAddress Address of Validator contract.
    /// @param approval Approval or disapproval of  Validator contract.
    function setOrderValidatorApproval(
        address validatorAddress,
        bool approval
    )
        external
        nonReentrant
    {
        address signerAddress = getCurrentContextAddress();
        allowedOrderValidators[signerAddress][validatorAddress] = approval;
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
    /// @param signerAddress Address that should have signed the given hash.
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
        SignatureType signatureType = readValidSignatureType(
            hash,
            signerAddress,
            signature
        );
        // Only hash-compatible signature types can be handled by this
        // function.
        if (signatureType == SignatureType.OrderValidator ||
            signatureType == SignatureType.WalletOrderValidator) {
            rrevert(SignatureError(
                SignatureErrorCodes.INAPPROPRIATE_SIGNATURE_TYPE,
                hash,
                signerAddress,
                signature
            ));
        }
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
        SignatureType signatureType = readValidSignatureType(
            orderHash,
            signerAddress,
            signature
        );
        if (signatureType == SignatureType.OrderValidator) {
            // The entire order is verified by validator contract.
            isValid = validateOrderWithValidator(
                order,
                orderHash,
                signerAddress,
                signature
            );
            return isValid;
        } else if (signatureType == SignatureType.WalletOrderValidator) {
            // The entire order is verified by a wallet contract.
            isValid = validateOrderWithWallet(
                order,
                orderHash,
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

    /// Reads the `SignatureType` from the end of a signature and validates it.
    function readValidSignatureType(
        bytes32 hash,
        address signerAddress,
        bytes memory signature
    )
        private
        pure
        returns (SignatureType signatureType)
    {
        if (signature.length == 0) {
            rrevert(SignatureError(
                SignatureErrorCodes.INVALID_LENGTH,
                hash,
                signerAddress,
                signature
            ));
        }

        // Read the last byte off of signature byte array.
        uint8 signatureTypeRaw = uint8(signature[signature.length - 1]);

        // Ensure signature is supported
        if (signatureTypeRaw >= uint8(SignatureType.NSignatureTypes)) {
            rrevert(SignatureError(
                SignatureErrorCodes.UNSUPPORTED,
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
            rrevert(SignatureError(
                SignatureErrorCodes.ILLEGAL,
                hash,
                signerAddress,
                signature
            ));
        }

        return SignatureType(signatureTypeRaw);
    }

    /// @dev Verifies signature using logic defined by Wallet contract.
    /// @param hash Any 32 byte hash.
    /// @param walletAddress Address that should have signed the given hash
    ///                      and defines its own signature verification method.
    /// @param signature Proof that the hash has been signed by signer.
    /// @return True if the signature is validated by the Walidator.
    function validateHashWithWallet(
        bytes32 hash,
        address walletAddress,
        bytes memory signature
    )
        private
        view
        returns (bool isValid)
    {
        uint256 signatureLength = signature.length;
        // Shave the signature type off the signature.
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
        // Return data should be a single bool.
        if (didSucceed && returnData.length == 32) {
            return returnData.readUint256(0) == 1;
        }
        // Static call to verifier failed.
        rrevert(SignatureWalletError(
            hash,
            walletAddress,
            signature,
            returnData
        ));
    }

    /// @dev Verifies signature using logic defined by Validator contract.
    ///      If used with an order, the maker of the order can still be an EOA.
    /// @param hash Any 32 byte hash.
    /// @param signerAddress Address that should have signed the given hash.
    /// @param signature Proof that the hash has been signed by signer.
    /// @return True if the signature is validated by the Validator.
    function validateHashWithValidator(
        bytes32 hash,
        address signerAddress,
        bytes memory signature
    )
        private
        view
        returns (bool isValid)
    {
        // If used with an order, the maker of the order can still be an EOA.
        // A signature using this type should be encoded as:
        // | Offset   | Length | Contents                        |
        // | 0x00     | x      | Signature to validate           |
        // | 0x00 + x | 20     | Address of validator contract   |
        // | 0x14 + x | 1      | Signature type is always "\x06" |

        uint256 signatureLength = signature.length;
        // Read the validator address from the signature.
        address validatorAddress = signature.readAddress(signatureLength - 21);
        // Ensure signer has approved validator.
        if (!allowedValidators[signerAddress][validatorAddress]) {
            return false;
        }
        // Shave the validator address and signature type from the signature.
        assembly {
            mstore(signature, sub(signatureLength, 21))
        }
        // Encode the call data.
        bytes memory callData = abi.encodeWithSelector(
            IValidator(validatorAddress).isValidSignature.selector,
            hash,
            signerAddress,
            signature
        );
        // Restore the full signature.
        assembly {
            mstore(signature, signatureLength)
        }
        // Static call the verification function.
        (bool didSucceed, bytes memory returnData) = validatorAddress.staticcall(callData);
        // Return data should be a single bool.
        if (didSucceed && returnData.length == 32) {
            return returnData.readUint256(0) == 1;
        }
        // Static call to verifier failed.
        rrevert(SignatureValidatorError(
            hash,
            signerAddress,
            signature,
            returnData
        ));
    }

    /// @dev Verifies order AND signature via a Wallet contract.
    /// @param order The order.
    /// @param orderHash The order hash.
    /// @param walletAddress Address that should have signed the given hash
    ///                      and defines its own order/signature verification method.
    /// @param signature Proof that the order has been signed by signer.
    /// @return True if order and signature are validated by the Wallet.
    function validateOrderWithWallet(
        Order memory order,
        bytes32 orderHash,
        address walletAddress,
        bytes memory signature
    )
        private
        view
        returns (bool isValid)
    {
        uint256 signatureLength = signature.length;
        // Shave the signature type off the signature.
        assembly {
            mstore(signature, sub(signatureLength, 1))
        }
        // Encode the call data.
        bytes memory callData = abi.encodeWithSelector(
            IWallet(walletAddress).isValidOrderSignature.selector,
            order,
            orderHash,
            signature
        );
        // Restore the full signature.
        assembly {
            mstore(signature, signatureLength)
        }
        // Static call the verification function.
        (bool didSucceed, bytes memory returnData) = walletAddress.staticcall(callData);
        // Return data should be a single bool.
        if (didSucceed && returnData.length == 32) {
            return returnData.readUint256(0) == 1;
        }
        // Static call to verifier failed.
        rrevert(SignatureWalletOrderValidatorError(
            orderHash,
            walletAddress,
            signature,
            returnData
        ));
    }

    /// @dev Verifies order AND signature via Validator contract.
    ///      If used with an order, the maker of the order can still be an EOA.
    /// @param order The order.
    /// @param orderHash The order hash.
    /// @param signerAddress Address that should have signed the given hash.
    /// @param signature Proof that the hash has been signed by signer.
    /// @return True if order and signature are validated by the Validator.
    function validateOrderWithValidator(
        Order memory order,
        bytes32 orderHash,
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
        // | 0x14 + x | 1      | Signature type is always "\x07" |

        uint256 signatureLength = signature.length;
        // Read the validator address from the signature.
        address validatorAddress = signature.readAddress(signatureLength - 21);
        // Ensure signer has approved validator.
        if (!allowedOrderValidators[signerAddress][validatorAddress]) {
            return false;
        }
        // Shave the validator address and signature type from the signature.
        assembly {
            mstore(signature, sub(signatureLength, 21))
        }
        // Encode the call data.
        bytes memory callData = abi.encodeWithSelector(
            IOrderValidator(validatorAddress).isValidOrderSignature.selector,
            order,
            orderHash,
            signature
        );
        // Restore the full signature.
        assembly {
            mstore(signature, signatureLength)
        }
        // Static call the verification function.
        (bool didSucceed, bytes memory returnData) = validatorAddress.staticcall(callData);
        // Return data should be a single bool.
        if (didSucceed && returnData.length == 32) {
            return returnData.readUint256(0) == 1;
        }
        // Static call to verifier failed.
        rrevert(SignatureOrderValidatorError(
            orderHash,
            signerAddress,
            signature,
            returnData
        ));
    }

    /// Validates a hash-compatible signature type
    /// (anything but `OrderValidator` and `WalletOrderValidator`).
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
        // Always invalid signature.
        // Like Illegal, this is always implicitly available and therefore
        // offered explicitly. It can be implicitly created by providing
        // a correctly formatted but incorrect signature.
        if (signatureType == SignatureType.Invalid) {
            if (signature.length != 1) {
                rrevert(SignatureError(
                    SignatureErrorCodes.INVALID_LENGTH,
                    hash,
                    signerAddress,
                    signature
                ));
            }
            isValid = false;
            return isValid;

        // Signature using EIP712
        } else if (signatureType == SignatureType.EIP712) {
            if (signature.length != 66) {
                rrevert(SignatureError(
                    SignatureErrorCodes.INVALID_LENGTH,
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
            return isValid;

        // Signed using web3.eth_sign
        } else if (signatureType == SignatureType.EthSign) {
            if (signature.length != 66) {
                rrevert(SignatureError(
                    SignatureErrorCodes.INVALID_LENGTH,
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
            return isValid;

        // Signature verified by wallet contract.
        // If used with an order, the maker of the order is the wallet contract.
        } else if (signatureType == SignatureType.Wallet) {
            isValid = validateHashWithWallet(
                hash,
                signerAddress,
                signature
            );
            return isValid;

        // Signature verified by validator contract.
        // If used with an order, the maker of the order can still be an EOA.
        } else if (signatureType == SignatureType.Validator) {
            isValid = validateHashWithValidator(
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
