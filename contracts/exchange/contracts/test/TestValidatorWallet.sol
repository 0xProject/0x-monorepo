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
import "@0x/contracts-erc20/contracts/src/interfaces/IERC20Token.sol";
import "@0x/contracts-utils/contracts/src/LibBytes.sol";

// solhint-disable no-unused-vars
contract TestValidatorWallet {
    using LibBytes for bytes;

    string constant public REVERT_REASON = "you shall not pass";

    enum ValidatorAction {
        // Return false (default)
        Reject,
        // Return true
        Accept,
        // Revert
        Revert,
        // Update state
        UpdateState,
        // Validate signature
        ValidateSignature,
        NTypes
    }
    /// @dev Internal state to modify.
    uint256 internal _state = 1;
    /// @dev What action to execute when a hash is validated .
    mapping (bytes32=>ValidatorAction) internal _hashActions;
    /// @dev Allowed signers for `ValidateSignature` actions using `Wallet` signature types.
    mapping (bytes32=>address) internal _hashWalletSigners;

    /// @dev Set the action to take when validating a hash.
    /// @param hash The hash.
    /// @param action action to take.
    /// @param allowedSigner Signer that must be recovered with
    ///                      `ValidateSignature` action type and `Wallet` or
    ///                      `OrderWallet` signature types.
    function setValidateAction(
        bytes32 hash,
        ValidatorAction action,
        address allowedSigner
    )
        external
    {
        if (uint8(action) >= uint8(ValidatorAction.NTypes)) {
            revert('UNSUPPORTED_VALIDATE_ACTION');
        }
        _hashActions[hash] = action;
        _hashWalletSigners[hash] = allowedSigner;
    }

    /// @dev Validates a hash with the `Validator` signature type.
    /// @param hash Message hash that is signed.
    /// @param signerAddress Address that should have signed the given hash.
    /// @param signature Proof of signing.
    /// @return Validity of order signature.
    function isValidSignature(
        bytes32 hash,
        address signerAddress,
        bytes memory signature
    )
        public
        returns (bool isValid)
    {
        ValidatorAction action = _hashActions[hash];
        if (action == ValidatorAction.Reject) {
            isValid = false;
        } else if (action == ValidatorAction.Accept) {
            isValid = true;
        } else if (action == ValidatorAction.Revert) {
            revert(REVERT_REASON);
        } else if (action == ValidatorAction.ValidateSignature) {
            isValid = _isSignedBy(hash, signature, signerAddress);
        } else { // if (action == ValidatorAction.UpdateState) {
            _updateState();
        }
    }

    /// @dev Validates a hash with the `Wallet` signature type.
    /// @param hash Message hash that is signed.
    /// @param signature Proof of signing.
    /// @return Validity of order signature.
    function isValidSignature(
        bytes32 hash,
        bytes memory signature
    )
        public
        returns (bool isValid)
    {
        ValidatorAction action = _hashActions[hash];
        if (action == ValidatorAction.Reject) {
            isValid = false;
        } else if (action == ValidatorAction.Accept) {
            isValid = true;
        } else if (action == ValidatorAction.Revert) {
            revert(REVERT_REASON);
        } else if (action == ValidatorAction.ValidateSignature) {
            isValid = _isSignedBy(hash, signature, _hashWalletSigners[hash]);
        } else { // if (action == ValidatorAction.UpdateState) {
            _updateState();
        }
    }

    /// @dev Validates a hash with the `OrderValidator` and
    ///      `WalletOrderValidator` signature types.
    /// @param order The order.
    /// @param orderHash The order hash.
    /// @param signature Proof of signing.
    /// @return Validity of order signature.
    function isValidOrderSignature(
        LibOrder.Order memory order,
        bytes32 orderHash,
        bytes memory signature
    )
        public
        returns (bool isValid)
    {
        ValidatorAction action = _hashActions[orderHash];
        if (action == ValidatorAction.Reject) {
            isValid = false;
        } else if (action == ValidatorAction.Accept) {
            isValid = true;
        } else if (action == ValidatorAction.Revert) {
            revert(REVERT_REASON);
        } else if (action == ValidatorAction.ValidateSignature) {
            if (order.makerAddress == address(this)) {
                isValid = true;
            } else {
                isValid = _isSignedBy(orderHash, signature, order.makerAddress);
            }
        } else { // if (action == ValidatorAction.UpdateState) {
            _updateState();
        }
    }

    /// @dev Approves an ERC20 token to spend tokens from this address.
    /// @param token Address of ERC20 token.
    /// @param spender Address that will spend tokens.
    /// @param value Amount of tokens spender is approved to spend.
    function approveERC20(
        address token,
        address spender,
        uint256 value
    )
        external
    {
        IERC20Token(token).approve(spender, value);
    }

    /// @dev Increments state variable.
    function _updateState()
        internal
    {
        _state++;
    }

    /// @dev Verifies the signer of a hash is correct.
    function _isSignedBy(
        bytes32 hash,
        bytes memory signature,
        address signerAddress
    )
        internal
        pure
        returns (bool isSignedBy)
    {
        require(signature.length == 65, "LENGTH_65_REQUIRED");
        uint8 v = uint8(signature[0]);
        bytes32 r = signature.readBytes32(1);
        bytes32 s = signature.readBytes32(33);
        // Try a naked signature.
        address recovered = ecrecover(hash, v, r, s);
        if (recovered != signerAddress) {
            // Try an eth_sign signature.
            bytes32 ethSignHash = keccak256(
                abi.encodePacked(
                    "\x19Ethereum Signed Message:\n32",
                    hash
                )
            );
            recovered = ecrecover(ethSignHash, v, r, s);
        }
        isSignedBy = recovered == signerAddress;
    }
}
