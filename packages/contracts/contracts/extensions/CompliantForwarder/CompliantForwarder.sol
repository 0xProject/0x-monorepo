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
        bytes32 selector,
        bytes32 one,
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
        // Validate `signedFillOrderTransaction`
        address[] memory validatedAddresses;
        bytes32 selectorS;
        bytes32 one;
        assembly {
            // Adds address to validate
            function addAddressToValidate(addressToValidate) {
                // Compute `addressesToValidate` memory location
                let addressesToValidate_ := mload(0x40)
                let nAddressesToValidate_ := mload(addressesToValidate_)

                // Increment length
                nAddressesToValidate_ := add(mload(addressesToValidate_), 1)
                mstore(addressesToValidate_, nAddressesToValidate_)

                // Append address to validate
                let offset := mul(32, nAddressesToValidate_)
                mstore(add(addressesToValidate_, offset), addressToValidate)
            }

            function toGlobalCalldataOffset(offset) -> globalOffset {
                globalOffset := add(0x4, offset)
            }

            function toExchangeCalldataOffset(offset, orderParamIndex) -> exchangeOffset {
                // exchangeTxPtr at global level
                // 0x20 for length offset into exchange TX
                // 0x4 for function selector in exhcange TX
                let exchangeTxPtr := calldataload(0x44)
                exchangeOffset := add(0x4, add(exchangeTxPtr, add(0x24, offset)))
            }

            function toOrderOffset(offset, orderParamIndex) -> orderOffset {
                let exchangeOffset := calldataload(
                    toExchangeCalldataOffset(
                        offset,
                        orderParamIndex
                    )
                )
                orderOffset := toExchangeCalldataOffset(exchangeOffset, orderParamIndex)
            }

           // function readMakerFieldFromOrder()

            /*
            function readFieldFromOrder()

            function readMakerFieldFromOrder()*/

            function appendMakerAddressFromOrder(orderParamIndex) {
                let makerAddress := calldataload(toOrderOffset(0 /* makerAddress is at 0'th field */, 0 /*order is 1st param*/))
                addAddressToValidate(makerAddress)
            }

            function appendMakerAddressesFromOrderSet(orderSetParamIndex) -> one {
                let orderSetPtr := calldataload(toExchangeCalldataOffset(0, 0))
                let orderSetPtrCalldata := toExchangeCalldataOffset(add(orderSetPtr, 0x20), 0)
                let orderSetLength := calldataload(toExchangeCalldataOffset(orderSetPtr, 0))
                for {let orderPtrOffset := add(0x20, orderSetPtr)} lt(orderPtrOffset, add(0x20, add(orderSetPtr, mul(0x20, orderSetLength)))) {orderPtrOffset := add(0x20, orderPtrOffset)} {
                    let orderPtr := calldataload(toExchangeCalldataOffset(orderPtrOffset, 0))
                    let makerAddress := calldataload(add(orderSetPtrCalldata, orderPtr))
                    addAddressToValidate(makerAddress)
                }
            }

            function exchangeCalldataload(offset) -> value {
                value := calldataload(toExchangeCalldataOffset(offset, 0))
            }


            function appendMakerAddressesFromOrderSet2(orderSetParamIndex) -> one {
                let orderSetPtr := exchangeCalldataload(0)
                let orderSetLength := exchangeCalldataload(orderSetPtr)
                
                for {let orderPtrOffset := add(0x20, orderSetPtr)} lt(orderPtrOffset, add(0x20, add(orderSetPtr, mul(0x20, orderSetLength)))) {orderPtrOffset := add(0x20, orderPtrOffset)} {
                    let orderPtr := exchangeCalldataload(orderPtrOffset)
                    let makerAddress := exchangeCalldataload(add(orderSetPtr, add(0x20, orderPtr)))
                    addAddressToValidate(makerAddress)
                }
            }

/*
            function appendMakerAddressFromOrderSet(paramIndex) {
                let exchangeTxPtr := calldataload(0x44)
                // Add 0x20 for length offset and 0x04 for selector offset
                let orderPtrRelativeToExchangeTx := calldataload(add(0x4, add(exchangeTxPtr, 0x24))) // 0x60
                let orderPtr := add(0x4,add(exchangeTxPtr, add(0x24, orderPtrRelativeToExchangeTx)))
                let makerAddress := calldataload(orderPtr)
                addAddressToValidate(makerAddress)
            }
*/




            // Extract addresses to validate
            let exchangeTxPtr1 := calldataload(0x44)
            let selector := and(calldataload(add(0x4, add(0x20, exchangeTxPtr1))), 0xffffffff00000000000000000000000000000000000000000000000000000000)
            switch selector
            case 0x297bb70b00000000000000000000000000000000000000000000000000000000 /* batchFillOrders */
            {
                one := appendMakerAddressesFromOrderSet2(0)
            }
            case 0x3c28d86100000000000000000000000000000000000000000000000000000000 /* matchOrders */
            {
               // appendMakerAddressFromOrder(0)
               //// appendMakerAddressFromOrder(1)
               // addAddressToValidate(signerAddress)
            }
            case 0xb4be83d500000000000000000000000000000000000000000000000000000000 /* fillOrder */
            {
                appendMakerAddressFromOrder(0)
                addAddressToValidate(signerAddress)
            }
            case 0xd46b02c300000000000000000000000000000000000000000000000000000000 /* cancelOrder */ {}
            default {
                revert(0, 100)
            }

            let addressesToValidate := mload(0x40)
            let nAddressesToValidate := mload(addressesToValidate)
            let newMemFreePtr := add(addressesToValidate, add(0x20, mul(mload(addressesToValidate), 0x20)))
            mstore(0x40, newMemFreePtr)

            /*
            // Validate addresses
            let complianceTokenAddress := sload(COMPLIANCE_TOKEN_slot)
            for {let i := add(0x20, addressesToValidate)} lt(i, add(addressesToValidate, add(32, mul(nAddressesToValidate, 32)))) {i := add(i, 32)} {
                // Construct calldata for `COMPLIANCE_TOKEN.balanceOf`
                mstore(newMemFreePtr, 0x70a0823100000000000000000000000000000000000000000000000000000000)
                mstore(add(4, newMemFreePtr), mload(i))
               
                // call `COMPLIANCE_TOKEN.balanceOf`
                let success := call(
                    gas,                                    // forward all gas
                    complianceTokenAddress,                 // call address of asset proxy
                    0,                                      // don't send any ETH
                    newMemFreePtr,                          // pointer to start of input
                    0x24,                                   // length of input (one padded address) 
                    newMemFreePtr,                          // write output to next free memory offset
                    0x20                                    // reserve space for return balance (0x20 bytes)
                )
                if eq(success, 0) {
                    // Revert with `Error("BALANCE_CHECK_FAILED")` @TODO
                    mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                    mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                    mstore(64, 0x0000001453454e4445525f4e4f545f415554484f52495a454400000000000000)
                    mstore(96, 0)
                    revert(0, 100)
                }

                // Revert if balance not held
                let addressBalance := mload(newMemFreePtr)
                if eq(addressBalance, 0) {
                    // Revert with `Error("AT_LEAST_ONE_ADDRESS_HAS_ZERO_BALANCE")`
                    mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                    mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                    mstore(64, 0x0000002541545f4c454153545f4f4e455f414444524553535f4841535f5a4552)
                    mstore(96, 0x4f5f42414c414e43450000000000000000000000000000000000000000000000)
                    revert(0, 109)
                }
            }*/

            validatedAddresses := addressesToValidate
            selectorS := selector
        }

        emit ValidatedAddresses(selectorS, one, validatedAddresses);
        
        // All entities are verified. Execute fillOrder.
        /*
        EXCHANGE.executeTransaction(
            salt,
            signerAddress,
            signedExchangeTransaction,
            signature
        );*/
    }
}