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
import "@0x/contracts-utils/contracts/src/LibEIP1271.sol";


interface ISimplifiedExchange {
    function getOrderHash(LibOrder.Order calldata order)
        external
        view
        returns (bytes32 orderHash);
}


// solhint-disable no-unused-vars
contract TestValidatorWallet is
    LibEIP1271
{
    using LibBytes for bytes;

    // Revert reason for `Revert` `ValidatorAction`.
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

    /// @dev The Exchange contract.
    ISimplifiedExchange internal _exchange;
    /// @dev Internal state to modify.
    uint256 internal _state = 1;
    /// @dev What action to execute when a hash is validated .
    mapping (bytes32 => ValidatorAction) internal _hashActions;
    /// @dev Allowed signers for hash signature types.
    mapping (bytes32 => address) internal _validSignerForHash;

    constructor(address exchange) public {
        _exchange = ISimplifiedExchange(exchange);
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
            revert("UNSUPPORTED_VALIDATE_ACTION");
        }
        _hashActions[hash] = action;
        _validSignerForHash[hash] = allowedSigner;
    }

    /// @dev Validates a hash with the following signature types:
    ///      `EIP1271Wallet` and `EIP1271WalletOrder`signature types.
    ///      The length of `data` will determine which signature type is in use.
    /// @param data Arbitrary data. Either an Order hash or abi-encoded Order.
    /// @param signature Signature for `data`.
    /// @return magicValue Returns `EIP1271_MAGIC_VALUE` if the signature check succeeds.
    function isValidSignature(
        bytes memory data,
        bytes memory signature
    )
        public
        returns (bytes4 magicValue)
    {
        bytes32 hash = _getOrderHashFromEIP1271Data(data);
        ValidatorAction action = _hashActions[hash];
        // solhint-disable-next-line no-empty-blocks
        if (action == ValidatorAction.Reject) {
            // NOOP.
        } else if (action == ValidatorAction.Accept) {
            magicValue = EIP1271_MAGIC_VALUE;
        } else if (action == ValidatorAction.Revert) {
            revert(REVERT_REASON);
        } else if (action == ValidatorAction.UpdateState) {
            _updateState();
        } else { // action == ValidatorAction.ValidateSignature
            if (data.length != 32) {
                // `data` is an abi-encoded Order.
                LibOrder.Order memory order = _getOrderFromEIP1271Data(data);
                if (order.makerAddress == address(this)) {
                    magicValue = EIP1271_MAGIC_VALUE;
                }
            } else if (_validSignerForHash[hash] == address(this)) {
                magicValue = EIP1271_MAGIC_VALUE;
            }
        }
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
        } else { // action == ValidatorAction.UpdateState
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
            isValid = _validSignerForHash[hash] == address(this);
        } else { // action == ValidatorAction.UpdateState
            _updateState();
        }
    }

    /// @dev Validates a hash with the `OrderValidator` and `OrderWallet`
    ///      signature types.
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
            if (signature.length == 0) {
                // OrderWallet type.
                isValid = order.makerAddress == address(this);
            } else {
                // OrderValidator type.
                isValid = _isSignedBy(orderHash, signature, order.makerAddress);
            }
        } else { // action == ValidatorAction.UpdateState
            _updateState();
        }
    }

    /// @dev Increments state variable.
    function _updateState()
        private
    {
        _state++;
    }

    /// @dev Verifies the signer of a hash is correct.
    function _isSignedBy(
        bytes32 hash,
        bytes memory signature,
        address signerAddress
    )
        private
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

    function _getOrderHashFromEIP1271Data(bytes memory data)
        private
        returns (bytes32 hash)
    {
        if (data.length == 32) {
            // `data` is an order hash.
            hash = data.readBytes32(0);
        } else {
            // `data` is an abi-encoded Order.
            LibOrder.Order memory order = _getOrderFromEIP1271Data(data);
            // Use the Exchange contract to convert it into a hash.
            hash = _exchange.getOrderHash(order);
        }
    }

    function _getOrderFromEIP1271Data(bytes memory data)
        private
        returns (LibOrder.Order memory order)
    {
        require(data.length > 32, "INVALID_EIP1271_ORDER_DATA_LENGTH");
        return abi.decode(data, (LibOrder.Order));
    }

}
