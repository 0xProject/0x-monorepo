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
pragma solidity ^0.4.21;
pragma experimental ABIEncoderV2;

import "./mixins/MSignatureValidator.sol";
import "./mixins/MTransactions.sol";

contract MixinTransactions is
    MSignatureValidator,
    MTransactions
{

    // Mapping of transaction hash => executed
    mapping (bytes32 => bool) public transactions;

    // Address of current transaction signer
    address currentSigner;

    /// @dev Executes an exchange method call in the context of signer.
    /// @param salt Arbitrary number to ensure uniqueness of transaction hash.
    /// @param signer Address of transaction signer.
    /// @param data AbiV2 encoded calldata.
    /// @param signature Proof of signer transaction by signer.
    function executeTransaction(
        uint256 salt,
        address signer,
        bytes data,
        bytes signature)
        external
    {
        // Prevent reentrancy
        require(currentSigner == address(0));

        // Calculate transaction hash
        bytes32 transactionHash = keccak256(
            address(this),
            salt,
            data
        );

        // Validate transaction has not been executed
        require(!transactions[transactionHash]);

        // TODO: is SignatureType.Caller necessary if we make this check?
        if (signer != msg.sender) {
            // Validate signature
            require(isValidSignature(transactionHash, signer, signature));

            // Set the current transaction signer
            currentSigner = signer;
        }

        // Execute transaction
        transactions[transactionHash] = true;
        require(address(this).delegatecall(data));

        // Reset current transaction signer
        currentSigner = address(0);
    }

    function getSignerAddress()
        internal
        view
        returns (address)
    {
        address signerAddress = currentSigner == address(0) ? msg.sender : currentSigner;
        return signerAddress;
    }
}
