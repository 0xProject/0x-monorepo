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

import "../../utils/LibBytes/LibBytes.sol";
import "./libs/LibExchangeErrors.sol";
import "./mixins/MSignatureValidator.sol";
import "./mixins/MTransactions.sol";
import "./interfaces/IWallet.sol";
import "./interfaces/IValidator.sol";

contract MixinSignatureValidator is
    LibBytes,
    LibExchangeErrors,
    MSignatureValidator,
    MTransactions
{
    // Personal message headers
    string constant ETH_PERSONAL_MESSAGE = "\x19Ethereum Signed Message:\n32";
    string constant TREZOR_PERSONAL_MESSAGE = "\x19Ethereum Signed Message:\n\x41";

    // Mapping of hash => signer => signed
    mapping (bytes32 => mapping (address => bool)) public preSigned;

    // Mapping of signer => validator => approved
    mapping (address => mapping (address => bool)) public allowedValidators;

    /// @dev Approves a hash on-chain using any valid signature type.
    ///      After presigning a hash, the preSign signature type will become valid for that hash and signer.
    /// @param signer Address that should have signed the given hash.
    /// @param signature Proof that the hash has been signed by signer.
    function preSign(
        bytes32 hash,
        address signer,
        bytes signature
    )
        external
    {
        require(
            isValidSignature(hash, signer, signature),
            INVALID_SIGNATURE
        );
        preSigned[hash][signer] = true;
    }

    /// @dev Approves/unnapproves a Validator contract to verify signatures on signer's behalf.
    /// @param validator Address of Validator contract.
    /// @param approval Approval or disapproval of  Validator contract.
    function setSignatureValidatorApproval(
        address validator,
        bool approval
    )
        external
    {
        address signer = getCurrentContextAddress();
        allowedValidators[signer][validator] = approval;
    }

    /// @dev Verifies that a hash has been signed by the given signer.
    /// @param hash Any 32 byte hash.
    /// @param signer Address that should have signed the given hash.
    /// @param signature Proof that the hash has been signed by signer.
    /// @return True if the address recovered from the provided signature matches the input signer address.
    function isValidSignature(
        bytes32 hash,
        address signer,
        bytes memory signature
    )
        internal
        view
        returns (bool isValid)
    {
        // TODO: Domain separation: make hash depend on role. (Taker sig should not be valid as maker sig, etc.)
        require(
            signature.length > 0,
            LENGTH_GREATER_THAN_0_REQUIRED
        );

        // Pop last byte off of signature byte array.
        SignatureType signatureType = SignatureType(uint8(popByte(signature)));

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
            revert(SIGNATURE_ILLEGAL);

        // Always invalid signature.
        // Like Illegal, this is always implicitly available and therefore
        // offered explicitly. It can be implicitly created by providing
        // a correctly formatted but incorrect signature.
        } else if (signatureType == SignatureType.Invalid) {
            require(
                signature.length == 0,
                LENGTH_0_REQUIRED
            );
            isValid = false;
            return isValid;

        // Signature using EIP712
        } else if (signatureType == SignatureType.EIP712) {
            require(
                signature.length == 65,
                LENGTH_65_REQUIRED
            );
            v = uint8(signature[0]);
            r = readBytes32(signature, 1);
            s = readBytes32(signature, 33);
            recovered = ecrecover(hash, v, r, s);
            isValid = signer == recovered;
            return isValid;

        // Signed using web3.eth_sign
        } else if (signatureType == SignatureType.EthSign) {
            require(
                signature.length == 65,
                LENGTH_65_REQUIRED
            );
            v = uint8(signature[0]);
            r = readBytes32(signature, 1);
            s = readBytes32(signature, 33);
            recovered = ecrecover(
                keccak256(abi.encodePacked(ETH_PERSONAL_MESSAGE, hash)),
                v,
                r,
                s
            );
            isValid = signer == recovered;
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
                signature.length == 0,
                LENGTH_0_REQUIRED
            );
            isValid = signer == msg.sender;
            return isValid;

        // Signature verified by wallet contract.
        // If used with an order, the maker of the order is the wallet contract.
        } else if (signatureType == SignatureType.Wallet) {
            isValid = IWallet(signer).isValidSignature(hash, signature);
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
            address validator = popAddress(signature);
            // Ensure signer has approved validator.
            if (!allowedValidators[signer][validator]) {
                return false;
            }
            isValid = IValidator(validator).isValidSignature(
                hash,
                signer,
                signature
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
                signature.length == 65,
                LENGTH_65_REQUIRED
            );
            v = uint8(signature[0]);
            r = readBytes32(signature, 1);
            s = readBytes32(signature, 33);
            recovered = ecrecover(
                keccak256(abi.encodePacked(TREZOR_PERSONAL_MESSAGE, hash)),
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
        revert(SIGNATURE_UNSUPPORTED);
    }
}
