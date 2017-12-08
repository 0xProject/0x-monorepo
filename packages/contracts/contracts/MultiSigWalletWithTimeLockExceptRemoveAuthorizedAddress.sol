/*

  Copyright 2017 ZeroEx Intl.

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

pragma solidity 0.4.11;

import "./MultiSigWalletWithTimeLock.sol";

contract MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress is MultiSigWalletWithTimeLock {

    address public TOKEN_TRANSFER_PROXY_CONTRACT;

    modifier validRemoveAuthorizedAddressTx(uint transactionId) {
        Transaction storage tx = transactions[transactionId];
        require(tx.destination == TOKEN_TRANSFER_PROXY_CONTRACT);
        require(isFunctionRemoveAuthorizedAddress(tx.data));
        _;
    }

    /// @dev Contract constructor sets initial owners, required number of confirmations, time lock, and tokenTransferProxy address.
    /// @param _owners List of initial owners.
    /// @param _required Number of required confirmations.
    /// @param _secondsTimeLocked Duration needed after a transaction is confirmed and before it becomes executable, in seconds.
    /// @param _tokenTransferProxy Address of TokenTransferProxy contract.
    function MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress(
        address[] _owners,
        uint _required,
        uint _secondsTimeLocked,
        address _tokenTransferProxy)
        public
        MultiSigWalletWithTimeLock(_owners, _required, _secondsTimeLocked)
    {
        TOKEN_TRANSFER_PROXY_CONTRACT = _tokenTransferProxy;
    }

    /// @dev Allows execution of removeAuthorizedAddress without time lock.
    /// @param transactionId Transaction ID.
    function executeRemoveAuthorizedAddress(uint transactionId)
        public
        notExecuted(transactionId)
        fullyConfirmed(transactionId)
        validRemoveAuthorizedAddressTx(transactionId)
    {
        Transaction storage tx = transactions[transactionId];
        tx.executed = true;
        if (tx.destination.call.value(tx.value)(tx.data))
            Execution(transactionId);
        else {
            ExecutionFailure(transactionId);
            tx.executed = false;
        }
    }

    /// @dev Compares first 4 bytes of byte array to removeAuthorizedAddress function signature.
    /// @param data Transaction data.
    /// @return Successful if data is a call to removeAuthorizedAddress.
    function isFunctionRemoveAuthorizedAddress(bytes data)
        public
        constant
        returns (bool)
    {
        bytes4 removeAuthorizedAddressSignature = bytes4(sha3("removeAuthorizedAddress(address)"));
        for (uint i = 0; i < 4; i++) {
            require(data[i] == removeAuthorizedAddressSignature[i]);
        }
        return true;
    }
}
