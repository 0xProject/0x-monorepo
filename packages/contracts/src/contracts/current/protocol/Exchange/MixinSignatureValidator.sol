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

pragma solidity ^0.4.24;

import "./mixins/MSignatureValidator.sol";
import "./interfaces/ISigner.sol";
import "./interfaces/IValidator.sol";
import "./libs/LibExchangeErrors.sol";
import "../../utils/LibBytes/LibBytes.sol";

contract MixinSignatureValidator is
    LibBytes,
    LibExchangeErrors,
    MSignatureValidator
{

    // Mapping of hash => signer => signed
    mapping(bytes32 => mapping(address => bool)) preSigned;

    // Mapping of signer => validator => approved
    mapping(address => mapping (address => bool)) allowedValidators;

    /// @dev Approves a hash on-chain using any valid signature type.
    ///      After presigning a hash, the preSign signature type will become valid for that hash and signer.
    /// @param signer Address that should have signed the given hash.
    /// @param signature Proof that the hash has been signed by signer.
    function preSign(
        bytes32 hash,
        address signer,
        bytes signature)
        external
    {
        require(
            isValidSignature(hash, signer, signature),
            SIGNATURE_VALIDATION_FAILED
        );
        preSigned[hash][signer] = true;
    }

    /// @dev Approves a Validator contract to verify signatures on signer's behalf.
    /// @param validator Address of Validator contract.
    /// @param approval Approval or disapproval of  Validator contract.
    function approveSignatureValidator(address validator, bool approval)
        external
    {
        allowedValidators[msg.sender][validator] = approval;
    }

    /// @dev Verifies that a hash has been signed by the given signer.
    /// @param hash Any 32 byte hash.
    /// @param signer Address that should have signed the given hash.
    /// @param signature Proof that the hash has been signed by signer.
    /// @return True if the address recovered from the provided signature matches the input signer address.
    function isValidSignature(
        bytes32 hash,
        address signer,
        bytes memory signature)
        internal
        view
        returns (bool isValid)
    {
        // TODO: Domain separation: make hash depend on role. (Taker sig should not be valid as maker sig, etc.)

        require(
            signature.length >= 1,
            INVALID_SIGNATURE_LENGTH
        );
        SignatureType signatureType = SignatureType(uint8(signature[0]));

        // Variables are not scoped in Solidity.
        uint8 v;
        bytes32 r;
        bytes32 s;
        address recovered;

        // Always illegal signature.
        // This is always an implicit option since a signer can create a
        // signature array with invalid type or length. We may as well make
        // it an explicit option. This aids testing and analysis. It is
        // also the initialization value for the enum type.
        if (signatureType == SignatureType.Illegal) {
            // NOTE: Reason cannot be assigned to a variable because of https://github.com/ethereum/solidity/issues/4051
            revert("Illegal signature type.");

        // Always invalid signature.
        // Like Illegal, this is always implicitly available and therefore
        // offered explicitly. It can be implicitly created by providing
        // a correctly formatted but incorrect signature.
        } else if (signatureType == SignatureType.Invalid) {
            require(
                signature.length == 1,
                INVALID_SIGNATURE_LENGTH
            );
            isValid = false;
            return isValid;

        // Signature using EIP712
        } else if (signatureType == SignatureType.EIP712) {
            require(
                signature.length == 66,
                INVALID_SIGNATURE_LENGTH
            );
            v = uint8(signature[1]);
            r = readBytes32(signature, 2);
            s = readBytes32(signature, 34);
            recovered = ecrecover(hash, v, r, s);
            isValid = signer == recovered;
            return isValid;

        // Signed using web3.eth_sign
        } else if (signatureType == SignatureType.Ecrecover) {
            require(
                signature.length == 66,
                INVALID_SIGNATURE_LENGTH
            );
            v = uint8(signature[1]);
            r = readBytes32(signature, 2);
            s = readBytes32(signature, 34);
            recovered = ecrecover(
                keccak256("\x19Ethereum Signed Message:\n32", hash),
                v,
                r,
                s
            );
            isValid = signer == recovered;
            return isValid;

        // Implicitly signed by signer of Ethereum transaction.
        // This is useful when initiating a call from a contract that might
        // otherwise require multiple signatures.
        // Example: Contract A calls Exchange.fillOrder using `executeTransaction`.
        // This would normally require the user to sign both an Ethereum transaction
        // and a 0x transaction. By using the TxOrigin signature type, the signature
        // for the Ethereum transaction will encompass both signatures.
        } else if (signatureType == SignatureType.TxOrigin) {
            require(
                signature.length == 1,
                INVALID_SIGNATURE_LENGTH
            );
            isValid = signer == tx.origin;
            return isValid;

        // Implicitly signed by caller.
        // The signer has initiated the call. In the case of non-contract
        // accounts it means the transaction itself was signed.
        // Example: let's say for a particular operation three signatures
        // A, B and C are required. To submit the transaction, A and B can
        // give a signature to C, who can then submit the transaction using
        // `Caller` for his own signature. Or A and C can sign and B can
        // submit using `Caller`. Having `Caller` allows this flexibility.
        } else if (signatureType == SignatureType.Caller) {
            require(
                signature.length == 1,
                INVALID_SIGNATURE_LENGTH
            );
            isValid = signer == msg.sender;
            return isValid;

        // Signature verified by signer contract.
        // If used with an order, the maker of the order is the signer contract.
        } else if (signatureType == SignatureType.Signer) {
            // Pass in signature without signature type.
            bytes memory signatureWithoutType = deepCopyBytes(
                signature,
                1,
                signature.length - 1
            );
            isValid = ISigner(signer).isValidSignature(hash, signatureWithoutType);
            return isValid;

        // Signature verified by validator contract.
        // If used with an order, the maker of the order can still be an EOA.
        // A signature using this type should be encoded as:
        // | Offset | Length | Contents                        |
        // | 0x00   | 1      | Signature type is always "\x07" |
        // | 0x01   | 20     | Address of validator contract   |
        // | 0x15   | **     | Signature to validate           |
        } else if (signatureType == SignatureType.Validator) {
            address validator = readAddress(signature, 1);
            if (!allowedValidators[signer][validator]) {
                return false;
            }
            // Pass in signature without type or validator address.
            bytes memory signatureWithoutTypeOrAddress = deepCopyBytes(
                signature,
                21,
                signature.length - 21
            );
            isValid = IValidator(validator).isValidSignature(
                hash,
                signer,
                signatureWithoutTypeOrAddress
            );
            return isValid;

        // Signer signed hash previously using the preSign function.
        } else if (signatureType == SignatureType.PreSigned) {
            isValid = preSigned[hash][signer];
            return isValid;

        // Signature from Trezor hardware wallet.
        // It differs from web3.eth_sign in the encoding of message length
        // (Bitcoin varint encoding vs ascii-decimal, the latter is not
        // self-terminating which leads to ambiguities).
        // See also:
        // https://en.bitcoin.it/wiki/Protocol_documentation#Variable_length_integer
        // https://github.com/trezor/trezor-mcu/blob/master/firmware/ethereum.c#L602
        // https://github.com/trezor/trezor-mcu/blob/master/firmware/crypto.c#L36
        } else if (signatureType == SignatureType.Trezor) {
            require(
                signature.length == 66,
                INVALID_SIGNATURE_LENGTH
            );
            v = uint8(signature[1]);
            r = readBytes32(signature, 2);
            s = readBytes32(signature, 34);
            recovered = ecrecover(
                keccak256("\x19Ethereum Signed Message:\n\x41", hash),
                v,
                r,
                s
            );
            isValid = signer == recovered;
            return isValid;

        // Signer signed hash previously using the preSign function
        } else if (signatureType == SignatureType.PreSigned) {
            isValid = preSigned[hash][signer];
            return isValid;
        }

        // Anything else is illegal (We do not return false because
        // the signature may actually be valid, just not in a format
        // that we currently support. In this case returning false
        // may lead the caller to incorrectly believe that the
        // signature was invalid.)
        // NOTE: Reason cannot be assigned to a variable because of https://github.com/ethereum/solidity/issues/4051
        revert("Unsupported signature type.");
    }
}
