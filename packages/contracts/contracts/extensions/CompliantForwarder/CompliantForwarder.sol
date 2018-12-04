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

pragma solidity 0.4.24;
pragma experimental ABIEncoderV2;

import "../../protocol/Exchange/interfaces/IExchange.sol";
import "../../tokens/ERC721Token/IERC721Token.sol";
import "../../utils/LibBytes/LibBytes.sol";
import "../../utils/ExchangeSelectors/ExchangeSelectors.sol";

contract CompliantForwarder is ExchangeSelectors{

    using LibBytes for bytes;

    IExchange internal EXCHANGE;
    IERC721Token internal COMPLIANCE_TOKEN;

    event ValidatedAddresses (
        address[] addresses
    );

    constructor(address exchange, address complianceToken)
        public
    {
        EXCHANGE = IExchange(exchange);
        COMPLIANCE_TOKEN = IERC721Token(complianceToken);
    }

    function executeTransaction(
        uint256 salt,
        address signerAddress,
        bytes signedExchangeTransaction,
        bytes signature
    ) 
        external
    {
        // Addresses that are validated below.
        address[] memory validatedAddresses;

        /**
         * Do not add variables after this point.
         * The assembly block may overwrite their values.
         */

        // Validate addresses
        assembly {
            /**
             * Emulates the `calldataload` opcode on the embedded Exchange calldata,
             * which is accessed through `signedExchangeTransaction`.
             * @param offset - Offset into the Exchange calldata.
             * @return value - Corresponding 32 byte value stored at `offset`.
             */
            function exchangeCalldataload(offset) -> value {
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

            /** 
             * Convenience function that skips the 4 byte selector when loading
             * from the embedded Exchange calldata.
             * @param offset - Offset into the Exchange calldata (minus the 4 byte selector)
             * @return value - Corresponding 32 byte value stored at `offset` + 4.
             */
            function loadExchangeData(offset) -> value {
                value := exchangeCalldataload(add(offset, 0x4))
            }

            /** 
             * A running list is maintained of addresses to validate. 
             * This function records an address in this array.
             * @param addressToValidate - Address to record for validation.
             * @note - Variables are scoped but names are not, so we append
             *         underscores to names that share the global namespace.
             */
            function recordAddressToValidate(addressToValidate) {
                // Compute `addressesToValidate` memory offset
                let addressesToValidate_ := mload(0x40)
                let nAddressesToValidate_ := mload(addressesToValidate_)

                // Increment length
                nAddressesToValidate_ := add(mload(addressesToValidate_), 0x01)
                mstore(addressesToValidate_, nAddressesToValidate_)

                // Append address to validate
                let offset := mul(nAddressesToValidate_, 0x20)
                mstore(add(addressesToValidate_, offset), addressToValidate)
            }

            /**
             * Extracts the maker address from an order stored in the Exchange calldata
             * (which is embedded in `signedExchangeTransaction`), and records it in
             * the running list of addresses to validate.
             * @param orderParamIndex - Index of the order in the Exchange function's signature
             */
            function recordMakerAddressFromOrder(orderParamIndex) {
                let orderPtr := loadExchangeData(orderParamIndex)
                let makerAddress := loadExchangeData(orderPtr)
                recordAddressToValidate(makerAddress)
            }

            /**
             * Extracts the maker addresses from an array of orders stored in the Exchange calldata
             * (which is embedded in `signedExchangeTransaction`), and records them in
             * the running list of addresses to validate.
             * @param orderArrayParamIndex - Index of the order array in the Exchange function's signature
             */
            function recordMakerAddressesFromOrderArray(orderArrayParamIndex) {
                let orderArrayPtr := loadExchangeData(0x0)
                let orderArrayLength := loadExchangeData(orderArrayPtr)
                let orderArrayElementPtr := add(orderArrayPtr, 0x20)
                let orderArrayElementEndPtr := add(orderArrayElementPtr, mul(orderArrayLength, 0x20))
                for {let orderPtrOffset := orderArrayElementPtr} lt(orderPtrOffset, orderArrayElementEndPtr) {orderPtrOffset := add(orderPtrOffset, 0x20)} {
                    let orderPtr := loadExchangeData(orderPtrOffset)
                    let makerAddress := loadExchangeData(add(orderPtr, orderArrayElementPtr))
                    recordAddressToValidate(makerAddress)
                }
            }

            /**
             * Records address of signer in the running list of addresses to validate.
             * @note: We cannot access `signerAddress` directly from within the asm function,
             *        so it is loaded from the calldata.
             */
            function recordSignerAddress() {
                // Load the signer address from calldata
                // 0x04 for selector
                // 0x20 to access `signerAddress`, which is the second parameter.
                let signerAddress_ := calldataload(0x24)
                recordAddressToValidate(signerAddress_)
            }

            /**
             * Records addresses to be validated when Exchange transaction is a batch fill variant.
             * This is one of: batchFillOrders, batchFillOrKillOrders, batchFillNoThrow
             * Reference signature<T>: <batchFillVariant>(Order[],uint256[],bytes[])
             */
            function recordAddressesForBatchFillVariant() {
                // Record maker addresses from order array (parameter index 0)
                // The signer is the taker for these orders and must also be validated.
                recordMakerAddressesFromOrderArray(0)
                recordSignerAddress()
            }

            /**
             * Records addresses to be validated when Exchange transaction is a fill order variant.
             * This is one of: fillOrder, fillOrKillOrder, fillOrderNoThrow
             * Reference signature<T>: <fillOrderVariant>(Order,uint256,bytes)
             */
            function recordAddressesForFillOrderVariant() {
                // Record maker address from the order (param index 0)
                // The signer is the taker for this order and must also be validated.
                recordMakerAddressFromOrder(0)
                recordSignerAddress()
            }

            /**
             * Records addresses to be validated when Exchange transaction is a market fill variant.
             * This is one of: marketBuyOrders, marketBuyOrdersNoThrow, marketSellOrders, marketSellOrdersNoThrow
             * Reference signature<T>: <marketFillInvariant>(Order[],uint256,bytes[])
             */
            function recordAddressesForMarketFillVariant() {
                // Record maker addresses from order array (parameter index 0)
                // The signer is the taker for these orders and must also be validated.
                recordMakerAddressesFromOrderArray(0)
                recordSignerAddress()
            }

            /**
             * Records addresses to be validated when Exchange transaction is matchOrders.
             * Reference signature: matchOrders(Order,Order)
             */
            function recordAddressesForMatchOrders() {
                // Record maker address from both orders (param indices 0 & 1).
                // The signer is the taker and must also be validated.
                recordMakerAddressFromOrder(0)
                recordMakerAddressFromOrder(1)
                recordSignerAddress()
            }

            ///// Record Addresses to Validate /////

            // Addresses needing validation depends on which Exchange function is being called.
            // Step 1/2 Read the exchange function selector.
            let exchangeFunctionSelector := and(
                exchangeCalldataload(0x0),
                0xffffffff00000000000000000000000000000000000000000000000000000000
            )

            // Step 2/2 Extract addresses to validate based on this selector.
            //          See ../../utils/ExchangeSelectors/ExchangeSelectors.sol for selectors
            switch exchangeFunctionSelector
            case 0x297bb70b00000000000000000000000000000000000000000000000000000000 { recordAddressesForBatchFillVariant() }    // batchFillOrders
            case 0x50dde19000000000000000000000000000000000000000000000000000000000 { recordAddressesForBatchFillVariant() }    // batchFillOrdersNoThrow
            case 0x4d0ae54600000000000000000000000000000000000000000000000000000000 { recordAddressesForBatchFillVariant() }    // batchFillOrKillOrders
            case 0xb4be83d500000000000000000000000000000000000000000000000000000000 { recordAddressesForFillOrderVariant() }    // fillOrder
            case 0x3e228bae00000000000000000000000000000000000000000000000000000000 { recordAddressesForFillOrderVariant() }    // fillOrderNoThrow
            case 0x64a3bc1500000000000000000000000000000000000000000000000000000000 { recordAddressesForFillOrderVariant() }    // fillOrKillOrder
            case 0xe5fa431b00000000000000000000000000000000000000000000000000000000 { recordAddressesForMarketFillVariant() }   // marketBuyOrders
            case 0xa3e2038000000000000000000000000000000000000000000000000000000000 { recordAddressesForMarketFillVariant() }   // marketBuyOrdersNoThrow
            case 0x7e1d980800000000000000000000000000000000000000000000000000000000 { recordAddressesForMarketFillVariant() }   // marketSellOrders
            case 0xdd1c7d1800000000000000000000000000000000000000000000000000000000 { recordAddressesForMarketFillVariant() }   // marketSellOrdersNoThrow
            case 0x3c28d86100000000000000000000000000000000000000000000000000000000 { recordAddressesForMatchOrders() }         // matchOrders
            case 0xd46b02c300000000000000000000000000000000000000000000000000000000 {}                                          // cancelOrder
            case 0x4ac1478200000000000000000000000000000000000000000000000000000000 {}                                          // batchCancelOrders
            case 0x4f9559b100000000000000000000000000000000000000000000000000000000 {}                                          // cancelOrdersUpTo
            default {
                // @TODO Revert with `Error("INVALID_OR_UNHANDLED_EXCHANGE_SELECTOR")`
                revert(0, 100)
            }

            ///// Validate Recorded Addresses /////

            // Load from memory the addresses to validate
            let addressesToValidate := mload(0x40)
            let addressesToValidateLength := mload(addressesToValidate)
            let addressesToValidateElementPtr := add(addressesToValidate, 0x20)
            let addressesToValidateElementEndPtr := add(addressesToValidateElementPtr, mul(addressesToValidateLength, 0x20))

            // Set free memory pointer to after `addressesToValidate` array.
            // This is to avoid corruption when making calls in the loop below.
            let freeMemPtr := addressesToValidateElementEndPtr
            mstore(0x40, freeMemPtr)

            // Validate addresses
            let complianceTokenAddress := sload(COMPLIANCE_TOKEN_slot)
            for {let addressToValidate := addressesToValidateElementPtr} lt(addressToValidate, addressesToValidateElementEndPtr) {addressToValidate := add(addressToValidate, 0x20)} {
                // Construct calldata for `COMPLIANCE_TOKEN.balanceOf`
                mstore(freeMemPtr, 0x70a0823100000000000000000000000000000000000000000000000000000000)
                mstore(add(4, freeMemPtr), mload(addressToValidate))
               
                // call `COMPLIANCE_TOKEN.balanceOf`
                let success := call(
                    gas,                                    // forward all gas
                    complianceTokenAddress,                 // call address of asset proxy
                    0,                                      // don't send any ETH
                    freeMemPtr,                             // pointer to start of input
                    0x24,                                   // length of input (one padded address) 
                    freeMemPtr,                             // write output to next free memory offset
                    0x20                                    // reserve space for return balance (0x20 bytes)
                )
                if eq(success, 0) {
                    // @TODO Revert with `Error("BALANCE_CHECK_FAILED")`
                    revert(0, 100)
                }

                // Revert if balance not held
                let addressBalance := mload(freeMemPtr)
                if eq(addressBalance, 0) {
                    // Revert with `Error("AT_LEAST_ONE_ADDRESS_HAS_ZERO_BALANCE")`
                    mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                    mstore(0x20, 0x0000002000000000000000000000000000000000000000000000000000000000)
                    mstore(0x40, 0x0000002541545f4c454153545f4f4e455f414444524553535f4841535f5a4552)
                    mstore(0x60, 0x4f5f42414c414e43450000000000000000000000000000000000000000000000)
                    revert(0, 109)
                }
            }

            // Record validated addresses
            validatedAddresses := addressesToValidate
        }

        ///// If we hit this point then all addresses are valid /////
        emit ValidatedAddresses(validatedAddresses);
        
        // All addresses are valid. Execute fillOrder.
        EXCHANGE.executeTransaction(
            salt,
            signerAddress,
            signedExchangeTransaction,
            signature
        );
    }
}