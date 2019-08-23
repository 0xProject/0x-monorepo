/*

  Copyright 2019 ZeroEx Intl.

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

import "../src/interfaces/IExchange.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibZeroExTransaction.sol";
import "@0x/contracts-utils/contracts/src/LibEIP1271.sol";
import "@0x/contracts-utils/contracts/src/Ownable.sol";
import "@0x/contracts-utils/contracts/src/Refundable.sol";


contract Whitelist is
    Ownable,
    Refundable,
    LibEIP1271
{
    // Mapping of address => whitelist status.
    mapping (address => bool) public isWhitelisted;

    // Exchange contract.
    // solhint-disable var-name-mixedcase
    IExchange internal EXCHANGE;
    bytes internal TX_ORIGIN_SIGNATURE;
    // solhint-enable var-name-mixedcase

    byte constant internal VALIDATOR_SIGNATURE_BYTE = "\x05";

    constructor (address _exchange)
        public
    {
        EXCHANGE = IExchange(_exchange);
        TX_ORIGIN_SIGNATURE = abi.encodePacked(address(this), VALIDATOR_SIGNATURE_BYTE);
    }

    /// @dev Adds or removes an address from the whitelist.
    /// @param target Address to add or remove from whitelist.
    /// @param isApproved Whitelist status to assign to address.
    function updateWhitelistStatus(
        address target,
        bool isApproved
    )
        external
        onlyOwner
    {
        isWhitelisted[target] = isApproved;
    }

    /// @dev Verifies a ZeroExTransaction's signer is same as signer of current Ethereum transaction.
    ///      NOTE: This function can currently be used to validate signatures coming from outside of this contract.
    ///      Extra safety checks can be added for a production contract.
    /// @param data The abi-encoded ZeroExTransaction.
    /// @param signature Proof of signing.
    /// @return magicValue `EIP1271_MAGIC_VALUE` if the signature is authorized.
    // solhint-disable no-unused-vars
    function isValidSignature(
        bytes calldata data,
        bytes calldata signature
    )
        external
        view
        returns (bytes4 magicValue)
    {
        // Decode the ZeroExTransaction.
        LibZeroExTransaction.ZeroExTransaction memory transaction =
            abi.decode(data, (LibZeroExTransaction.ZeroExTransaction));
        // solhint-disable-next-line avoid-tx-origin
        if (transaction.signerAddress == tx.origin) {
            magicValue = EIP1271_MAGIC_VALUE;
        }
    }
    // solhint-enable no-unused-vars

    /// @dev Fills an order using `msg.sender` as the taker.
    ///      The transaction will revert if both the maker and taker are not whitelisted.
    ///      Orders should specify this contract as the `senderAddress` in order to gaurantee
    ///      that both maker and taker have been whitelisted.
    /// @param order Order struct containing order specifications.
    /// @param takerAssetFillAmount Desired amount of takerAsset to sell.
    /// @param salt Arbitrary value to gaurantee uniqueness of 0x transaction hash.
    /// @param orderSignature Proof that order has been created by maker.
    function fillOrderIfWhitelisted(
        LibOrder.Order memory order,
        uint256 takerAssetFillAmount,
        uint256 salt,
        bytes memory orderSignature
    )
        public
        payable
        refund
    {
        address takerAddress = msg.sender;

        // This contract must be the entry point for the transaction.
        require(
            // solhint-disable-next-line avoid-tx-origin
            takerAddress == tx.origin,
            "INVALID_SENDER"
        );

        // Check if maker is on the whitelist.
        require(
            isWhitelisted[order.makerAddress],
            "MAKER_NOT_WHITELISTED"
        );

        // Check if taker is on the whitelist.
        require(
            isWhitelisted[takerAddress],
            "TAKER_NOT_WHITELISTED"
        );

        // Encode arguments into byte array.
        bytes memory data = abi.encodeWithSelector(
            EXCHANGE.fillOrder.selector,
            order,
            takerAssetFillAmount,
            orderSignature
        );

        LibZeroExTransaction.ZeroExTransaction memory transaction = LibZeroExTransaction.ZeroExTransaction({
            salt: salt,
            data: data,
            expirationTimeSeconds: uint256(-1),
            signerAddress: takerAddress
        });

        // Call `fillOrder` via `executeTransaction`.
        EXCHANGE.executeTransaction.value(msg.value)(transaction, TX_ORIGIN_SIGNATURE);
    }
}
