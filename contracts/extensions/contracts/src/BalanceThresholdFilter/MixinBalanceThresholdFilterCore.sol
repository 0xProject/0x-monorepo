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

pragma solidity ^0.4.24;

import "@0x/contracts-exchange-libs/contracts/src/LibExchangeSelectors.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
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
        // Get accounts whose balances must be validated
        address[] memory addressesToValidate = getAddressesToValidate(signerAddress);

        // Validate account balances
        uint256 balanceThreshold = BALANCE_THRESHOLD;
        IThresholdAsset thresholdAsset = THRESHOLD_ASSET;
        for (uint256 i = 0; i < addressesToValidate.length; ++i) {
            uint256 addressBalance = thresholdAsset.balanceOf(addressesToValidate[i]);
            require(
                addressBalance >= balanceThreshold,
                "AT_LEAST_ONE_ADDRESS_DOES_NOT_MEET_BALANCE_THRESHOLD"
            );
        }
        emit ValidatedAddresses(addressesToValidate);
        
        // All addresses are valid. Execute exchange function.
        EXCHANGE.executeTransaction(
            salt,
            signerAddress,
            signedExchangeTransaction,
            signature
        );
    }

    /// @dev Constructs an array of addresses to be validated.
    ///      Addresses depend on which Exchange function is to be called
    ///      (defined by `signedExchangeTransaction` above).
    /// @param signerAddress Address of transaction signer.
    /// @return addressesToValidate Array of addresses to validate.
    function getAddressesToValidate(address signerAddress)
        internal pure
        returns (address[] memory addressesToValidate)
    {
        bytes4 exchangeFunctionSelector = bytes4(exchangeCalldataload(0));
        // solhint-disable expression-indent
        if (
            exchangeFunctionSelector == BATCH_FILL_ORDERS_SELECTOR              ||
            exchangeFunctionSelector == BATCH_FILL_ORDERS_NO_THROW_SELECTOR     ||
            exchangeFunctionSelector == BATCH_FILL_OR_KILL_ORDERS_SELECTOR      ||
            exchangeFunctionSelector == MARKET_BUY_ORDERS_SELECTOR              ||
            exchangeFunctionSelector == MARKET_BUY_ORDERS_NO_THROW_SELECTOR     ||
            exchangeFunctionSelector == MARKET_SELL_ORDERS_SELECTOR             ||
            exchangeFunctionSelector == MARKET_SELL_ORDERS_NO_THROW_SELECTOR
        ) {
            addressesToValidate = loadMakerAddressesFromOrderArray(0);
            addressesToValidate = addressesToValidate.append(signerAddress);
        } else if (
            exchangeFunctionSelector == FILL_ORDER_SELECTOR             ||
            exchangeFunctionSelector == FILL_ORDER_NO_THROW_SELECTOR    ||
            exchangeFunctionSelector == FILL_OR_KILL_ORDER_SELECTOR
        ) {
            address makerAddress = loadMakerAddressFromOrder(0);
            addressesToValidate = addressesToValidate.append(makerAddress);
            addressesToValidate = addressesToValidate.append(signerAddress);
        } else if (exchangeFunctionSelector == MATCH_ORDERS_SELECTOR) {
            address leftMakerAddress = loadMakerAddressFromOrder(0);
            addressesToValidate = addressesToValidate.append(leftMakerAddress);
            address rightMakerAddress = loadMakerAddressFromOrder(1);
            addressesToValidate = addressesToValidate.append(rightMakerAddress);
            addressesToValidate = addressesToValidate.append(signerAddress);
        } else if (
            exchangeFunctionSelector != CANCEL_ORDER_SELECTOR           &&
            exchangeFunctionSelector != BATCH_CANCEL_ORDERS_SELECTOR    &&
            exchangeFunctionSelector != CANCEL_ORDERS_UP_TO_SELECTOR
        ) {
            revert("INVALID_OR_BLOCKED_EXCHANGE_SELECTOR");
        }
        // solhint-enable expression-indent
        return addressesToValidate;
    }
}
