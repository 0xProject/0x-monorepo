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

pragma solidity ^0.4.10;

import "../../multisig/MultiSigWalletWithTimeLock.sol";
import "../../utils/LibBytes/LibBytes.sol";

contract AssetProxyOwner is
    LibBytes,
    MultiSigWalletWithTimeLock
{

    event AssetProxyRegistration(address assetProxyContract, bool isRegistered);

    // Mapping of AssetProxy contract address =>
    // if this contract is allowed to call the AssetProxy's removeAuthorizedAddress method without a time lock.
    mapping (address => bool) public isAssetProxyRegistered;

    bytes4 constant REMOVE_AUTHORIZED_ADDRESS_SELECTOR = bytes4(keccak256("removeAuthorizedAddress(address)"));

    /// @dev Function will revert if the transaction does not call `removeAuthorizedAddress`
    ///      on an approved AssetProxy contract.
    modifier validRemoveAuthorizedAddressTx(uint256 transactionId) {
        Transaction storage tx = transactions[transactionId];
        require(isAssetProxyRegistered[tx.destination]);
        require(isFunctionRemoveAuthorizedAddress(tx.data));
        _;
    }

    /// @dev Contract constructor sets initial owners, required number of confirmations,
    ///      time lock, and list of AssetProxy addresses.
    /// @param _owners List of initial owners.
    /// @param _assetProxyContracts Array of AssetProxy contract addresses.
    /// @param _required Number of required confirmations.
    /// @param _secondsTimeLocked Duration needed after a transaction is confirmed and before it becomes executable, in seconds.
    function AssetProxyOwner(
        address[] memory _owners,
        address[] memory _assetProxyContracts,
        uint256 _required,
        uint256 _secondsTimeLocked
    )
        public
        MultiSigWalletWithTimeLock(_owners, _required, _secondsTimeLocked)
    {
        for (uint256 i = 0; i < _assetProxyContracts.length; i++) {
            address assetProxy = _assetProxyContracts[i];
            require(assetProxy != address(0));
            isAssetProxyRegistered[assetProxy] = true;
        }
    }

    /// @dev Registers or deregisters an AssetProxy to be able to execute
    ///      removeAuthorizedAddress without a timelock.
    /// @param assetProxyContract Address of AssetProxy contract.
    /// @param isRegistered Status of approval for AssetProxy contract.
    function registerAssetProxy(address assetProxyContract, bool isRegistered)
        public
        onlyWallet
        notNull(assetProxyContract)
    {
        isAssetProxyRegistered[assetProxyContract] = isRegistered;
        AssetProxyRegistration(assetProxyContract, isRegistered);
    }

    /// @dev Allows execution of removeAuthorizedAddress without time lock.
    /// @param transactionId Transaction ID.
    function executeRemoveAuthorizedAddress(uint256 transactionId)
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

    /// @dev Compares first 4 bytes of byte array to removeAuthorizedAddress function selector.
    /// @param data Transaction data.
    /// @return Successful if data is a call to removeAuthorizedAddress.
    function isFunctionRemoveAuthorizedAddress(bytes memory data)
        public
        pure
        returns (bool)
    {
        bytes4 first4Bytes = readFirst4(data);
        require(REMOVE_AUTHORIZED_ADDRESS_SELECTOR == first4Bytes);
        return true;
    }
}
