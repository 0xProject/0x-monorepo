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

import "./mixins/MBalanceThresholdFilterCore.sol";
import "@0x/contracts-utils/contracts/utils/ExchangeSelectors/ExchangeSelectors.sol";
import "@0x/contracts-libs/contracts/libs/LibOrder.sol";


contract MixinBalanceThresholdFilterCore is
    MBalanceThresholdFilterCore,
    LibOrder,
    ExchangeSelectors
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

    /// @dev Emulates the `calldataload` opcode on the embedded Exchange calldata,
    ///      which is accessed through `signedExchangeTransaction`.
    /// @param offset  Offset into the Exchange calldata.
    /// @return value  Corresponding 32 byte value stored at `offset`.
    function exchangeCalldataload(uint256 offset)
        internal
        returns (bytes32 value)
    {
        assembly {
            // Pointer to exchange transaction
            // 0x04 for calldata selector
            // 0x40 to access `signedExchangeTransaction`, which is the third parameter
            let exchangeTxPtr := calldataload(0x44)

            // Offset into Exchange calldata
            // We compute this by adding 0x24 to the `exchangeTxPtr` computed above.
            // 0x04 for calldata selector
            // 0x20 for length field of `signedExchangeTransaction`
            let exchangeCalldataOffset := add(exchangeTxPtr, add(0x24, offset))
            value := calldataload(exchangeCalldataOffset)
        }
    }

    /// @dev Convenience function that skips the 4 byte selector when loading
    ///      from the embedded Exchange calldata.
    /// @param offset  Offset into the Exchange calldata (minus the 4 byte selector)
    /// @return value  Corresponding 32 byte value stored at `offset` + 4.
    function loadExchangeData(uint256 offset)
        internal
        returns (bytes32 value)
    {
        value = exchangeCalldataload(offset + 4);
    }

    /// @dev A running list is maintained of addresses to validate. 
    ///     This function records an address in this array.
    /// @param addressToValidate  Address to record for validation.
    function recordAddressToValidate(address addressToValidate, address[] memory addressList) 
        internal
    {
        uint256 newAddressListLength = addressList.length + 1;
        assembly {
            // Store new array length
            mstore(addressList, newAddressListLength)
            mstore(0x40, add(addressList, add(0x20, mul(0x20, newAddressListLength))))
        }
        addressList[newAddressListLength - 1] = addressToValidate;
    }

    /// @dev Extracts the maker address from an order stored in the Exchange calldata
    ///      (which is embedded in `signedExchangeTransaction`), and records it in
    ///      the running list of addresses to validate.
    /// @param orderParamIndex  Index of the order in the Exchange function's signature
    function loadMakerAddressFromOrder(uint8 orderParamIndex) internal returns (address makerAddress) {
        uint256 orderPtr = uint256(loadExchangeData(orderParamIndex * 0x20));
        makerAddress = address(loadExchangeData(orderPtr));
    }

    /// @dev Extracts the maker addresses from an array of orders stored in the Exchange calldata
    ///      (which is embedded in `signedExchangeTransaction`), and records them in
    ///      the running list of addresses to validate.
    /// @param orderArrayParamIndex  Index of the order array in the Exchange function's signature
    function loadMakerAddressesFromOrderArray(uint8 orderArrayParamIndex)
        internal
        returns (address[] makerAddresses)
    {
        uint256 orderArrayPtr = uint256(loadExchangeData(orderArrayParamIndex * 0x20));
        uint256 orderArrayLength = uint256(loadExchangeData(orderArrayPtr));
        uint256 orderArrayElementPtr = orderArrayPtr + 0x20;
        uint256 orderArrayElementEndPtr = orderArrayElementPtr + (orderArrayLength * 0x20);
        for(uint orderPtrOffset = orderArrayElementPtr; orderPtrOffset < orderArrayElementEndPtr; orderPtrOffset += 0x20) {
            uint256 orderPtr = uint256(loadExchangeData(orderPtrOffset));
            address makerAddress = address(loadExchangeData(orderPtr + orderArrayElementPtr));
            recordAddressToValidate(makerAddress, makerAddresses);
        }
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
            exchangeFunctionSelector == cancelOrderSelector         || 
            exchangeFunctionSelector == batchCancelOrdersSelector   ||
            exchangeFunctionSelector == cancelOrdersUpToSelector
        ) {
            // Do nothing
        } else {
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
