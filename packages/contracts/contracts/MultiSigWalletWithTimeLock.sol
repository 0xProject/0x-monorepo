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

import "./base/MultiSigWallet.sol";

/// @title Multisignature wallet with time lock- Allows multiple parties to execute a transaction after a time lock has passed.
/// @author Amir Bandeali - <amir@0xProject.com>
contract MultiSigWalletWithTimeLock is MultiSigWallet {

    event ConfirmationTimeSet(uint indexed transactionId, uint confirmationTime);
    event TimeLockChange(uint secondsTimeLocked);

    uint public secondsTimeLocked;

    mapping (uint => uint) public confirmationTimes;

    modifier notFullyConfirmed(uint transactionId) {
        require(!isConfirmed(transactionId));
        _;
    }

    modifier fullyConfirmed(uint transactionId) {
        require(isConfirmed(transactionId));
        _;
    }

    modifier pastTimeLock(uint transactionId) {
        require(block.timestamp >= confirmationTimes[transactionId] + secondsTimeLocked);
        _;
    }

    /*
     * Public functions
     */

    /// @dev Contract constructor sets initial owners, required number of confirmations, and time lock.
    /// @param _owners List of initial owners.
    /// @param _required Number of required confirmations.
    /// @param _secondsTimeLocked Duration needed after a transaction is confirmed and before it becomes executable, in seconds.
    function MultiSigWalletWithTimeLock(address[] _owners, uint _required, uint _secondsTimeLocked)
        public
        MultiSigWallet(_owners, _required)
    {
        secondsTimeLocked = _secondsTimeLocked;
    }

    /// @dev Changes the duration of the time lock for transactions.
    /// @param _secondsTimeLocked Duration needed after a transaction is confirmed and before it becomes executable, in seconds.
    function changeTimeLock(uint _secondsTimeLocked)
        public
        onlyWallet
    {
        secondsTimeLocked = _secondsTimeLocked;
        TimeLockChange(_secondsTimeLocked);
    }

    /// @dev Allows an owner to confirm a transaction.
    /// @param transactionId Transaction ID.
    function confirmTransaction(uint transactionId)
        public
        ownerExists(msg.sender)
        transactionExists(transactionId)
        notConfirmed(transactionId, msg.sender)
        notFullyConfirmed(transactionId)
    {
        confirmations[transactionId][msg.sender] = true;
        Confirmation(msg.sender, transactionId);
        if (isConfirmed(transactionId)) {
            setConfirmationTime(transactionId, block.timestamp);
        }
    }

    /// @dev Allows an owner to revoke a confirmation for a transaction.
    /// @param transactionId Transaction ID.
    function revokeConfirmation(uint transactionId)
        public
        ownerExists(msg.sender)
        confirmed(transactionId, msg.sender)
        notExecuted(transactionId)
        notFullyConfirmed(transactionId)
    {
        confirmations[transactionId][msg.sender] = false;
        Revocation(msg.sender, transactionId);
    }

    /// @dev Allows anyone to execute a confirmed transaction.
    /// @param transactionId Transaction ID.
    function executeTransaction(uint transactionId)
        public
        notExecuted(transactionId)
        fullyConfirmed(transactionId)
        pastTimeLock(transactionId)
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

    /*
     * Internal functions
     */

    /// @dev Sets the time of when a submission first passed.
    function setConfirmationTime(uint transactionId, uint confirmationTime)
        internal
    {
        confirmationTimes[transactionId] = confirmationTime;
        ConfirmationTimeSet(transactionId, confirmationTime);
    }
}
