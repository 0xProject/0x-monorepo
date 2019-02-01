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

pragma solidity ^0.5.2;
pragma experimental "ABIEncoderV2";

import "../src/libs/LibTECApproval.sol";
import "../src/libs/LibZeroExTransaction.sol";


contract TestLibs is
    LibTECApproval,
    LibZeroExTransaction
{
    /// @dev Calculated the EIP712 hash of the TEC approval mesasage using the domain separator of this contract.
    /// @param approval TEC approval message containing the transaction hash, transaction signature, and expiration of the approval.
    /// @return EIP712 hash of the TEC approval message with the domain separator of this contract.
    function publicGetTECApprovalHash(TECApproval memory approval)
        public
        view
        returns (bytes32 approvalHash)
    {
        approvalHash = getTECApprovalHash(approval);
        return approvalHash;
    }

    /// @dev Calculates the EIP712 hash of a 0x transaction using the domain separator of this contract.
    /// @param transaction 0x transaction containing salt, signerAddress, and data.
    /// @return EIP712 hash of the transaction with the domain separator of this contract.
    function publicGetTransactionHash(ZeroExTransaction memory transaction)
        public
        view
        returns (bytes32 transactionHash)
    {
        transactionHash = getTransactionHash(transaction);
        return transactionHash;
    }
}