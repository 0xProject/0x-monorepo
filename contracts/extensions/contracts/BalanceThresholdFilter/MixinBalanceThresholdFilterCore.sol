/*

  Copyright 2018 ZeroEx Intl.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/

pragma solidity 0.4.24;

import "@0x/contracts-libs/contracts/libs/LibExchangeSelectors.sol";
import "@0x/contracts-libs/contracts/libs/LibOrder.sol";
import "./mixins/MBalanceThresholdFilterCore.sol";
import "./MixinExchangeCalldata.sol";


contract MixinBalanceThresholdFilterCore is
    MBalanceThresholdFilterCore,
    MixinExchangeCalldata,
    LibOrder,
    LibExchangeSelectors
{

    /// @dev Executes an Exchange transaction iff the maker and taker meet 
    ///      the hold at least `BALANCE_THRESHOLD` of the asset `THRESHOLD_ASSET` OR 
    ///      the exchange function is a cancellation.
    ///      Supported Exchange functions:
    ///          batchFillOrders
    ///          batchFillOrdersNoThrow
    ///          batchFillOrKillOrders
    ///          fillOrder
    ///          fillOrderNoThrow
    ///          fillOrKillOrder
    ///          marketBuyOrders
    ///          marketBuyOrdersNoThrow
    ///          marketSellOrders
    ///          marketSellOrdersNoThrow
    ///          matchOrders
    ///          cancelOrder
    ///          batchCancelOrders
    ///          cancelOrdersUpTo
    ///     Trying to call any other exchange function will throw.
    /// @param salt Arbitrary number to ensure uniqueness of transaction hash.
    /// @param signerAddress Address of transaction signer.
    /// @param signedExchangeTransaction AbiV2 encoded calldata.
    /// @param signature Proof of signer transaction by signer.
    function executeTransaction(
        uint256 salt,
        address signerAddress,
        bytes signedExchangeTransaction,
        bytes signature
    ) 
        external
    {
        // Validate addresses.
        validateBalanceThresholdsOrRevert(signerAddress);
        
        // All addresses are valid. Execute fillOrder.
        EXCHANGE.executeTransaction(
            salt,
            signerAddress,
            signedExchangeTransaction,
            signature
        );
    }

    

    /// @dev Validates addresses meet the balance threshold specified by `BALANCE_THRESHOLD`
    ///      for the asset `THRESHOLD_ASSET`. If one address does not meet the thresold
    ///      then this function will revert. Which addresses are validated depends on
    ///      which Exchange function is to be called (defined by `signedExchangeTransaction` above).
    ///      No parameters are taken as this function reads arguments directly from calldata, to save gas.
    ///      If all addresses are valid then this function emits a ValidatedAddresses event, listing all
    ///      of the addresses whose balance thresholds it checked.
    function validateBalanceThresholdsOrRevert(address signerAddress)
        internal
    {
        // Extract addresses to validate from Exchange calldata
        address[] memory addressesToValidate = new address[](0);
        bytes4 exchangeFunctionSelector = bytes4(exchangeCalldataload(0));
        if(
            exchangeFunctionSelector == batchFillOrdersSelector         || 
            exchangeFunctionSelector == batchFillOrdersNoThrowSelector  || 
            exchangeFunctionSelector == batchFillOrKillOrdersSelector   ||
            exchangeFunctionSelector == marketBuyOrdersSelector         ||
            exchangeFunctionSelector == marketBuyOrdersNoThrowSelector  ||
            exchangeFunctionSelector == marketSellOrdersSelector        ||
            exchangeFunctionSelector == marketSellOrdersNoThrowSelector
        ) {
            addressesToValidate = loadMakerAddressesFromOrderArray(0);
            recordAddressToValidate(signerAddress, addressesToValidate);
        } else if(
            exchangeFunctionSelector == fillOrderSelector           ||
            exchangeFunctionSelector == fillOrderNoThrowSelector    ||
            exchangeFunctionSelector == fillOrKillOrderSelector
        ) {
            address makerAddress = loadMakerAddressFromOrder(0);
            recordAddressToValidate(makerAddress, addressesToValidate);
            recordAddressToValidate(signerAddress, addressesToValidate);
        } else if(exchangeFunctionSelector == matchOrdersSelector) {
            address leftOrderAddress = loadMakerAddressFromOrder(0);
            recordAddressToValidate(leftOrderAddress, addressesToValidate);
            address rightOrderAddress = loadMakerAddressFromOrder(1);
            recordAddressToValidate(rightOrderAddress, addressesToValidate);
            recordAddressToValidate(signerAddress, addressesToValidate);
        } else if(
            exchangeFunctionSelector != cancelOrderSelector         && 
            exchangeFunctionSelector != batchCancelOrdersSelector   &&
            exchangeFunctionSelector != cancelOrdersUpToSelector
        ) {
            revert("INVALID_OR_BLOCKED_EXCHANGE_SELECTOR");
        }

        // Validate account balances
        uint256 balanceThreshold = BALANCE_THRESHOLD;
        IThresholdAsset thresholdAsset = THRESHOLD_ASSET;
        for(uint i = 0; i < addressesToValidate.length; ++i) {
            uint256 addressBalance = thresholdAsset.balanceOf(addressesToValidate[i]);
            if (addressBalance < balanceThreshold) {
                revert("AT_LEAST_ONE_ADDRESS_DOES_NOT_MEET_BALANCE_THRESHOLD");
            }
        }
        emit ValidatedAddresses(addressesToValidate);
    }
}
